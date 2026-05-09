import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import connectToDatabase from '@/lib/db';
import Campaign from '@/models/Campaign';
import CampaignLog from '@/models/CampaignLog';
import Contact from '@/models/Contact';
import SmtpAccount from '@/models/SmtpAccount';
import User from '@/models/User';
import nodemailer from 'nodemailer';
import path from 'path';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token) as { userId: string } | null;
  return decoded ? decoded.userId : null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    await connectToDatabase();

    // Fetch user for appUrl settings
    const user = await User.findById(userId);
    
    const host = req.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const fallbackBaseUrl = `${protocol}://${host}`;
    const baseUrl = user?.appUrl || process.env.NEXT_PUBLIC_APP_URL || fallbackBaseUrl;

    const campaign = await Campaign.findOne({ _id: id, userId }).populate('templateId');
    if (!campaign) return NextResponse.json({ error: 'Campaign not found or unauthorized' }, { status: 404 });

    if (campaign.status === 'Completed') {
      const hasRetriable = await CampaignLog.exists({ campaignId: id, status: 'Failed' });
      if (!hasRetriable) {
        return NextResponse.json({ error: 'Campaign already completed with no failed emails to retry' }, { status: 400 });
      }
      // If there are failed logs, we allow it to start again
    }

    const account = await SmtpAccount.findOne({ userId, isDefault: true });
    if (!account) {
      return NextResponse.json(
        { error: 'Default SMTP account not found. Please add one in Settings.' },
        { status: 404 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: account.host,
      port: account.port,
      secure: account.secure,
      auth: {
        user: account.email,
        pass: account.password,
      },
    });

    try {
      await transporter.verify();
    } catch (e) {
      return NextResponse.json({ error: 'SMTP connection failed. Check your settings.' }, { status: 500 });
    }

    // Set campaign to sending
    campaign.status = 'Sending';
    await campaign.save();

    // Fetch logs that need to be sent (Pending or Failed if it's a retry)
    const logs = await CampaignLog.find({
      campaignId: id,
      status: { $in: ['Pending', 'Failed'] }
    }).populate('contactId');

    // Run asynchronously to not block the request for too long (though in Vercel this might timeout if > 10s, 
    // for local/Next.js dev server it's fine). A more robust system would use a queue.
    const sendEmails = async () => {
      let sentCount = campaign.sentCount;
      let failedCount = campaign.failedCount;

      for (const log of logs) {
        const contact = log.contactId as any;
        const template = campaign.templateId as any;

        if (!contact || !contact.email) continue;

        // Replace dynamic variables
        let content = template.content;
        let subject = template.subject;

        const replacements: Record<string, string> = {
          '{{name}}': contact.firstName ? `${contact.firstName} ${contact.lastName || ''}`.trim() : 'there',
          '{{company}}': contact.companyName || 'your company',
          '{{email}}': contact.email,
          '{{date}}': new Date().toLocaleDateString(),
        };

        for (const [key, value] of Object.entries(replacements)) {
          content = content.replace(new RegExp(key, 'g'), value);
          subject = subject.replace(new RegExp(key, 'g'), value);
        }

        const trackingPixel = `<img src="${baseUrl}/api/track/${log._id}/pixel.gif" width="1" height="1" alt="" style="display:none;" />`;
        content = content + trackingPixel;

        // Wrap links for click tracking
        const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi;
        content = content.replace(linkRegex, (match: string, url: string) => {
          // Only track absolute URLs and skip tracking URLs themselves if any
          if (url.startsWith('http') && !url.includes('/api/track/')) {
            const trackedUrl = `${baseUrl}/api/track/${log._id}/click?url=${encodeURIComponent(url)}`;
            return match.replace(url, trackedUrl);
          }
          return match;
        });

        const attachments = [];
        if (campaign.attachmentPath) {
          const filePath = path.join(process.cwd(), 'public', campaign.attachmentPath);
          attachments.push({
            filename: campaign.attachmentName || 'attachment.pdf',
            path: filePath
          });
        } else if (template.attachmentPath) {
          const filePath = path.join(process.cwd(), 'public', template.attachmentPath);
          attachments.push({
            filename: template.attachmentName || 'attachment.pdf',
            path: filePath
          });
        }

        try {
          await transporter.sendMail({
            from: `"${account.email}" <${account.email}>`,
            to: contact.email,
            subject: subject,
            html: content,
            attachments: attachments,
          });

          // If previously failed, decrement failedCount
          if (log.status === 'Failed') failedCount--;

          log.status = 'Sent';
          log.errorMessage = '';
          await log.save();
          sentCount++;
          
        } catch (error: any) {
          if (log.status !== 'Failed') failedCount++;
          log.status = 'Failed';
          log.errorMessage = error.message || 'Unknown error';
          await log.save();

          // Check for Gmail Daily Limit Exceeded error
          if (error.message && (error.message.includes('550-5.4.5') || error.message.includes('sending limit exceeded'))) {
            campaign.status = 'Paused';
            campaign.sentCount = sentCount;
            campaign.failedCount = failedCount;
            await campaign.save();
            return; // Stop the entire sending process for this campaign
          }
        }

        // Update campaign progress periodically or per email
        campaign.sentCount = sentCount;
        campaign.failedCount = failedCount;
        await campaign.save();
      }

      // Final status check
      const remainingLogs = await CampaignLog.countDocuments({ campaignId: id, status: 'Pending' });
      if (remainingLogs === 0) {
        campaign.status = 'Completed';
        await campaign.save();
      } else {
        campaign.status = 'Paused'; // If loop ends but there are still pending
        await campaign.save();
      }
    };

    // Start background process
    sendEmails().catch(console.error);

    return NextResponse.json({ message: 'Campaign started sending' });
  } catch (error) {
    console.error('Failed to start campaign:', error);
    return NextResponse.json(
      { error: 'Failed to start campaign' },
      { status: 500 }
    );
  }
}

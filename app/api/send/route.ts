import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import connectToDatabase from '@/lib/db';
import SmtpAccount from '@/models/SmtpAccount';
import nodemailer from 'nodemailer';
import { z } from 'zod';

// Helper to authenticate request
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token) as { userId: string } | null;
  return decoded ? decoded.userId : null;
}

const sendSchema = z.object({
  smtpAccountId: z.string().optional(), // Use default if not provided
  to: z.string().email('Invalid recipient email'),
  subject: z.string().min(1, 'Subject is required'),
  html: z.string().min(1, 'Email content is required'),
});

export async function POST(req: Request) {
  try {
    const userId = await getAuthUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const result = sendSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      );
    }

    const { smtpAccountId, to, subject, html } = result.data;

    await connectToDatabase();

    // Find SMTP account
    let account;
    if (smtpAccountId) {
      account = await SmtpAccount.findOne({ _id: smtpAccountId, userId });
    } else {
      account = await SmtpAccount.findOne({ userId, isDefault: true });
    }

    if (!account) {
      return NextResponse.json(
        { error: 'SMTP account not found. Please add one in Settings.' },
        { status: 404 }
      );
    }

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: account.host,
      port: account.port,
      secure: account.secure,
      auth: {
        user: account.email,
        pass: account.password,
      },
    });

    // Verify connection configuration
    await transporter.verify();

    // Send email
    const info = await transporter.sendMail({
      from: `"${account.email}" <${account.email}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      html, // html body
    });

    return NextResponse.json({ message: 'Email sent successfully', messageId: info.messageId });
  } catch (error: any) {
    console.error('Send Email error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

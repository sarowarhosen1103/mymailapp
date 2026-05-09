import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import connectToDatabase from '@/lib/db';
import Campaign from '@/models/Campaign';
import CampaignLog from '@/models/CampaignLog';
import Contact from '@/models/Contact';
import SmtpAccount from '@/models/SmtpAccount';
import Template from '@/models/Template';
import mongoose from 'mongoose';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token) as { userId: string } | null;
  return decoded ? decoded.userId : null;
}

export async function GET() {
  try {
    const userId = await getAuthUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Basic Stats
    const [
      totalCampaigns,
      totalContacts,
      totalTemplates,
      totalSmtpAccounts,
    ] = await Promise.all([
      Campaign.countDocuments({ userId: userObjectId }),
      Contact.countDocuments({ userId: userObjectId }),
      Template.countDocuments({ userId: userObjectId }),
      SmtpAccount.countDocuments({ userId: userObjectId }),
    ]);

    // 2. Email Activity Stats (from logs)
    const campaigns = await Campaign.find({ userId: userObjectId }, { _id: 1 });
    const campaignIds = campaigns.map(c => c._id);

    const logs = await CampaignLog.find({ campaignId: { $in: campaignIds } });

    const totalSent = logs.filter(l => l.status === 'Sent').length;
    const totalFailed = logs.filter(l => l.status === 'Failed').length;
    const totalUniqueOpened = logs.filter(l => l.opened).length;
    const totalOpenEvents = logs.reduce((acc, log) => acc + (log.openCount || 0), 0);
    const totalClicked = logs.filter(l => l.clicked).length;
    const totalClickEvents = logs.reduce((acc, log) => acc + (log.clickCount || 0), 0);
    
    // Calculate Rates
    const deliveryRate = totalSent > 0 ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(2) : '0.00';
    const openRate = totalSent > 0 ? ((totalUniqueOpened / totalSent) * 100).toFixed(2) : '0.00';
    const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(2) : '0.00';
    const bounceRate = totalSent > 0 ? ((totalFailed / (totalSent + totalFailed)) * 100).toFixed(2) : '0.00';

    // 3. Time Series Data (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await CampaignLog.aggregate([
      { $match: { campaignId: { $in: campaignIds }, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sent: { $sum: { $cond: [{ $eq: ["$status", "Sent"] }, 1, 0] } },
          uniqueOpened: { $sum: { $cond: ["$opened", 1, 0] } },
          totalOpens: { $sum: { $ifNull: ["$openCount", 0] } },
          uniqueClicked: { $sum: { $cond: ["$clicked", 1, 0] } },
          totalClicks: { $sum: { $ifNull: ["$clickCount", 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$status", "Failed"] }, 1, 0] } }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 4. Geographic Stats (Enhanced)
    const geoStats = await CampaignLog.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      {
        $facet: {
          opens: [
            { $unwind: "$opens" },
            { $match: { "opens.country": { $exists: true, $ne: null } } },
            { $group: { _id: "$opens.country", count: { $sum: 1 } } }
          ],
          clicks: [
            { $unwind: "$clicks" },
            { $match: { "clicks.country": { $exists: true, $ne: null } } },
            { $group: { _id: "$clicks.country", count: { $sum: 1 } } }
          ],
          bounces: [
            { $match: { status: "Failed" } },
            // Since we don't have country for failures, we'll try to find if this contact has opened before
            // For now, we'll return an empty list or mock based on total fails distributed by open volume
            { $group: { _id: "Unknown", count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    // Format geoStats for the frontend
    const formattedGeoStats = geoStats[0].opens.map((o: any) => {
      const clickData = geoStats[0].clicks.find((c: any) => c._id === o._id);
      const clickCount = clickData ? clickData.count : 0;
      
      return {
        _id: o._id,
        opens: o.count,
        clicks: clickCount,
        // Mocking rates for UI demonstration as requested
        openRate: (70 + Math.random() * 20).toFixed(1), 
        clickRate: (o.count > 0 ? (clickCount / o.count) * 100 : 0).toFixed(1),
        bounceRate: (Math.random() * 5).toFixed(1)
      };
    }).sort((a: any, b: any) => b.opens - a.opens);

    // 5. Recent Activity
    const recentActivity = await CampaignLog.find({ campaignId: { $in: campaignIds } })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('contactId', 'email firstName lastName')
      .populate('campaignId', 'name');

    // 6. Campaign Performance
    const campaignPerformance = await Campaign.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    const detailedPerformance = await Promise.all(campaignPerformance.map(async (camp) => {
      const campLogs = await CampaignLog.find({ campaignId: camp._id });
      const sent = campLogs.filter(l => l.status === 'Sent').length;
      const opened = campLogs.filter(l => l.opened).length;
      const clicked = campLogs.filter(l => l.clicked).length;
      const failed = campLogs.filter(l => l.status === 'Failed').length;

      return {
        _id: camp._id,
        name: camp.name,
        status: camp.status,
        sent,
        opened,
        clicked,
        failed,
        openRate: sent > 0 ? ((opened / sent) * 100).toFixed(2) : '0.00',
        clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(2) : '0.00',
        deliveryRate: (sent + failed) > 0 ? ((sent / (sent + failed)) * 100).toFixed(2) : '0.00'
      };
    }));

    // 7. Template Analytics
    const templates = await Template.find({ userId: userObjectId });
    const templatePerformance = await Promise.all(templates.map(async (temp) => {
      const relatedCampaigns = await Campaign.find({ templateId: temp._id }, { _id: 1 });
      const relatedCampaignIds = relatedCampaigns.map(c => c._id);
      
      const tempLogs = await CampaignLog.find({ campaignId: { $in: relatedCampaignIds } });
      const sent = tempLogs.filter(l => l.status === 'Sent').length;
      const opened = tempLogs.filter(l => l.opened).length;
      const clicked = tempLogs.filter(l => l.clicked).length;

      return {
        _id: temp._id,
        name: temp.name,
        usageCount: relatedCampaigns.length,
        sent,
        opened,
        clicked,
        openRate: sent > 0 ? ((opened / sent) * 100).toFixed(2) : '0.00',
        clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(2) : '0.00'
      };
    }));

    return NextResponse.json({
      summary: {
        totalEmailsSent: totalSent,
        totalCampaigns,
        totalContacts,
        totalTemplates,
        totalSmtpAccounts,
        totalUniqueOpened,
        totalOpenEvents,
        totalClicked,
        totalClickEvents,
        totalFailed,
        deliveryRate,
        openRate,
        clickRate,
        bounceRate
      },
      dailyStats,
      geoStats: formattedGeoStats,
      recentActivity,
      campaignPerformance: detailedPerformance,
      templatePerformance: templatePerformance.sort((a, b) => b.usageCount - a.usageCount)
    });

  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

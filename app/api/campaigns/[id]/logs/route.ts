import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Contact from '@/models/Contact';
import Campaign from '@/models/Campaign';
import CampaignLog from '@/models/CampaignLog';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token) as { userId: string } | null;
  return decoded ? decoded.userId : null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    // Verify campaign ownership
    const campaign = await Campaign.findOne({ _id: id, userId });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found or unauthorized' }, { status: 404 });
    }

    const logs = await CampaignLog.find({ campaignId: id })
      .populate('contactId', 'email firstName lastName companyName')
      .sort({ updatedAt: -1 });
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch campaign logs:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign logs' }, { status: 500 });
  }
}

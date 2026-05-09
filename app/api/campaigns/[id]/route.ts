import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Campaign from '@/models/Campaign';
import Template from '@/models/Template';
import ContactGroup from '@/models/ContactGroup';
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
    const campaign = await Campaign.findOne({ _id: id, userId })
      .populate('templateId')
      .populate('groupId');
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found or unauthorized' }, { status: 404 });
    }
    
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Failed to fetch campaign:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    await connectToDatabase();

    const deletedCampaign = await Campaign.findOneAndDelete({ _id: id, userId });

    if (!deletedCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found or unauthorized' },
        { status: 404 }
      );
    }

    // Also delete associated logs
    const CampaignLog = (await import('@/models/CampaignLog')).default;
    await CampaignLog.deleteMany({ campaignId: id });

    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Failed to delete campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Campaign from '@/models/Campaign';
import CampaignLog from '@/models/CampaignLog';
import ContactGroup from '@/models/ContactGroup';
import Template from '@/models/Template';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
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

export async function GET() {
  try {
    const userId = await getAuthUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const campaigns = await Campaign.find({ userId })
      .populate('templateId', 'name subject')
      .populate('groupId', 'name')
      .sort({ createdAt: -1 });
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const templateId = formData.get('templateId') as string;
    const groupId = formData.get('groupId') as string;
    const file = formData.get('attachment') as File | null;

    if (!name || !templateId || !groupId) {
      return NextResponse.json(
        { error: 'Name, templateId, and groupId are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Get the group to know how many contacts there are
    const group = await ContactGroup.findOne({ _id: groupId, userId });
    if (!group) {
      return NextResponse.json({ error: 'Group not found or unauthorized' }, { status: 404 });
    }

    let attachmentPath = '';
    let attachmentName = '';

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      attachmentName = file.name;
      const fileName = `${Date.now()}-${file.name}`;
      const uploadDir = path.join(process.cwd(), 'public', 'attachments');
      
      // Ensure directory exists (though we created it, safe to have this)
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (e) {}

      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      attachmentPath = `/attachments/${fileName}`;
    }

    const totalContacts = group.contacts.length;

    const campaign = await Campaign.create({
      userId,
      name,
      templateId,
      groupId,
      status: 'Draft',
      totalContacts,
      sentCount: 0,
      failedCount: 0,
      attachmentPath,
      attachmentName,
    });

    // Generate Campaign Logs for each contact as 'Pending'
    const logsToCreate = group.contacts.map((contactId: any) => ({
      campaignId: campaign._id,
      contactId,
      status: 'Pending'
    }));

    if (logsToCreate.length > 0) {
      await CampaignLog.insertMany(logsToCreate);
    }

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

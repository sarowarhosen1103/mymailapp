import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
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
    const templates = await Template.find({ userId }).sort({ updatedAt: -1 });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
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
    const subject = formData.get('subject') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as string;
    const status = formData.get('status') as string;
    const file = formData.get('attachment') as File | null;

    if (!name || !subject || !content) {
      return NextResponse.json(
        { error: 'Name, subject, and content are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let attachmentPath = '';
    let attachmentName = '';

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      attachmentName = file.name;
      const fileName = `${Date.now()}-${file.name}`;
      const uploadDir = path.join(process.cwd(), 'public', 'attachments');
      
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (e) {}

      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      attachmentPath = `/attachments/${fileName}`;
    }

    const template = await Template.create({
      userId,
      name,
      subject,
      content,
      category: category || 'Marketing',
      status: status || 'Draft',
      attachmentPath,
      attachmentName,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Failed to create template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

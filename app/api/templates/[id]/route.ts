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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const formData = await req.formData();
    
    const updateData: any = {};
    const fields = ['name', 'subject', 'content', 'category', 'status'];
    fields.forEach(field => {
      const val = formData.get(field);
      if (val !== null) updateData[field] = val;
    });

    const file = formData.get('attachment') as File | null;

    await connectToDatabase();

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      updateData.attachmentName = file.name;
      const fileName = `${Date.now()}-${file.name}`;
      const uploadDir = path.join(process.cwd(), 'public', 'attachments');
      
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (e) {}

      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      updateData.attachmentPath = `/attachments/${fileName}`;
    }

    const updatedTemplate = await Template.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedTemplate) {
      return NextResponse.json(
        { error: 'Template not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('Failed to update template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
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

    const deletedTemplate = await Template.findOneAndDelete({ _id: id, userId });

    if (!deletedTemplate) {
      return NextResponse.json(
        { error: 'Template not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

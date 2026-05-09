import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import connectToDatabase from '@/lib/db';
import Contact from '@/models/Contact';
import { z } from 'zod';
import mongoose from 'mongoose';

// Helper to authenticate request
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token) as { userId: string } | null;
  return decoded ? decoded.userId : null;
}

export async function GET(req: Request) {
  try {
    const userId = await getAuthUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = (page - 1) * limit;

    await connectToDatabase();
    
    // Get total count for pagination
    const totalCount = await Contact.countDocuments({ userId });
    
    // Sort by newest first with pagination
    const contacts = await Contact.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return NextResponse.json({ 
      contacts,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Fetch Contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const contactSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  firstName: z.string().trim().optional().or(z.literal('')),
  lastName: z.string().trim().optional().or(z.literal('')),
  companyName: z.string().trim().optional().or(z.literal('')),
  ceoName: z.string().trim().optional().or(z.literal('')),
  companyEmail: z.string().trim().email().optional().or(z.literal('')),
  companyNumber: z.string().trim().optional().or(z.literal('')),
  website: z.string().trim().optional().or(z.literal('')),
});

const uploadSchema = z.union([contactSchema, z.array(contactSchema)]);

export async function POST(req: Request) {
  try {
    const userId = await getAuthUser();
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Unauthorized or invalid user' }, { status: 401 });
    }

    const body = await req.json();
    const result = uploadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const data = result.data;
    const contactsData = Array.isArray(data) ? data : [data];

    if (contactsData.length === 0) {
      return NextResponse.json({ message: 'No valid contacts to import' }, { status: 400 });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Use bulkWrite for upserting (updating existing or inserting new)
    const operations: any[] = contactsData.map(contact => ({
      updateOne: {
        filter: { userId: userObjectId, email: contact.email },
        update: { $set: { ...contact, userId: userObjectId } },
        upsert: true
      }
    }));

    const bulkResult = await Contact.bulkWrite(operations);

    return NextResponse.json({ 
      message: 'Contacts processed successfully', 
      insertedCount: bulkResult.upsertedCount,
      updatedCount: bulkResult.modifiedCount,
      totalCount: contactsData.length
    });
  } catch (error) {
    console.error('Import Contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const deleteSchema = z.object({
  ids: z.array(z.string())
});

export async function DELETE(req: Request) {
  try {
    const userId = await getAuthUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const result = deleteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const { ids } = result.data;

    if (ids.length === 0) {
      return NextResponse.json({ message: 'No contacts selected for deletion' }, { status: 400 });
    }

    const deleteResult = await Contact.deleteMany({
      _id: { $in: ids },
      userId: userId // Ensure users can only delete their own contacts
    });

    return NextResponse.json({ 
      message: `${deleteResult.deletedCount} contacts deleted successfully`,
      deletedCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('Delete Contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

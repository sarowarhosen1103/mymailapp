import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import connectToDatabase from '@/lib/db';
import Contact from '@/models/Contact';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';

// Helper to authenticate request
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token) as { userId: string } | null;
  return decoded ? decoded.userId : null;
}

const zStringOpt = z.string().trim().optional().or(z.literal(''));
const zEmailOpt = z.string().trim().email().toLowerCase().optional().or(z.literal(''));

const contactSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  firstName: zStringOpt,
  lastName: zStringOpt,
  companyName: zStringOpt,
  ceoName: zStringOpt,
  companyEmail: zEmailOpt,
  companyNumber: zStringOpt,
  website: zStringOpt,
});

export async function POST(req: Request) {
  try {
    const userId = await getAuthUser();
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Unauthorized or invalid user' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mappingStr = formData.get('mapping') as string | null;

    if (!file || !mappingStr) {
      return NextResponse.json({ error: 'File and column mapping are required' }, { status: 400 });
    }

    const mapping = JSON.parse(mappingStr);
    if (!mapping.email) {
      return NextResponse.json({ error: 'Email column mapping is required' }, { status: 400 });
    }

    // 1. Save the file to public/contacts
    const publicContactsDir = path.join(process.cwd(), 'public', 'contacts');
    
    // Ensure directory exists
    if (!fs.existsSync(publicContactsDir)) {
      fs.mkdirSync(publicContactsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const extension = path.extname(file.name).toLowerCase();
    const safeFilename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const filePath = path.join(publicContactsDir, safeFilename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    let rows: any[] = [];

    // 2. Parse the saved file based on extension
    if (extension === '.csv') {
      let fileContent = fs.readFileSync(filePath, 'utf-8');
      // Strip BOM if present
      if (fileContent.charCodeAt(0) === 0xFEFF) {
        fileContent = fileContent.slice(1);
      }
      const parseResult = Papa.parse(fileContent as any, {
        header: true,
        skipEmptyLines: 'greedy',
      });
      if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
        return NextResponse.json({ error: 'Failed to parse CSV file', details: parseResult.errors }, { status: 400 });
      }
      rows = parseResult.data as any[];
    } else if (extension === '.xlsx' || extension === '.xls') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rows = XLSX.utils.sheet_to_json(worksheet);
    } else {
      return NextResponse.json({ error: 'Unsupported file format. Please upload CSV or Excel files.' }, { status: 400 });
    }

    const validContacts: any[] = [];
    const errors: any[] = [];

    // 3. Map columns to fields
    rows.forEach((row, index) => {
      const emailVal = row[mapping.email];
      if (!emailVal) return; // Skip rows without the mapped email value

      const contactObj = {
        email: emailVal,
        firstName: mapping.firstName ? row[mapping.firstName] : undefined,
        lastName: mapping.lastName ? row[mapping.lastName] : undefined,
        companyName: mapping.companyName ? row[mapping.companyName] : undefined,
        ceoName: mapping.ceoName ? row[mapping.ceoName] : undefined,
        companyEmail: mapping.companyEmail ? row[mapping.companyEmail] : undefined,
        companyNumber: mapping.companyNumber ? row[mapping.companyNumber] : undefined,
        website: mapping.website ? row[mapping.website] : undefined,
      };

      const validation = contactSchema.safeParse(contactObj);
      if (validation.success) {
        validContacts.push(validation.data);
      } else {
        const errorMsg = validation.error?.issues?.[0]?.message || 'Invalid format';
        errors.push({ row: index + 1, error: errorMsg });
      }
    });

    if (validContacts.length === 0) {
      console.warn('No valid contacts found. Errors:', errors.slice(0, 3));
      return NextResponse.json({ 
        error: 'No valid contacts found after mapping', 
        details: errors.slice(0, 5) // Send up to 5 validation errors
      }, { status: 400 });
    }

    // 4. Save to MongoDB
    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const operations: any[] = validContacts.map(contact => ({
      updateOne: {
        filter: { userId: userObjectId, email: contact.email },
        update: { $set: { ...contact, userId: userObjectId } },
        upsert: true
      }
    }));

    const bulkResult = await Contact.bulkWrite(operations);

    // Fetch the IDs of all processed contacts so the frontend can assign them to a group
    const emails = validContacts.map(c => c.email.toLowerCase());
    const savedContacts = await Contact.find(
      { userId: userObjectId, email: { $in: emails } },
      { _id: 1 }
    ).lean();
    const contactIds = savedContacts.map((c: any) => c._id.toString());

    return NextResponse.json({ 
      message: 'Contacts imported successfully', 
      insertedCount: bulkResult.upsertedCount,
      updatedCount: bulkResult.modifiedCount,
      totalCount: validContacts.length,
      contactIds,
      savedFile: `/contacts/${safeFilename}`
    });

  } catch (error) {
    console.error('Upload Contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import connectToDatabase from '@/lib/db';
import SmtpAccount from '@/models/SmtpAccount';
import { z } from 'zod';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token) as { userId: string } | null;
  return decoded ? decoded.userId : null;
}

const updateSmtpSchema = z.object({
  host: z.string().min(1).optional(),
  port: z.number().int().positive().optional(),
  email: z.string().email().optional(),
  password: z.string().min(1).optional(),
  secure: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const result = updateSmtpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.issues }, { status: 400 });
    }

    await connectToDatabase();

    // If setting as default, unset others
    if (result.data.isDefault) {
      await SmtpAccount.updateMany({ userId }, { isDefault: false });
    }

    const updatedAccount = await SmtpAccount.findOneAndUpdate(
      { _id: id, userId },
      { $set: result.data },
      { new: true }
    ).select('-password');

    if (!updatedAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Account updated', account: updatedAccount });
  } catch (error) {
    console.error('Update SMTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const deletedAccount = await SmtpAccount.findOneAndDelete({ _id: id, userId });

    if (!deletedAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // If we deleted the default account, make another one default if possible
    if (deletedAccount.isDefault) {
      const nextAccount = await SmtpAccount.findOne({ userId });
      if (nextAccount) {
        nextAccount.isDefault = true;
        await nextAccount.save();
      }
    }

    return NextResponse.json({ message: 'Account deleted' });
  } catch (error) {
    console.error('Delete SMTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import connectToDatabase from '@/lib/db';
import SmtpAccount from '@/models/SmtpAccount';
import { z } from 'zod';

// Helper to authenticate request
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
    const accounts = await SmtpAccount.find({ userId }).select('-password');
    
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Fetch SMTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const smtpSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().positive(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  secure: z.boolean().default(false),
  isDefault: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const userId = await getAuthUser();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const result = smtpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // If setting as default, unset others
    if (result.data.isDefault) {
      await SmtpAccount.updateMany({ userId }, { isDefault: false });
    }

    // Check if it's the first account, make it default automatically
    const count = await SmtpAccount.countDocuments({ userId });
    const isDefault = count === 0 ? true : result.data.isDefault;

    const newAccount = await SmtpAccount.create({
      ...result.data,
      userId,
      isDefault,
    });

    const accountObj = newAccount.toObject();
    delete accountObj.password;

    return NextResponse.json({ message: 'SMTP Account added', account: accountObj });
  } catch (error) {
    console.error('Add SMTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

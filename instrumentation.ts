import connectToDatabase from '@/lib/db';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('⏳ Connecting to MongoDB on startup...');
    try {
      await connectToDatabase();
    } catch (error) {
      console.error('❌ MongoDB connection failed on startup:', error);
    }
  }
}

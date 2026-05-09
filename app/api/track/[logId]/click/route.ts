import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CampaignLog from '@/models/CampaignLog';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ logId: string }> }
) {
  try {
    const { logId } = await params;
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
    }

    await connectToDatabase();

    // Extract headers for real tracking (clicks are not proxied)
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const ipHeader = req.headers.get('x-vercel-forwarded-for') || 
                     req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'Unknown';
    
    const ip = ipHeader.split(',')[0].trim();
    
    // Check multiple headers for country
    let country = req.headers.get('x-vercel-ip-country') || 
                  req.headers.get('cf-ipcountry') || 
                  'Unknown';

    // Update the log entry asynchronously
    const updateLog = async () => {
      try {
        let finalCountry = country;

        // Fallback geolocation
        if (finalCountry === 'Unknown' && ip !== 'Unknown' && !ip.startsWith('127.') && ip !== '::1' && ip !== 'localhost') {
          try {
            const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { cache: 'no-store' });
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              finalCountry = geoData.country_name || geoData.country || 'Unknown';
            }
          } catch (geoErr) {
            console.error('External geolocation fallback failed:', geoErr);
          }
        }

        await CampaignLog.findByIdAndUpdate(logId, {
          $set: { clicked: true },
          $inc: { clickCount: 1 },
          $push: {
            clicks: {
              timestamp: new Date(),
              ip: ip,
              country: finalCountry,
              userAgent: userAgent,
              url: targetUrl
            }
          }
        });
      } catch (err) {
        console.error('Failed to update campaign log click tracking:', err);
      }
    };

    updateLog().catch(console.error);

    // Redirect to the actual destination
    return NextResponse.redirect(targetUrl);

  } catch (error) {
    console.error('Click tracking error:', error);
    // If something fails, try to redirect anyway so the user experience isn't broken
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');
    if (targetUrl) return NextResponse.redirect(targetUrl);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

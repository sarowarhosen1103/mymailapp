import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import CampaignLog from '@/models/CampaignLog';

// A 1x1 transparent GIF (Base64 encoded)
const PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ logId: string }> }
) {
  try {
    const { logId } = await params;
    await connectToDatabase();

    // Extract headers for tracking
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const acceptLanguage = req.headers.get('accept-language') || 'Unknown';
    
    // Use Vercel's specific headers if available, fallback to standard
    const ipHeader = req.headers.get('x-vercel-forwarded-for') || 
                     req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'Unknown';
    
    const ip = ipHeader.split(',')[0].trim();
    
    // Check multiple headers for country
    let country = req.headers.get('x-vercel-ip-country') || 
                  req.headers.get('cf-ipcountry') || 
                  'Unknown';

    // Detect Proxies
    let isProxy = false;
    let proxyType = '';
    if (userAgent.includes('GoogleImageProxy')) {
      isProxy = true;
      proxyType = 'Gmail';
    } else if (userAgent.includes('Yahoo-MailProxy')) {
      isProxy = true;
      proxyType = 'Yahoo';
    } else if (userAgent.includes('Office365-ImageProxy') || userAgent.includes('Outlook-iOS') || userAgent.includes('Outlook-Android')) {
      isProxy = true;
      proxyType = 'Outlook';
    }

    // Update the log entry asynchronously
    const updateLog = async () => {
      try {
        let finalCountry = country;

        // Fallback geolocation if country is unknown and IP is not local
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

        // Add proxy info and language hint to country string if it's a proxy
        if (isProxy) {
          const mainLang = acceptLanguage.split(',')[0].trim();
          // Extract country code from language (e.g. "bn-BD" -> "BD")
          let langHint = '';
          if (mainLang.includes('-')) {
            langHint = mainLang.split('-')[1].toUpperCase();
          } else if (mainLang !== 'Unknown' && mainLang.length === 2) {
            langHint = mainLang.toUpperCase();
          }

          if (langHint && langHint !== 'US') {
            finalCountry = `${finalCountry} (${proxyType} Proxy) [Hint: ${langHint}]`;
          } else {
            finalCountry = `${finalCountry} (${proxyType} Proxy)`;
          }
        }

        await CampaignLog.findByIdAndUpdate(logId, {
          $set: { opened: true },
          $inc: { openCount: 1 },
          $push: {
            opens: {
              timestamp: new Date(),
              ip: ip,
              country: finalCountry,
              userAgent: userAgent,
              acceptLanguage: acceptLanguage,
              isProxy: isProxy,
              proxyType: proxyType
            }
          }
        });
      } catch (err) {
        console.error('Failed to update campaign log open tracking:', err);
      }
    };

    updateLog().catch(console.error);

  } catch (error) {
    console.error('Pixel tracking error:', error);
  }

  // Always return the GIF, even if the DB update fails, so the user experience is uninterrupted
  return new NextResponse(PIXEL_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

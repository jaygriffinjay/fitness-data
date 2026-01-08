import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStravaActivities, refreshStravaToken } from '@/lib/strava';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('strava_access_token')?.value;
    const refreshToken = cookieStore.get('strava_refresh_token')?.value;
    const expiresAt = cookieStore.get('strava_expires_at')?.value;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (expiresAt && parseInt(expiresAt) < now) {
      // Refresh the token
      const tokens = await refreshStravaToken(refreshToken);
      accessToken = tokens.access_token;

      // Update cookies
      cookieStore.set('strava_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: tokens.expires_at - now,
        path: '/',
      });
      
      cookieStore.set('strava_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });

      cookieStore.set('strava_expires_at', tokens.expires_at.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });
    }

    // Fetch all activities by paginating through all pages
    const allActivities: any[] = [];
    let page = 1;
    const perPage = 200; // Max allowed by Strava
    
    while (true) {
      const activities = await getStravaActivities(accessToken, page, perPage);
      allActivities.push(...activities);
      
      // If we got less than perPage activities, we've reached the end
      if (activities.length < perPage) {
        break;
      }
      
      page++;
    }

    return NextResponse.json(allActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

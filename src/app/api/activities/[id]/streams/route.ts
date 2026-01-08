import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStravaActivityStreams, refreshStravaToken } from '@/lib/strava';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if token is expired and refresh if needed
    const now = Math.floor(Date.now() / 1000);
    if (expiresAt && parseInt(expiresAt) < now) {
      const tokens = await refreshStravaToken(refreshToken);
      accessToken = tokens.access_token;

      cookieStore.set('strava_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: tokens.expires_at - now,
        path: '/',
      });
    }

    const activityId = parseInt(id);
    const streams = await getStravaActivityStreams(accessToken, activityId);

    return NextResponse.json(streams);
  } catch (error) {
    console.error('Error fetching activity streams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity streams' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStravaActivities, getStravaActivityStreams } from '@/lib/strava';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strava_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Create directories
    const dataDir = join(process.cwd(), 'data', 'strava', 'raw');
    const activitiesDir = join(dataDir, 'activities');
    const streamsDir = join(dataDir, 'streams');

    await mkdir(activitiesDir, { recursive: true });
    await mkdir(streamsDir, { recursive: true });

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
    
    const results = {
      total: allActivities.length,
      activitiesSaved: 0,
      streamsSaved: 0,
      errors: [] as string[],
    };

    // Save each activity and its streams
    for (const activity of allActivities) {
      try {
        // Save activity summary
        const activityPath = join(activitiesDir, `${activity.id}.json`);
        await writeFile(activityPath, JSON.stringify(activity, null, 2));
        results.activitiesSaved++;

        // Fetch and save streams
        try {
          const streams = await getStravaActivityStreams(accessToken, activity.id);
          const streamsPath = join(streamsDir, `${activity.id}.json`);
          await writeFile(streamsPath, JSON.stringify(streams, null, 2));
          results.streamsSaved++;
        } catch (streamErr) {
          results.errors.push(`Failed to fetch streams for activity ${activity.id}`);
        }
      } catch (err) {
        results.errors.push(`Failed to save activity ${activity.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download data' },
      { status: 500 }
    );
  }
}

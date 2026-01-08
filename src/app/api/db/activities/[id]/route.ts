import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const activityId = parseInt(id, 10);

    // Get activity
    const { data: activityData, error: activityError } = await supabase
      .from('activities')
      .select('id, data')
      .eq('id', activityId)
      .single();

    if (activityError) {
      return Response.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Get streams
    const { data: streamsData, error: streamsError } = await supabase
      .from('streams')
      .select('id, data')
      .eq('activity_id', activityId)
      .single();

    if (streamsError) {
      return Response.json(
        { error: 'Streams not found' },
        { status: 404 }
      );
    }

    return Response.json({
      activity: activityData.data,
      streams: streamsData.data,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { Container, Heading, Stack, Box, Text } from '@/components/Primitives';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Activity {
  id: number;
  distance: number;
  start_date: string;
}

const formatDistance = (meters: number): string => {
  const miles = meters * 0.000621371;
  return miles.toFixed(1);
};

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const getWeekLabel = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export default function StatsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  // Fetch activities
  useEffect(() => {
    async function fetchActivities() {
      try {
        const response = await fetch('/api/db/activities');
        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }
        const data = await response.json();
        setActivities(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  // Calculate weekly data with activity tracking
  const { weeklyData, weeklyActivities } = useMemo(() => {
    const weeks = new Map<string, number>();
    const weekActivities = new Map<string, Activity[]>();

    activities.forEach(activity => {
      const date = new Date(activity.start_date);
      const weekStart = getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];

      weeks.set(weekKey, (weeks.get(weekKey) || 0) + activity.distance);

      if (!weekActivities.has(weekKey)) {
        weekActivities.set(weekKey, []);
      }
      weekActivities.get(weekKey)!.push(activity);
    });

    // Sort by week and convert to array
    const sorted = Array.from(weeks.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, distance]) => ({
        week: getWeekLabel(new Date(key)),
        weekKey: key,
        distance: parseFloat(formatDistance(distance)),
      }));

    return { weeklyData: sorted, weeklyActivities: weekActivities };
  }, [activities]);

  // Get activities for selected week
  const selectedWeekActivities = useMemo(() => {
    if (!selectedWeek) return [];
    return weeklyActivities.get(selectedWeek) || [];
  }, [selectedWeek, weeklyActivities]);

  if (loading) {
    return (
      <Container size="xl">
        <Heading level="1">Stats</Heading>
        <Text>Loading...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl">
        <Heading level="1">Stats</Heading>
        <Text css={{ color: '#d32f2f' }}>Error: {error}</Text>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Heading level="1">Stats</Heading>

        {weeklyData.length === 0 ? (
          <Text>No activity data available</Text>
        ) : (
          <Stack gap="lg">
            <Box padding="lg">
              <Text
                variant="caption"
                css={{ display: 'block', marginBottom: '1rem' }}
              >
                Weekly Distance (miles) - Click a bar to see activities
              </Text>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={weeklyData}
                  onClick={(state: any) => {
                    if (state.activeTooltipIndex !== undefined) {
                      setSelectedWeek(
                        weeklyData[state.activeTooltipIndex].weekKey
                      );
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{
                      value: 'Miles',
                      angle: -90,
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)} mi`}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                    }}
                    cursor={{ fill: 'rgba(252, 76, 2, 0.1)' }}
                  />
                  <Bar
                    dataKey="distance"
                    fill="#fc4c02"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            {selectedWeek && selectedWeekActivities.length > 0 && (
              <Box padding="lg" css={{ backgroundColor: 'rgba(252, 76, 2, 0.05)' }}>
                <Text css={{ fontWeight: 600, marginBottom: '1rem' }}>
                  Activities for week of{' '}
                  {new Date(selectedWeek).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <Stack gap="sm">
                  {selectedWeekActivities
                    .sort(
                      (a, b) =>
                        new Date(b.start_date).getTime() -
                        new Date(a.start_date).getTime()
                    )
                    .map(activity => (
                      <Box
                        key={activity.id}
                        padding="md"
                        css={{
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                        }}
                      >
                        <div
                          css={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <Text css={{ fontWeight: 600, color: '#000' }}>
                              {activity.type}
                            </Text>
                            <Text variant="caption" css={{ color: '#666' }}>
                              {new Date(activity.start_date).toLocaleDateString(
                                'en-US',
                                {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </Text>
                          </div>
                          <Text css={{ fontWeight: 600, color: '#333' }}>
                            {formatDistance(activity.distance)} mi
                          </Text>
                        </div>
                      </Box>
                    ))}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

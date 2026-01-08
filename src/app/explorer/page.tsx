'use client';

import { useEffect, useState, useMemo } from 'react';
import styled from '@emotion/styled';
import {
  Container,
  Heading,
  Paragraph,
  Stack,
  Box,
  Inline,
  Text,
  Divider,
} from '@/components/Primitives';

interface Activity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  start_date: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
}

// Formatting utilities
const formatDistance = (meters: number): string => {
  const miles = meters * 0.000621371;
  return miles.toFixed(2);
};

const formatElevation = (meters: number): string => {
  const feet = meters * 3.28084;
  return Math.round(feet).toString();
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
};

const formatPace = (speedMs: number): string => {
  if (speedMs === 0) return '0:00';
  const metersPerMinute = speedMs * 60;
  const minutesPerMile = 1609.34 / metersPerMinute;
  const minutes = Math.floor(minutesPerMile);
  const seconds = Math.round((minutesPerMile - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Styled components
const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radii.md};
  font-size: ${props => props.theme.fontSizes.body};
  font-family: ${props => props.theme.fonts.body};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
  }
`;

const ActivityCardStyled = styled(Box)<{ isSelected: boolean }>`
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radii.md};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background-color: ${props => props.theme.colors.hover};
  }

  ${props =>
    props.isSelected &&
    `
    border-color: ${props.theme.colors.primary};
    background-color: ${props.theme.colors.primary}10;
  `}
`;

const StatValue = styled(Text)`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
`;

export default function ExplorerPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    null
  );

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

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter(
      activity =>
        activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activities, searchTerm]);

  // Calculate aggregate stats
  const stats = useMemo(() => {
    const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
    const totalTime = activities.reduce((sum, a) => sum + a.moving_time, 0);
    const avgSpeed =
      activities.length > 0
        ? activities.reduce((sum, a) => sum + a.average_speed, 0) /
          activities.length
        : 0;

    return {
      totalActivities: activities.length,
      totalDistance: formatDistance(totalDistance),
      totalTime: formatDuration(totalTime),
      avgPace: formatPace(avgSpeed),
    };
  }, [activities]);

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Heading level="1">Activity Explorer</Heading>

        {/* Stats */}
        <Box
          padding="lg"
          css={{
            backgroundColor: 'rgba(252, 76, 2, 0.05)',
            borderRadius: '8px',
          }}
        >
          <Inline gap="xl" css={{ justifyContent: 'space-between' }}>
            <div>
              <Text variant="caption">Total Activities</Text>
              <StatValue>{stats.totalActivities}</StatValue>
            </div>
            <div>
              <Text variant="caption">Total Distance</Text>
              <StatValue>{stats.totalDistance} mi</StatValue>
            </div>
            <div>
              <Text variant="caption">Total Time</Text>
              <StatValue>{stats.totalTime}</StatValue>
            </div>
            <div>
              <Text variant="caption">Avg Pace</Text>
              <StatValue>{stats.avgPace} /mi</StatValue>
            </div>
          </Inline>
        </Box>

        <Divider />

        {/* Search */}
        <Stack gap="sm">
          <Text variant="caption">Search activities</Text>
          <SearchInput
            type="text"
            placeholder="Search by name or type..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </Stack>

        {/* Loading/Error states */}
        {loading && <Paragraph>Loading activities...</Paragraph>}
        {error && (
          <Paragraph css={{ color: '#d32f2f' }}>Error: {error}</Paragraph>
        )}

        {/* Activities list */}
        {!loading && !error && (
          <Stack gap="md">
            {filteredActivities.length === 0 ? (
              <Paragraph>No activities found</Paragraph>
            ) : (
              filteredActivities.map(activity => (
                <ActivityCardStyled
                  key={activity.id}
                  padding="md"
                  isSelected={selectedActivityId === activity.id}
                  onClick={() => setSelectedActivityId(activity.id)}
                >
                  <Stack gap="sm">
                    <Inline css={{ justifyContent: 'space-between' }}>
                      <div>
                        <Text css={{ fontWeight: 600 }}>{activity.name}</Text>
                        <Text variant="caption" css={{ marginTop: '4px' }}>
                          {formatDate(activity.start_date)} • {activity.type}
                        </Text>
                      </div>
                      <div css={{ textAlign: 'right' }}>
                        {activity.average_heartrate && (
                          <Text variant="caption">
                            ❤️ {activity.average_heartrate} bpm avg
                          </Text>
                        )}
                      </div>
                    </Inline>
                    <Inline gap="lg">
                      <div>
                        <Text variant="caption">Distance</Text>
                        <Text css={{ fontWeight: 500 }}>
                          {formatDistance(activity.distance)} mi
                        </Text>
                      </div>
                      <div>
                        <Text variant="caption">Duration</Text>
                        <Text css={{ fontWeight: 500 }}>
                          {formatDuration(activity.moving_time)}
                        </Text>
                      </div>
                      <div>
                        <Text variant="caption">Pace</Text>
                        <Text css={{ fontWeight: 500 }}>
                          {formatPace(activity.average_speed)} /mi
                        </Text>
                      </div>
                      {activity.total_elevation_gain > 0 && (
                        <div>
                          <Text variant="caption">Elevation</Text>
                          <Text css={{ fontWeight: 500 }}>
                            {formatElevation(activity.total_elevation_gain)} ft
                          </Text>
                        </div>
                      )}
                    </Inline>
                  </Stack>
                </ActivityCardStyled>
              ))
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

'use client';

import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { StravaActivity } from '@/lib/strava';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #333;
`;

const ActivityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ActivityCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ActivityName = styled.h3`
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
  color: #fc4c02;
`;

const ActivityType = styled.span`
  display: inline-block;
  background: #fc4c02;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
`;

const ActivityStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: #666;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const StatLabel = styled.span`
  font-weight: 500;
`;

const StatValue = styled.span`
  color: #333;
`;

const Loading = styled.div`
  text-align: center;
  padding: 3rem;
  font-size: 1.25rem;
  color: #666;
`;

const Error = styled.div`
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 1.5rem;
  color: #c33;
  margin: 2rem 0;
`;

const StravaLink = styled.a`
  color: #fc4c02;
  text-decoration: none;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: inline-block;
  
  &:hover {
    text-decoration: underline;
  }
`;

function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  return `${minutes}m ${secs}s`;
}

function formatPace(meters: number, seconds: number): string {
  const km = meters / 1000;
  const paceSeconds = seconds / km;
  const minutes = Math.floor(paceSeconds / 60);
  const secs = Math.floor(paceSeconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')} /km`;
}

export default function Dashboard() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const response = await fetch('/api/activities');
        
        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = '/';
            return;
          }
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

  if (loading) {
    return (
      <Container>
        <Loading>Loading all your activities... (this might take a moment)</Loading>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Error>Error: {error}</Error>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Your Activities ({activities.length} total)</Title>
      <ActivityGrid>
        {activities.map((activity) => (
          <ActivityCard key={activity.id}>
            <ActivityName>{activity.name}</ActivityName>
            <ActivityType>{activity.type}</ActivityType>
            <ActivityStats>
              <StatRow>
                <StatLabel>Distance:</StatLabel>
                <StatValue>{formatDistance(activity.distance)}</StatValue>
              </StatRow>
              <StatRow>
                <StatLabel>Duration:</StatLabel>
                <StatValue>{formatDuration(activity.moving_time)}</StatValue>
              </StatRow>
              {activity.type === 'Run' && (
                <StatRow>
                  <StatLabel>Pace:</StatLabel>
                  <StatValue>{formatPace(activity.distance, activity.moving_time)}</StatValue>
                </StatRow>
              )}
              {activity.average_heartrate && (
                <StatRow>
                  <StatLabel>Avg HR:</StatLabel>
                  <StatValue>{Math.round(activity.average_heartrate)} bpm</StatValue>
                </StatRow>
              )}
              <StatRow>
                <StatLabel>Elevation:</StatLabel>
                <StatValue>{Math.round(activity.total_elevation_gain)}m</StatValue>
              </StatRow>
            </ActivityStats>
            <StravaLink 
              href={`https://www.strava.com/activities/${activity.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Strava →
            </StravaLink>
          </ActivityCard>
        ))}
      </ActivityGrid>
    </Container>
  );
}

'use client';

import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { StravaActivity } from '@/lib/strava';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #333;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
`;

const Section = styled.div`
  background: white;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #fc4c02;
`;

const ActivitySelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  margin-bottom: 2rem;
  
  &:focus {
    outline: none;
    border-color: #fc4c02;
  }
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 400px;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const PaceChart = styled.svg`
  width: 100%;
  height: 100%;
`;

const Loading = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: #f8f8f8;
  padding: 1rem;
  border-radius: 4px;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.25rem;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
`;

interface StreamData {
  time: number[];
  distance: number[];
  velocity_smooth: number[];
  heartrate?: number[];
  altitude: number[];
}

function formatPace(metersPerSecond: number): string {
  if (metersPerSecond === 0) return '--:--';
  const secondsPerKm = 1000 / metersPerSecond;
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
}

export default function Demo() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<StravaActivity | null>(null);
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStreams, setLoadingStreams] = useState(false);

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
        // Only show runs and walks
        const runWalkActivities = data.filter((a: StravaActivity) => 
          a.type === 'Run' || a.type === 'Walk'
        );
        setActivities(runWalkActivities);
        if (runWalkActivities.length > 0) {
          setSelectedActivity(runWalkActivities[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  useEffect(() => {
    if (!selectedActivity) return;

    async function fetchStreams() {
      setLoadingStreams(true);
      try {
        const response = await fetch(`/api/activities/${selectedActivity.id}/streams`);
        if (!response.ok) {
          throw new Error('Failed to fetch streams');
        }
        const streams = await response.json();
        
        // Strava returns an object with keys as stream types when using key_by_type=true
        const organized: any = {};
        Object.keys(streams).forEach((key) => {
          organized[key] = streams[key].data;
        });
        
        setStreamData(organized);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStreams(false);
      }
    }

    fetchStreams();
  }, [selectedActivity]);

  if (loading) {
    return (
      <Container>
        <Loading>Loading activities...</Loading>
      </Container>
    );
  }

  const runningSegments = streamData ? analyzeRunningSegments(streamData) : null;

  return (
    <Container>
      <Title>Stream Data Visualizations</Title>
      <Subtitle>
        Deep dive into pace, heart rate, and detailed activity analysis
      </Subtitle>

      <Section>
        <SectionTitle>Select Activity</SectionTitle>
        <ActivitySelect
          value={selectedActivity?.id || ''}
          onChange={(e) => {
            const activity = activities.find(a => a.id === parseInt(e.target.value));
            setSelectedActivity(activity || null);
          }}
        >
          {activities.map((activity) => (
            <option key={activity.id} value={activity.id}>
              {activity.name} - {new Date(activity.start_date).toLocaleDateString()} 
              {' '}({(activity.distance / 1000).toFixed(2)}km)
            </option>
          ))}
        </ActivitySelect>

        {selectedActivity && (
          <StatsGrid>
            <StatCard>
              <StatLabel>Distance</StatLabel>
              <StatValue>{(selectedActivity.distance / 1000).toFixed(2)} km</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Moving Time</StatLabel>
              <StatValue>{formatDuration(selectedActivity.moving_time)}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Average Pace</StatLabel>
              <StatValue>{formatPace(selectedActivity.average_speed)}/km</StatValue>
            </StatCard>
            {selectedActivity.average_heartrate && (
              <StatCard>
                <StatLabel>Average HR</StatLabel>
                <StatValue>{Math.round(selectedActivity.average_heartrate)} bpm</StatValue>
              </StatCard>
            )}
          </StatsGrid>
        )}
      </Section>

      {loadingStreams && (
        <Section>
          <Loading>Loading detailed stream data...</Loading>
        </Section>
      )}

      {streamData && !loadingStreams && (
        <>
          <Section>
            <SectionTitle>Pace Over Time</SectionTitle>
            <ChartContainer>
              <PaceLineChart streamData={streamData} />
            </ChartContainer>
          </Section>

          {runningSegments && (
            <Section>
              <SectionTitle>Running Analysis</SectionTitle>
              <StatsGrid>
                <StatCard>
                  <StatLabel>Total Running Time</StatLabel>
                  <StatValue>{formatDuration(runningSegments.totalRunningTime)}</StatValue>
                </StatCard>
                <StatCard>
                  <StatLabel>Total Walking Time</StatLabel>
                  <StatValue>{formatDuration(runningSegments.totalWalkingTime)}</StatValue>
                </StatCard>
                <StatCard>
                  <StatLabel>Avg Running Pace</StatLabel>
                  <StatValue>{formatPace(runningSegments.avgRunningPace)}/km</StatValue>
                </StatCard>
                <StatCard>
                  <StatLabel>Running Segments</StatLabel>
                  <StatValue>{runningSegments.runningSegmentCount}</StatValue>
                </StatCard>
              </StatsGrid>
            </Section>
          )}

          {streamData.heartrate && (
            <Section>
              <SectionTitle>Heart Rate Over Time</SectionTitle>
              <ChartContainer>
                <HeartRateChart streamData={streamData} />
              </ChartContainer>
            </Section>
          )}
        </>
      )}
    </Container>
  );
}

function analyzeRunningSegments(data: StreamData) {
  const RUNNING_PACE_THRESHOLD = 2.2; // m/s (~9:00/km pace or faster = running)
  
  let totalRunningTime = 0;
  let totalWalkingTime = 0;
  let runningDistanceWeightedPace = 0;
  let totalRunningDistance = 0;
  let runningSegmentCount = 0;
  let inRunningSegment = false;

  for (let i = 0; i < data.velocity_smooth.length; i++) {
    const velocity = data.velocity_smooth[i];
    const timeDiff = i > 0 ? data.time[i] - data.time[i - 1] : 1;
    const distance = velocity * timeDiff;

    if (velocity >= RUNNING_PACE_THRESHOLD) {
      totalRunningTime += timeDiff;
      totalRunningDistance += distance;
      runningDistanceWeightedPace += velocity * distance;
      
      if (!inRunningSegment) {
        runningSegmentCount++;
        inRunningSegment = true;
      }
    } else {
      totalWalkingTime += timeDiff;
      inRunningSegment = false;
    }
  }

  const avgRunningPace = totalRunningDistance > 0 
    ? runningDistanceWeightedPace / totalRunningDistance 
    : 0;

  return {
    totalRunningTime,
    totalWalkingTime,
    avgRunningPace,
    runningSegmentCount,
  };
}

function PaceLineChart({ streamData }: { streamData: StreamData }) {
  const width = 1200;
  const height = 400;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Convert velocity (m/s) to pace (min/km), cap GPS outliers at 15 min/km
  const paceData = streamData.velocity_smooth.map((v, i) => ({
    time: streamData.time[i],
    pace: v > 0 ? Math.min(1000 / v / 60, 15) : 15, // cap at 15 min/km to remove GPS noise
  }));

  const maxTime = Math.max(...streamData.time);
  const minPace = 3; // 3 min/km (very fast)
  const maxPace = 12; // 12 min/km (walking)

  const xScale = (time: number) => (time / maxTime) * chartWidth;
  const yScale = (pace: number) => {
    const clampedPace = Math.min(Math.max(pace, minPace), maxPace);
    return chartHeight - ((clampedPace - minPace) / (maxPace - minPace)) * chartHeight;
  };

  const pathData = paceData
    .map((d, i) => {
      const x = xScale(d.time);
      const y = yScale(d.pace);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <PaceChart viewBox={`0 0 ${width} ${height}`}>
      {/* Y-axis labels (pace) */}
      {[4, 5, 6, 7, 8, 9, 10, 11].map((pace) => {
        const y = yScale(pace);
        return (
          <g key={pace}>
            <line
              x1={padding.left}
              y1={padding.top + y}
              x2={padding.left + chartWidth}
              y2={padding.top + y}
              stroke="#e0e0e0"
              strokeWidth="1"
            />
            <text
              x={padding.left - 10}
              y={padding.top + y + 4}
              textAnchor="end"
              fontSize="12"
              fill="#666"
            >
              {pace}:00
            </text>
          </g>
        );
      })}

      {/* X-axis labels (time) */}
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const time = maxTime * fraction;
        const x = xScale(time);
        const minutes = Math.floor(time / 60);
        return (
          <text
            key={fraction}
            x={padding.left + x}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fontSize="12"
            fill="#666"
          >
            {minutes}m
          </text>
        );
      })}

      {/* Pace line */}
      <path
        d={pathData}
        fill="none"
        stroke="#fc4c02"
        strokeWidth="2"
        transform={`translate(${padding.left}, ${padding.top})`}
      />

      {/* Axis labels */}
      <text
        x={padding.left / 2}
        y={height / 2}
        textAnchor="middle"
        fontSize="14"
        fill="#333"
        transform={`rotate(-90, ${padding.left / 2}, ${height / 2})`}
      >
        Pace (min/km)
      </text>
      <text
        x={width / 2}
        y={height - 5}
        textAnchor="middle"
        fontSize="14"
        fill="#333"
      >
        Time
      </text>
    </PaceChart>
  );
}

function HeartRateChart({ streamData }: { streamData: StreamData }) {
  if (!streamData.heartrate) return null;

  const width = 1200;
  const height = 400;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxTime = Math.max(...streamData.time);
  const minHR = Math.min(...streamData.heartrate.filter(hr => hr > 0));
  const maxHR = Math.max(...streamData.heartrate);
  const hrRange = maxHR - minHR;

  const xScale = (time: number) => (time / maxTime) * chartWidth;
  const yScale = (hr: number) => chartHeight - ((hr - minHR) / hrRange) * chartHeight;

  const pathData = streamData.heartrate
    .map((hr, i) => {
      if (hr === 0) return null;
      const x = xScale(streamData.time[i]);
      const y = yScale(hr);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .filter(Boolean)
    .join(' ');

  return (
    <PaceChart viewBox={`0 0 ${width} ${height}`}>
      {/* Y-axis */}
      {[...Array(6)].map((_, i) => {
        const hr = Math.round(minHR + (hrRange / 5) * i);
        const y = yScale(hr);
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={padding.top + y}
              x2={padding.left + chartWidth}
              y2={padding.top + y}
              stroke="#e0e0e0"
              strokeWidth="1"
            />
            <text
              x={padding.left - 10}
              y={padding.top + y + 4}
              textAnchor="end"
              fontSize="12"
              fill="#666"
            >
              {hr}
            </text>
          </g>
        );
      })}

      {/* X-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const time = maxTime * fraction;
        const x = xScale(time);
        const minutes = Math.floor(time / 60);
        return (
          <text
            key={fraction}
            x={padding.left + x}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fontSize="12"
            fill="#666"
          >
            {minutes}m
          </text>
        );
      })}

      {/* HR line */}
      <path
        d={pathData}
        fill="none"
        stroke="#e74c3c"
        strokeWidth="2"
        transform={`translate(${padding.left}, ${padding.top})`}
      />

      {/* Labels */}
      <text
        x={padding.left / 2}
        y={height / 2}
        textAnchor="middle"
        fontSize="14"
        fill="#333"
        transform={`rotate(-90, ${padding.left / 2}, ${height / 2})`}
      >
        Heart Rate (bpm)
      </text>
      <text
        x={width / 2}
        y={height - 5}
        textAnchor="middle"
        fontSize="14"
        fill="#333"
      >
        Time
      </text>
    </PaceChart>
  );
}

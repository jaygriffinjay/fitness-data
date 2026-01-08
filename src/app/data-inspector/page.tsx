'use client';

import { useEffect, useState } from 'react';
import { Container, Heading, Paragraph, Box, Stack, Callout, Code, Text } from '@/components/Primitives';
import { CodeBlock } from '@/components/CodeBlock/CodeBlock';

export default function DataInspector() {
  const [activitySummary, setActivitySummary] = useState<any>(null);
  const [activityStreams, setActivityStreams] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all activities
        const activitiesResponse = await fetch('/api/activities');
        if (!activitiesResponse.ok) {
          if (activitiesResponse.status === 401) {
            window.location.href = '/';
            return;
          }
          throw new Error('Failed to fetch activities');
        }
        
        const activities = await activitiesResponse.json();
        
        // Get the latest activity
        const latestActivity = activities[0];
        setActivitySummary(latestActivity);

        // Fetch streams for the latest activity
        const streamsResponse = await fetch(`/api/activities/${latestActivity.id}/streams`);
        if (!streamsResponse.ok) {
          throw new Error('Failed to fetch streams');
        }
        
        const streams = await streamsResponse.json();
        setActivityStreams(streams);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container size="xl">
        <Box py="xl">
          <Text>Loading data...</Text>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl">
        <Stack spacing="lg">
          <Heading level={1}>Data Inspector</Heading>
          <Callout type="error">
            <Paragraph>Error: {error}</Paragraph>
          </Callout>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack spacing="lg">
        <Box>
          <Heading level={1}>Data Inspector</Heading>
          <Paragraph>
            Raw JSON data from Strava API - This is exactly what you'll store in your database
          </Paragraph>
        </Box>

        <Callout type="info">
          <Paragraph>
            💡 This shows the exact structure of data from Strava API. 
            Save this format in your "raw" layer, then transform it for your application.
          </Paragraph>
        </Callout>

        <Box>
          <Stack spacing="md">
            <Heading level={2}>Activity Summary</Heading>
            <Paragraph>
              From: <Code>/api/v3/athlete/activities</Code>
            </Paragraph>
            <CodeBlock language="json" maxHeight="500px">
              {JSON.stringify(activitySummary, null, 2)}
            </CodeBlock>
          </Stack>
        </Box>

        <Box>
          <Stack spacing="md">
            <Heading level={2}>Activity Streams (Detailed Data)</Heading>
            <Paragraph>
              From: <Code>/api/v3/activities/{'{id}'}/streams</Code>
            </Paragraph>
            <CodeBlock language="json" maxHeight="500px">
              {JSON.stringify(activityStreams, null, 2)}
            </CodeBlock>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}

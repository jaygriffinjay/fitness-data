'use client';

import { useState } from 'react';
import { Container, Heading, Paragraph, Box, Stack, Callout, Text } from '@/components/Primitives';
import styled from '@emotion/styled';

const Button = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.radii.small};
  font-size: ${props => props.theme.fontSizes.base};
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.theme.colors.hover};
  border-radius: ${props => props.theme.radii.small};
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: ${props => props.theme.colors.primary};
  transition: width 0.3s ease;
`;

const StatusText = styled.div`
  font-family: ${props => props.theme.fonts.mono};
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.textSecondary};
`;

interface DownloadResult {
  total: number;
  activitiesSaved: number;
  streamsSaved: number;
  errors: string[];
}

export default function DownloadPage() {
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/download/strava', {
        method: 'POST',
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/';
          return;
        }
        throw new Error('Download failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Container size="md">
      <Stack spacing="lg">
        <Box>
          <Heading level={1}>Download Strava Data</Heading>
          <Paragraph>
            Download all your Strava activities and streams as JSON files.
            Data will be saved to <code>/data/strava/raw/</code>
          </Paragraph>
        </Box>

        <Callout type="info">
          <Paragraph>
            This will download all activities and their detailed stream data (GPS, pace, heart rate, etc.) 
            and save them as JSON files on the server. This may take several minutes depending on how many activities you have.
          </Paragraph>
        </Callout>

        <Box>
          <Button onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Downloading...' : 'Download All Data'}
          </Button>
        </Box>

        {downloading && (
          <Box>
            <Stack spacing="sm">
              <StatusText>Downloading activities and streams...</StatusText>
              <ProgressBar>
                <ProgressFill progress={100} />
              </ProgressBar>
            </Stack>
          </Box>
        )}

        {result && (
          <Callout type="success">
            <Stack spacing="sm">
              <Heading level={3}>Download Complete!</Heading>
              <Paragraph>
                ✅ {result.activitiesSaved} activities saved<br />
                ✅ {result.streamsSaved} stream files saved<br />
                📊 Total activities: {result.total}
              </Paragraph>
              {result.errors.length > 0 && (
                <Box>
                  <Text variant="caption">Errors:</Text>
                  {result.errors.map((err, i) => (
                    <Text key={i} variant="small">{err}</Text>
                  ))}
                </Box>
              )}
            </Stack>
          </Callout>
        )}

        {error && (
          <Callout type="error">
            <Paragraph>Error: {error}</Paragraph>
          </Callout>
        )}

        <Box>
          <Heading level={2}>What happens next?</Heading>
          <Stack spacing="sm">
            <Paragraph>
              1. <strong>Data is saved</strong> - JSON files are in <code>/data/strava/raw/</code>
            </Paragraph>
            <Paragraph>
              2. <strong>Set up database</strong> - Create PostgreSQL schema with raw + transformed tables
            </Paragraph>
            <Paragraph>
              3. <strong>Run ETL</strong> - Transform JSON files into database records
            </Paragraph>
            <Paragraph>
              4. <strong>Build analysis</strong> - Create visualizations and tell stories with your data
            </Paragraph>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}

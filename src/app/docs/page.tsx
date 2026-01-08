'use client';

import { Container, Heading, Paragraph, Box, Stack, Divider, Code, Callout, List, ListItem } from '@/components/Primitives';
import { CodeBlock } from '@/components/CodeBlock/CodeBlock';

export default function ArchitectureDocs() {
  return (
    <Container size="lg">
      <Stack spacing="xl">
        <Box>
          <Heading level={1}>Running Data Platform Architecture</Heading>
          <Paragraph>
            A comprehensive guide to the data architecture, workflow, and technical decisions for this running analytics platform.
          </Paragraph>
        </Box>

        <Divider />

        <Box>
          <Heading level={2}>🎯 Core Philosophy</Heading>
          <Paragraph>
            This platform is built on three foundational principles:
          </Paragraph>
          <List>
            <ListItem><strong>Raw data preservation</strong> - Store original API responses unchanged</ListItem>
            <ListItem><strong>Flexible transformation</strong> - ETL pipeline can be re-run anytime</ListItem>
            <ListItem><strong>Multi-source integration</strong> - Combine Strava, Garmin, and Apple Health data</ListItem>
          </List>
        </Box>

        <Divider />

        <Box>
          <Heading level={2}>📊 Data Sources</Heading>
          <Stack spacing="md">
            <Box>
              <Heading level={3}>Strava API</Heading>
              <Paragraph>
                <strong>What we get:</strong> Running activities with detailed streams (GPS coordinates, pace, heart rate, altitude)
              </Paragraph>
              <Paragraph>
                <strong>Access method:</strong> OAuth 2.0 authentication with activity:read_all scope
              </Paragraph>
              <Paragraph>
                <strong>Data format:</strong> JSON via REST API
              </Paragraph>
              <CodeBlock language="typescript">
{`// Activity summary
GET /api/v3/athlete/activities

// Detailed streams
GET /api/v3/activities/{id}/streams?keys=time,distance,velocity_smooth,heartrate,altitude`}
              </CodeBlock>
            </Box>

            <Box>
              <Heading level={3}>Garmin Connect</Heading>
              <Paragraph>
                <strong>What we get:</strong> Sleep data, HRV, training load, body battery, recovery metrics
              </Paragraph>
              <Paragraph>
                <strong>Access method:</strong> python-garminconnect library (unofficial, uses session authentication)
              </Paragraph>
              <Paragraph>
                <strong>Data format:</strong> JSON via Python script exports
              </Paragraph>
            </Box>

            <Box>
              <Heading level={3}>Apple Health (Future)</Heading>
              <Paragraph>
                <strong>What we get:</strong> Aggregated fitness data, workouts, health metrics
              </Paragraph>
              <Paragraph>
                <strong>Access method:</strong> Export XML from iPhone
              </Paragraph>
              <Paragraph>
                <strong>Data format:</strong> XML export → parse to JSON
              </Paragraph>
            </Box>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Heading level={2}>🏗️ Three-Layer Architecture</Heading>
          <Stack spacing="md">
            <Callout type="info">
              <Paragraph>
                The architecture uses three distinct layers to separate concerns and enable flexible data processing.
              </Paragraph>
            </Callout>

            <Box>
              <Heading level={3}>Layer 1: Raw Storage (File System)</Heading>
              <Paragraph>
                Immutable JSON files stored exactly as received from APIs.
              </Paragraph>
              <CodeBlock language="text">
{`/data/
  strava/
    raw/
      activities/
        12345678.json    # Activity summary
        12345679.json
      streams/
        12345678.json    # Detailed stream data
        12345679.json
  garmin/
    raw/
      sleep/
        2024-01-15.json
      wellness/
        2024-01-15.json`}
              </CodeBlock>
              <Paragraph>
                <strong>Why files?</strong> Permanent backup, can re-run ETL anytime, easy to version control schema changes
              </Paragraph>
            </Box>

            <Box>
              <Heading level={3}>Layer 2: Raw Database (PostgreSQL)</Heading>
              <Paragraph>
                Exact copy of JSON files stored in JSONB columns for querying.
              </Paragraph>
              <CodeBlock language="sql">
{`CREATE TABLE raw_strava_activities (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  fetched_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE raw_strava_streams (
  activity_id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  fetched_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE raw_garmin_sleep (
  date DATE PRIMARY KEY,
  data JSONB NOT NULL,
  fetched_at TIMESTAMP DEFAULT NOW()
);`}
              </CodeBlock>
              <Paragraph>
                <strong>Why duplicate?</strong> Fast JSON queries, backup of files, enables SQL analysis of raw data
              </Paragraph>
            </Box>

            <Box>
              <Heading level={3}>Layer 3: Application Database (PostgreSQL)</Heading>
              <Paragraph>
                Transformed, normalized data optimized for analysis and visualization.
              </Paragraph>
              <CodeBlock language="sql">
{`CREATE TABLE activities (
  id BIGINT PRIMARY KEY,
  source TEXT NOT NULL,              -- 'strava', 'garmin', 'apple'
  external_id TEXT NOT NULL,
  name TEXT,
  type TEXT,                         -- 'Run', 'Walk', etc
  start_time TIMESTAMP NOT NULL,
  distance_meters NUMERIC,
  moving_time_seconds INTEGER,
  elapsed_time_seconds INTEGER,
  total_elevation_gain_meters NUMERIC,
  average_speed_ms NUMERIC,
  max_speed_ms NUMERIC,
  average_heartrate NUMERIC,
  max_heartrate NUMERIC,
  metadata JSONB,                    -- Source-specific extras
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE activity_streams (
  id SERIAL PRIMARY KEY,
  activity_id BIGINT REFERENCES activities(id),
  time_offset_seconds INTEGER[],
  distance_meters NUMERIC[],
  velocity_ms NUMERIC[],
  heartrate INTEGER[],
  altitude_meters NUMERIC[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sleep_sessions (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER,
  deep_sleep_minutes INTEGER,
  light_sleep_minutes INTEGER,
  rem_sleep_minutes INTEGER,
  awake_minutes INTEGER,
  sleep_score INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);`}
              </CodeBlock>
              <Paragraph>
                <strong>Why transform?</strong> Unified schema across sources, optimized queries, typed columns for analysis
              </Paragraph>
            </Box>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Heading level={2}>🔄 ETL Workflow</Heading>
          <Stack spacing="md">
            <Paragraph>
              Extract-Transform-Load pipeline converts raw JSON into application schema.
            </Paragraph>

            <Box>
              <Heading level={3}>Step 1: Extract</Heading>
              <Paragraph>Read JSON files from <Code>/data/strava/raw/</Code></Paragraph>
              <CodeBlock language="typescript">
{`import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const activitiesDir = join(process.cwd(), 'data/strava/raw/activities');
const files = await readdir(activitiesDir);

for (const file of files) {
  const json = await readFile(join(activitiesDir, file), 'utf-8');
  const activity = JSON.parse(json);
  // Process activity...
}`}
              </CodeBlock>
            </Box>

            <Box>
              <Heading level={3}>Step 2: Transform</Heading>
              <Paragraph>Map source fields to unified schema, handle missing data, normalize units</Paragraph>
              <CodeBlock language="typescript">
{`function transformStravaActivity(raw: any) {
  return {
    id: raw.id,
    source: 'strava',
    external_id: String(raw.id),
    name: raw.name,
    type: raw.type,
    start_time: new Date(raw.start_date),
    distance_meters: raw.distance,
    moving_time_seconds: raw.moving_time,
    elapsed_time_seconds: raw.elapsed_time,
    total_elevation_gain_meters: raw.total_elevation_gain,
    average_speed_ms: raw.average_speed,
    max_speed_ms: raw.max_speed,
    average_heartrate: raw.average_heartrate,
    max_heartrate: raw.max_heartrate,
    metadata: {
      gear_id: raw.gear_id,
      workout_type: raw.workout_type,
      kudos_count: raw.kudos_count,
    }
  };
}`}
              </CodeBlock>
            </Box>

            <Box>
              <Heading level={3}>Step 3: Load</Heading>
              <Paragraph>Insert transformed data into PostgreSQL using Drizzle ORM</Paragraph>
              <CodeBlock language="typescript">
{`import { db } from './db';
import { activities } from './schema';

const transformed = transformStravaActivity(raw);

await db.insert(activities)
  .values(transformed)
  .onConflictDoUpdate({
    target: activities.id,
    set: transformed
  });`}
              </CodeBlock>
            </Box>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Heading level={2}>🔗 Multi-Source Deduplication</Heading>
          <Stack spacing="md">
            <Paragraph>
              When same activity exists in multiple sources (e.g., Garmin watch → auto-uploaded to Strava),
              we need fuzzy matching to link records.
            </Paragraph>

            <Callout type="warning">
              <Paragraph>
                <strong>Challenge:</strong> No guaranteed common ID across sources. Must match by timestamp + distance.
              </Paragraph>
            </Callout>

            <Box>
              <Heading level={3}>Matching Algorithm</Heading>
              <CodeBlock language="typescript">
{`function findDuplicates(activity: Activity): Activity[] {
  // Match within 5-minute window and 1% distance tolerance
  const timeWindow = 5 * 60 * 1000; // 5 minutes in ms
  const distanceTolerance = 0.01; // 1%

  return db.query.activities.findMany({
    where: and(
      ne(activities.source, activity.source),
      between(
        activities.start_time,
        new Date(activity.start_time.getTime() - timeWindow),
        new Date(activity.start_time.getTime() + timeWindow)
      ),
      between(
        activities.distance_meters,
        activity.distance_meters * (1 - distanceTolerance),
        activity.distance_meters * (1 + distanceTolerance)
      )
    )
  });
}`}
              </CodeBlock>
            </Box>

            <Box>
              <Heading level={3}>Linking Strategy</Heading>
              <Paragraph>Create many-to-many relationship table:</Paragraph>
              <CodeBlock language="sql">
{`CREATE TABLE activity_links (
  activity_id_1 BIGINT REFERENCES activities(id),
  activity_id_2 BIGINT REFERENCES activities(id),
  confidence NUMERIC, -- 0.0 to 1.0
  PRIMARY KEY (activity_id_1, activity_id_2)
);`}
              </CodeBlock>
              <Paragraph>
                Query either source, get linked data from all sources automatically.
              </Paragraph>
            </Box>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Heading level={2}>🔔 Webhook Integration (Future)</Heading>
          <Stack spacing="md">
            <Paragraph>
              Keep data synced automatically when new activities are uploaded to Strava.
            </Paragraph>

            <Box>
              <Heading level={3}>Setup Process</Heading>
              <List ordered>
                <ListItem>Deploy app to public URL (Vercel, Railway, etc.)</ListItem>
                <ListItem>Register webhook subscription with Strava API</ListItem>
                <ListItem>Handle verification challenge (GET request)</ListItem>
                <ListItem>Process event notifications (POST requests)</ListItem>
              </List>
            </Box>

            <Box>
              <Heading level={3}>Implementation</Heading>
              <CodeBlock language="typescript">
{`// /app/api/webhooks/strava/route.ts

export async function GET(request: Request) {
  // Verification challenge
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(JSON.stringify({ 'hub.challenge': challenge }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  // Event notification
  const event = await request.json();
  
  if (event.object_type === 'activity' && event.aspect_type === 'create') {
    // New activity uploaded
    const activityId = event.object_id;
    
    // Fetch full activity data
    const activity = await fetch(\`https://api.strava.com/api/v3/activities/\${activityId}\`);
    const streams = await fetch(\`https://api.strava.com/api/v3/activities/\${activityId}/streams\`);
    
    // Save to /data/strava/raw/
    // Run ETL
    // Insert to database
  }
  
  return new Response('OK');
}`}
              </CodeBlock>
            </Box>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Heading level={2}>📈 Analysis & Visualization Layer</Heading>
          <Stack spacing="md">
            <Paragraph>
              Once data is in the application database, build custom analysis and storytelling features.
            </Paragraph>

            <Box>
              <Heading level={3}>Planned Features</Heading>
              <List>
                <ListItem><strong>Segment Analysis</strong> - Auto-detect warmup, main run, cooldown based on pace</ListItem>
                <ListItem><strong>Pace Variability</strong> - Coefficient of variation, identify consistent pacing</ListItem>
                <ListItem><strong>Heart Rate Zones</strong> - Time in each zone, training load estimation</ListItem>
                <ListItem><strong>Sleep Correlation</strong> - Performance vs sleep quality/quantity</ListItem>
                <ListItem><strong>Training Load</strong> - TRIMP, acute:chronic workload ratio</ListItem>
                <ListItem><strong>Route Analysis</strong> - Common routes, elevation profiles</ListItem>
                <ListItem><strong>Blog Post Editor</strong> - Write narratives with embedded data visualizations</ListItem>
              </List>
            </Box>

            <Box>
              <Heading level={3}>Technology Stack</Heading>
              <List>
                <ListItem><strong>Next.js 15</strong> - App router, React Server Components</ListItem>
                <ListItem><strong>PostgreSQL</strong> - Neon or Supabase (free tier)</ListItem>
                <ListItem><strong>Drizzle ORM</strong> - Type-safe database queries</ListItem>
                <ListItem><strong>Emotion</strong> - CSS-in-JS styling with primitives</ListItem>
                <ListItem><strong>D3.js or Recharts</strong> - Advanced visualizations</ListItem>
                <ListItem><strong>python-garminconnect</strong> - Garmin data access</ListItem>
              </List>
            </Box>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Heading level={2}>🚀 Implementation Roadmap</Heading>
          <Stack spacing="md">
            <Box>
              <Heading level={3}>Phase 1: Data Collection ✅</Heading>
              <List>
                <ListItem>✅ Strava OAuth integration</ListItem>
                <ListItem>✅ Fetch all activities API</ListItem>
                <ListItem>✅ Stream data API</ListItem>
                <ListItem>✅ Raw JSON data inspector</ListItem>
                <ListItem>✅ Bulk downloader to save files</ListItem>
              </List>
            </Box>

            <Box>
              <Heading level={3}>Phase 2: Database Setup 🚧</Heading>
              <List>
                <ListItem>⏳ Set up PostgreSQL (Neon/Supabase)</ListItem>
                <ListItem>⏳ Define schema with Drizzle ORM</ListItem>
                <ListItem>⏳ Create raw + transformed tables</ListItem>
                <ListItem>⏳ Build ETL scripts</ListItem>
                <ListItem>⏳ Load all Strava data</ListItem>
              </List>
            </Box>

            <Box>
              <Heading level={3}>Phase 3: Garmin Integration 📅</Heading>
              <List>
                <ListItem>⏳ Install python-garminconnect</ListItem>
                <ListItem>⏳ Download sleep data</ListItem>
                <ListItem>⏳ Download wellness metrics</ListItem>
                <ListItem>⏳ Define sleep/wellness schemas</ListItem>
                <ListItem>⏳ ETL for Garmin data</ListItem>
              </List>
            </Box>

            <Box>
              <Heading level={3}>Phase 4: Analysis & Storytelling 📅</Heading>
              <List>
                <ListItem>⏳ Build segment analysis algorithms</ListItem>
                <ListItem>⏳ Create visualization components</ListItem>
                <ListItem>⏳ Sleep-performance correlation</ListItem>
                <ListItem>⏳ Blog post authoring interface</ListItem>
                <ListItem>⏳ Deploy to production</ListItem>
              </List>
            </Box>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Heading level={2}>💡 Key Decisions & Rationale</Heading>
          <Stack spacing="md">
            <Box>
              <Heading level={3}>Why store raw JSON files?</Heading>
              <Paragraph>
                Flexibility. If you change database schema, just re-run ETL. If Strava API changes, you have historical record. Acts as permanent backup.
              </Paragraph>
            </Box>

            <Box>
              <Heading level={3}>Why duplicate in raw database?</Heading>
              <Paragraph>
                Performance. JSONB queries are faster than reading files. Enables SQL analysis of raw data. Provides additional backup layer.
              </Paragraph>
            </Box>

            <Box>
              <Heading level={3}>Why transform to application schema?</Heading>
              <Paragraph>
                Usability. Unified schema across sources enables cross-source queries. Typed columns optimize queries. Normalized structure simplifies analysis code.
              </Paragraph>
            </Box>

            <Box>
              <Heading level={3}>Why PostgreSQL over MongoDB?</Heading>
              <Paragraph>
                JSONB gives schema flexibility when needed, but strong typing for analysis queries. Superior geospatial support for route analysis. Better free tier options (Neon, Supabase).
              </Paragraph>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}

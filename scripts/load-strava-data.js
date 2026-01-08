#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars. Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function loadActivities() {
  console.log('Loading activities...');
  const activitiesDir = path.join(__dirname, '../data/strava/raw/activities');
  const files = fs.readdirSync(activitiesDir).filter(f => f.endsWith('.json'));

  let loaded = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const filePath = path.join(activitiesDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const id = data.id;

      const { error } = await supabase
        .from('activities')
        .upsert({ id, data }, { onConflict: 'id' });

      if (error) {
        console.error(`✗ Failed to load ${file}:`, error.message);
        failed++;
      } else {
        loaded++;
        if (loaded % 50 === 0) {
          console.log(`  ${loaded}/${files.length} activities loaded...`);
        }
      }
    } catch (err) {
      console.error(`✗ Error processing ${file}:`, err.message);
      failed++;
    }
  }

  console.log(`✓ Activities loaded: ${loaded}/${files.length} (${failed} failed)`);
}

async function loadStreams() {
  console.log('\nLoading streams...');
  const streamsDir = path.join(__dirname, '../data/strava/raw/streams');
  const files = fs.readdirSync(streamsDir).filter(f => f.endsWith('.json'));

  let loaded = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const filePath = path.join(streamsDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const id = parseInt(file.replace('.json', ''));

      const { error } = await supabase
        .from('streams')
        .upsert({ id, activity_id: id, data }, { onConflict: 'id' });

      if (error) {
        console.error(`✗ Failed to load ${file}:`, error.message);
        failed++;
      } else {
        loaded++;
        if (loaded % 50 === 0) {
          console.log(`  ${loaded}/${files.length} streams loaded...`);
        }
      }
    } catch (err) {
      console.error(`✗ Error processing ${file}:`, err.message);
      failed++;
    }
  }

  console.log(`✓ Streams loaded: ${loaded}/${files.length} (${failed} failed)`);
}

async function main() {
  console.log('Starting Strava data load...\n');

  try {
    await loadActivities();
    await loadStreams();
    console.log('\n✓ Done!');
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
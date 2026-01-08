# Running Data - Product Vision

## Overview

Transform Strava running data into actionable insights through beautiful, interactive visualizations. Build a free, open-source analytics tool that solves the gaps in Strava's native analysis features.

**Core Thesis**: Strava excels at data collection and social networking, but their analysis and visualization features are weak. We're building the analytics layer on top of everyone's existing Strava data.

## Current State

- ✅ Weekly stats bar chart (analyze distance per week, drilldown to activities)
- ✅ Activity explorer with search/filter
- ✅ Supabase backend with 249 activities loaded for development/testing
- ✅ Working Strava OAuth integration
- ⚠️ Backend-dependent (currently using Supabase DB)

## New Direction: Client-Side First

### Architecture Shift

**Phase 1 (Immediate)**: Convert to localStorage-based client-side analytics
- User lands on site, clicks "Connect with Strava"
- OAuth flow brings user back with Strava auth token
- Frontend fetches all activities from Strava API directly
- Store activities in localStorage (instant, offline-capable)
- All analysis happens in the browser, zero server cost
- Add "Refresh" button to re-sync when new activities are added

**Why this matters**:
- No backend infrastructure needed
- User data never stored on our servers (privacy win)
- Scales infinitely with zero cost
- Can work offline after first load
- Dead simple to deploy (just static hosting)
- Easy to share with friends (they just visit the URL and auth)

### Storage

localStorage will hold ~500-750 KB for 249 activities (well under 5-10 MB limit)

**Data structure**:
```javascript
// localStorage keys
"strava_activities" // JSON array of all activities
"strava_sync_timestamp" // when we last synced
"strava_auth_token" // for refresh button
```

## Feature Roadmap

### MVP Features (Week 1-2)

**Quick Wins** (client-side only):
1. ✅ Weekly distance chart (already built)
2. Monthly breakdown (bar chart by month)
3. Running streaks (current, longest, stats)
4. Pace trends (line chart showing average pace over time)
5. Activity type breakdown (pie chart: runs vs walks vs other)

**Core functionality**:
- Connect with Strava (OAuth)
- Sync all activities to localStorage
- Manual "Refresh data" button
- Clear data button
- Loading states and error handling

### Phase 2 Features (Beyond MVP)

**Segment Analysis**:
- Per-mile pace breakdowns for individual runs
- Identify fastest segments
- Pace distribution visualization

**Personal Records**:
- Best 5K time
- Best 10K time
- Best mile
- Best hour distance
- Route-specific PRs (if same route run multiple times)

**Advanced Insights**:
- Average pace by time of day
- Average pace by day of week
- Elevation analysis (pie chart of easy/moderate/hard elevation)
- Heart rate zones breakdown
- Running form analysis (cadence, stride length if available)

**Export/Share**:
- Download analyses as PNG/SVG for Strava comments
- Generate shareable links to specific analyses
- Export data as CSV

### Phase 3 (Future)

**Multi-source integration** (keep Supabase for this):
- Garmin data import
- Apple Health integration
- Withings/smart scale data
- Correlate running performance with sleep/HR/weight data

**Server-side analysis** (backend needed):
- Machine learning for performance prediction
- Periodization tracking (training cycles)
- Injury pattern detection
- Custom training plan recommendations

## Technical Plan

### Immediate (This Session)

1. Update stats page to fetch from localStorage instead of Supabase
2. Add sync from Strava API on first load
3. Add refresh button
4. Build monthly breakdown feature
5. Build streaks calculator

### Phase 1 Implementation

**File structure**:
```
src/
├── lib/
│   ├── strava.ts          // Strava API client
│   ├── storage.ts         // localStorage helpers
│   └── analytics.ts       // Calculation logic
├── app/
│   ├── page.tsx           // Landing page
│   ├── stats/
│   │   └── page.tsx       // Weekly/monthly stats
│   ├── streaks/
│   │   └── page.tsx       // Streak tracking
│   ├── pace/
│   │   └── page.tsx       // Pace trends
│   └── sync/
│       └── page.tsx       // Data sync UI
└── components/
    └── Primitives.tsx     // (already using these)
```

**Key utilities**:
- `useActivities()` hook: read from localStorage
- `useSyncStrava()` hook: fetch and store from API
- `calculateWeeklyStats()`: group by week
- `calculateStreaks()`: current/longest
- `calculatePace()`: pace calculations

### Dependencies

Already have:
- recharts (charting)
- @supabase/supabase-js (could remove after migration)
- emotion (styling)

No new major deps needed.

## Marketing/Distribution

### Low-effort, high-impact

1. **Post analyses on Strava**
   - Screenshot weekly stats chart, post to activity comments
   - Link back to your tool: "Generated with running-data.xyz"
   - Every analysis post is free marketing

2. **GitHub**
   - Open source the repo
   - Good README with examples
   - Runners love contributing to running tools

3. **Running communities**
   - Post to r/running, r/Strava, r/FitnessTechnology
   - Show before/after: Strava's stats vs your analysis
   - No spam, just share what you built

4. **Twitter/X**
   - Thread about building better Strava stats
   - Show the weekly chart
   - Announce new features

### Why this works

- **Real problem**: Runners want better data analysis (your roommate proved it)
- **Zero barriers**: Users already have Strava, just connect and go
- **Proof in screenshots**: Visual charts beat written descriptions
- **Open source wins**: Free tools get stars, contribute to portfolio

## Success Metrics

- GitHub stars (portfolio signal)
- Daily active users (via localStorage activity)
- Feature requests from community (validation)
- Your roommate actually using it

## Personal Benefits

1. **Portfolio piece**: "Built a data analytics tool, 250+ users"
2. **Resume material**: Full-stack React/API integration, charting, performance
3. **Published work**: Actually shipped and shared something
4. **Community validation**: Real users, real feedback
5. **Real utility**: Use it yourself to understand your running better

## Constraints & Considerations

**Strava API ToS**:
- ✅ Allowed: Fetch user's own data and analyze it
- ✅ Allowed: Share analysis publicly (you're not competing, just extending)
- ❌ Not allowed: Store user data on servers at scale
- ❌ Not allowed: Call yourself "Strava replacement"

**Solution**: Client-side only, positioned as "Strava analytics" not "Strava alternative"

## Next Steps

1. Read Strava API docs for activity fetching
2. Build localStorage persistence layer
3. Convert stats page to use localStorage
4. Add refresh sync from Strava API
5. Build 2-3 more features (monthly, streaks, pace)
6. Deploy to Vercel
7. Write good README
8. Share on GitHub + Reddit

---

**Timeline**: MVP in 1-2 weeks, good enough to share with roommate and communities
**Effort**: Medium (mostly wiring things together, not complex logic)
**Impact**: High (real tool people use, portfolio + GitHub stars)

# Temporal Cognition Module for OpenClaw

A comprehensive temporal awareness plugin that gives OpenClaw agents sophisticated time perception, task estimation, priority scheduling, 24/7 cycle management, and cross-channel synchronization.

## Features

- **Time Perception Engine** - Wall-clock + AI-subjective time tracking
- **Task Time Estimator** - Duration estimation with confidence scoring and learning
- **Temporal Translator** - Human-friendly time communication
- **Priority Scheduler** - Deadline-aware task prioritization
- **24/7 Cycle Manager** - Phase-based operation (active/passive/autonomous/consolidation/maintenance)
- **Cross-Channel Sync** - Unified temporal state across Discord & Telegram
- **Temporal Memory** - Memory decay and relevance scoring

## Quick Install

```bash
# Clone or copy this directory to your machine
cd temporal-cognition-plugin
chmod +x install.sh
./install.sh
```

## Manual Installation

1. **Copy to extensions directory:**
   ```bash
   cp -r temporal-cognition-plugin ~/.openclaw/extensions/temporal-cognition
   cd ~/.openclaw/extensions/temporal-cognition
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build:**
   ```bash
   npm run build
   ```

4. **Register with OpenClaw:**
   ```bash
   openclaw plugins install -l ~/.openclaw/extensions/temporal-cognition
   ```

5. **Add configuration to `~/.openclaw/openclaw.json`:**
   ```json
   {
     "plugins": {
       "enabled": true,
       "entries": {
         "temporal-cognition": {
           "enabled": true,
           "config": {
             "enabled": true,
             "timePerception": { "enabled": true },
             "taskEstimator": { "enabled": true, "learningRate": 0.1 },
             "temporalTranslator": { "enabled": true },
             "priorityScheduler": { "enabled": true },
             "cycleManager": {
               "enabled": true,
               "adaptToUserActivity": true
             },
             "crossChannelSync": {
               "enabled": true,
               "channels": ["discord", "telegram"]
             },
             "temporalMemory": {
               "enabled": true,
               "decayHalfLifeDays": 7
             }
           }
         }
       }
     }
   }
   ```

6. **Restart OpenClaw:**
   ```bash
   openclaw gateway restart
   ```

## Available Tools

| Tool | Description |
|------|-------------|
| `temporal_now` | Get current wall-clock + AI-subjective time + phase |
| `temporal_estimate` | Estimate task duration by category/complexity |
| `temporal_start_task` | Begin tracking a task for learning |
| `temporal_complete_task` | Complete task and record actual duration |
| `temporal_schedule_task` | Add task with deadline and priority |
| `temporal_get_next_task` | Get highest-priority pending task |
| `temporal_list_tasks` | List scheduled tasks by priority |
| `temporal_get_phase` | Get current 24/7 cycle phase info |
| `temporal_translate` | Convert duration to human-readable |
| `temporal_sync_status` | Get cross-channel sync state |
| `temporal_memory_search` | Search with temporal decay scoring |
| `temporal_memory_add` | Add memory with temporal context |

## CLI Commands

```bash
# Check status
openclaw temporal status

# View current phase
openclaw temporal phase

# List tasks
openclaw temporal tasks
```

## Configuration Options

### Time Perception
```json
{
  "timePerception": {
    "enabled": true,
    "subjectiveTimeRatio": 1.0,
    "timezone": "auto",
    "trackProcessingTime": true
  }
}
```

### Task Estimator
```json
{
  "taskEstimator": {
    "enabled": true,
    "learningRate": 0.1,
    "confidenceDecayDays": 30,
    "minSamplesForEstimate": 3
  }
}
```

### Cycle Manager
```json
{
  "cycleManager": {
    "enabled": true,
    "phases": {
      "active": { "start": "08:00", "end": "18:00" },
      "passive": { "start": "18:00", "end": "22:00" },
      "autonomous": { "start": "22:00", "end": "02:00" },
      "consolidation": { "start": "02:00", "end": "04:00" },
      "maintenance": { "start": "04:00", "end": "08:00" }
    },
    "adaptToUserActivity": true
  }
}
```

### Cross-Channel Sync
```json
{
  "crossChannelSync": {
    "enabled": true,
    "syncIntervalMs": 5000,
    "channels": ["discord", "telegram"]
  }
}
```

### Temporal Memory
```json
{
  "temporalMemory": {
    "enabled": true,
    "decayHalfLifeDays": 7,
    "relevanceBoostRecent": 1.5,
    "includeTemporalContext": true
  }
}
```

## Usage Examples

### In Chat
```
User: How long will it take to write a complex report?

Agent: [Uses temporal_estimate with category="writing", complexity="complex"]
       Based on my learning, a complex writing task typically takes about 15-25 minutes 
       (moderate confidence - 65% based on 8 similar tasks).

User: Schedule that report with a deadline of 2 hours from now

Agent: [Uses temporal_schedule_task]
       ✅ Task scheduled with priority 72/100
       - Deadline: 2 hours remaining
       - Estimated: 15-25 minutes
       - Recommendation: Comfortable timeline. Can be scheduled flexibly.
```

### Task Learning Flow
```
Agent: [Uses temporal_start_task] Starting to track this coding task...
       [Does the work]
       [Uses temporal_complete_task] 
       Task completed in 8 minutes. Estimated was 10 minutes.
       Accuracy: 80%. Data recorded for learning.
```

## How It Works

### Time Perception
The plugin tracks two types of time:
- **Wall-clock time**: Actual UTC/timezone time
- **AI-subjective time**: Processing ticks and cycles

### Task Estimation
Uses Bayesian learning to improve estimates over time:
1. Start with baseline estimates per category/complexity
2. Track actual durations when tasks complete
3. Update estimates using weighted averaging
4. Confidence increases with more data points

### Priority Calculation
Priority score (0-100) combines:
- Urgency (40% weight)
- Importance (30% weight)
- Effort/duration (20% weight - shorter = higher)
- Deadline proximity (10% weight)

### 24/7 Cycle Phases
| Phase | Default Hours | Description |
|-------|--------------|-------------|
| Active | 08:00-18:00 | Full engagement, immediate responses |
| Passive | 18:00-22:00 | Responsive, reduced proactive actions |
| Autonomous | 22:00-02:00 | Background processing, batch operations |
| Consolidation | 02:00-04:00 | Memory indexing, cleanup |
| Maintenance | 04:00-08:00 | Minimal activity, await user |

### Memory Decay
Memories decay over time using exponential decay:
- `decayScore = 0.5 ^ (ageDays / halfLifeDays)`
- Frequently accessed memories stay relevant
- Recent memories get a boost in search results

## Troubleshooting

### Plugin not loading
```bash
# Check if registered
openclaw plugins list

# Check logs
openclaw gateway logs | grep temporal
```

### Tools not available
Ensure the plugin is enabled in your config and restart the gateway.

### State not persisting
Check write permissions for `~/.openclaw/temporal-cognition/state.json`

## License

MIT

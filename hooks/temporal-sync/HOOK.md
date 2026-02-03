---
name: temporal-sync
description: "Synchronizes temporal state on session boundaries"
metadata:
  openclaw:
    emoji: "⏰"
    events:
      - "command:new"
      - "command:reset"
---

# Temporal Sync Hook

Ensures temporal state is synchronized when sessions reset or new sessions start.
Records session boundaries for temporal context tracking.

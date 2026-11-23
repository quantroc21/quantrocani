#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PLIST_PATH="$HOME/Library/LaunchAgents/com.anniversary.show.plist"
LABEL="com.anniversary.show"
UID_NUM="$(id -u)"

/bin/launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || /bin/launchctl unload "$PLIST_PATH" 2>/dev/null || true
rm -rf "$PLIST_PATH" "$ROOT/.done" /tmp/anniv_show_running.lock
echo "🧹 Đã gỡ lịch hẹn trình diễn."

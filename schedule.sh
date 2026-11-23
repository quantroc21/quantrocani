#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PLIST_PATH="$HOME/Library/LaunchAgents/com.anniversary.show.plist"
LABEL="com.anniversary.show"
UID_NUM="$(id -u)"

chmod +x "$ROOT/run_now.sh" "$ROOT/schedule.sh" "$ROOT/uninstall.sh" "$ROOT/doctor.sh" 2>/dev/null || true
rm -f "$ROOT/.done"

if [ "${1:-}" = "--test" ] || [ $# -eq 0 ]; then
  TARGET_YEAR=$(date -v+2M "+%Y")
  TARGET_MONTH=$(date -v+2M "+%-m")
  TARGET_DAY=$(date -v+2M "+%-d")
  TARGET_HOUR=$(date -v+2M "+%-H")
  TARGET_MIN=$(date -v+2M "+%-M")
  TARGET_EPOCH=$(date -v+2M -v0S "+%s")
  TARGET_STR=$(date -v+2M "+%H:%M:00 (%d/%m/%Y)")
elif [ $# -eq 4 ]; then
  TARGET_YEAR=$(date "+%Y")
  TARGET_MONTH=$((10#$1))
  TARGET_DAY=$((10#$2))
  TARGET_HOUR=$((10#$3))
  TARGET_MIN=$((10#$4))
  TARGET_ISO=$(printf "%04d-%02d-%02d %02d:%02d:00" "$TARGET_YEAR" "$TARGET_MONTH" "$TARGET_DAY" "$TARGET_HOUR" "$TARGET_MIN")
  TARGET_EPOCH=$(date -j -f "%Y-%m-%d %H:%M:%S" "$TARGET_ISO" "+%s")
  TARGET_STR=$(printf "%02d:%02d:00 (%02d/%02d/%04d)" "$TARGET_HOUR" "$TARGET_MIN" "$TARGET_DAY" "$TARGET_MONTH" "$TARGET_YEAR")
else
  echo "Cách dùng:"
  echo "  bash schedule.sh --test                        # Chạy thử sau 2 phút"
  echo "  bash schedule.sh <THÁNG> <NGÀY> <GIỜ> <PHÚT>   # VD: bash schedule.sh 11 26 0 0"
  exit 1
fi

/bin/launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || /bin/launchctl unload "$PLIST_PATH" 2>/dev/null || true
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$ROOT/run_now.sh</string>
    <string>--wait-unlock</string>
    <string>--once</string>
    <string>--after-epoch=$TARGET_EPOCH</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Month</key>
    <integer>$TARGET_MONTH</integer>
    <key>Day</key>
    <integer>$TARGET_DAY</integer>
    <key>Hour</key>
    <integer>$TARGET_HOUR</integer>
    <key>Minute</key>
    <integer>$TARGET_MIN</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>$ROOT/show.log</string>
  <key>StandardErrorPath</key>
  <string>$ROOT/show.err</string>
</dict>
</plist>
EOF

plutil -lint "$PLIST_PATH"
/bin/launchctl bootstrap "gui/$UID_NUM" "$PLIST_PATH" 2>/dev/null || /bin/launchctl load "$PLIST_PATH"

echo "✅ Đã hẹn giờ trình diễn thành công!"
echo "⏰ Kích hoạt lúc: $TARGET_STR (epoch=$TARGET_EPOCH)"
echo "🛡️  An toàn cả khi máy Sleep / Lock Screen / Shut Down (sẽ tự bật ngay khi mở máy sau giờ G)"
echo "📄 Plist: $PLIST_PATH"

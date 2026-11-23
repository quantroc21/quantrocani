#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PLIST_PATH="$HOME/Library/LaunchAgents/com.anniversary.show.plist"
LABEL="com.anniversary.show"
EXTRA_PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.volta/bin:$HOME/.asdf/shims:$HOME/.local/bin"
if [ -d "$HOME/.nvm/versions/node" ]; then
  NVM_LATEST="$(ls -1 "$HOME/.nvm/versions/node" 2>/dev/null | sort -V | tail -1 || true)"
  if [ -n "$NVM_LATEST" ]; then
    EXTRA_PATH="$HOME/.nvm/versions/node/$NVM_LATEST/bin:$EXTRA_PATH"
  fi
fi
export PATH="$EXTRA_PATH:$PATH"

echo "=== KIỂM TRA SỨC KHỎE SHOW KỶ NIỆM (CHẠY NGẦM, KHÔNG BẬT CỬA SỔ) ==="
echo "📁 Thư mục: $ROOT"
echo "🕒 Giờ máy hiện tại: $(date '+%Y-%m-%d %H:%M:%S %Z')"

# 1. Runtime check
if command -v node >/dev/null 2>&1; then
  echo "✅ Node.js: $(node -v)"
elif [ -x /opt/homebrew/bin/python3 ] || xcode-select -p >/dev/null 2>&1; then
  echo "✅ Python3: $(python3 -V)"
else
  echo "⚠️  Không có Node/Python3 — sẽ dùng chế độ file:// dự phòng"
fi

# 2. Cocoa / WebKit JXA check (silent, no window)
/usr/bin/osascript -l JavaScript -e 'ObjC.import("Cocoa"); ObjC.import("WebKit"); "OK"' >/dev/null && echo "✅ macOS Cocoa + WebKit JXA: OK"

# 3. Date & real assets check
DATE_LINE=$(grep -E "dateLabel:" "$ROOT/web/js/data.js" | head -1)
echo "✅ Ngày trên thư:$DATE_LINE"

MISSING=0
TOTAL=0
while IFS= read -r rel; do
  TOTAL=$((TOTAL + 1))
  if [ ! -s "$ROOT/web/$rel" ]; then
    echo "❌ Thiếu hoặc rỗng: web/$rel"
    MISSING=$((MISSING + 1))
  fi
done < <(grep -oE "assets/real_(photos|videos)/[A-Za-z0-9_.-]+" "$ROOT/web/js/data.js" | sort -u)
echo "✅ Ảnh & video thật: $((TOTAL - MISSING))/$TOTAL file hợp lệ"

# 4. Lock / triggered status
if [ -f "$ROOT/.done" ]; then
  echo "ℹ️  Trạng thái .done: ĐÃ CHẠY RỒI (xóa $ROOT/.done nếu muốn chạy lại)"
else
  echo "✅ Trạng thái .done: Chưa chạy (sẵn sàng kích hoạt)"
fi

# 5. LaunchAgent status
if [ -f "$PLIST_PATH" ]; then
  plutil -lint "$PLIST_PATH" >/dev/null && echo "✅ Plist hợp lệ: $PLIST_PATH"
  grep -A1 -E "Month|Day|Hour|Minute|after-epoch" "$PLIST_PATH" | tr '\n' ' ' | sed 's/  */ /g'
  echo ""
  if launchctl list | grep -q "$LABEL"; then
    echo "✅ LaunchAgent đang nạp trong launchd: $(launchctl list | grep "$LABEL")"
  else
    echo "❌ LaunchAgent CHƯA nạp trong launchd! Hãy chạy lại schedule.sh"
  fi
else
  echo "⚠️  Chưa cài LaunchAgent (chưa chạy schedule.sh)"
fi

# 6. Screen lock state
SCREEN_STATE=$(/usr/bin/osascript -l JavaScript -e '
  ObjC.import("CoreGraphics");
  ObjC.import("Foundation");
  const d = ObjC.castRefToObject($.CGSessionCopyCurrentDictionary());
  if (d.isNil()) { "locked"; }
  else {
    const l = d.objectForKey("CGSSessionScreenIsLocked");
    const c = d.objectForKey("kCGSSessionOnConsoleKey");
    (!l.isNil() && Boolean(ObjC.unwrap(l))) ? "locked" : ((!c.isNil() && Boolean(ObjC.unwrap(c))) ? "unlocked" : "away");
  }
' 2>/dev/null || echo "unknown")
echo "🖥️  Trạng thái màn hình hiện tại: $SCREEN_STATE"

if [ -s "$ROOT/show.log" ]; then
  echo "📜 Log gần nhất:"
  tail -n 5 "$ROOT/show.log"
fi

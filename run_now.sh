#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
DONE_FILE="$ROOT/.done"
LOG_FILE="$ROOT/show.log"
PLIST_PATH="$HOME/Library/LaunchAgents/com.anniversary.show.plist"
LABEL="com.anniversary.show"

WAIT_UNLOCK=0
ONCE=0
SKIP=0
START_PAGE=""
AFTER_EPOCH=0

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$LOG_FILE"
}

for arg in "$@"; do
  case "$arg" in
    --wait-unlock) WAIT_UNLOCK=1 ;;
    --once) ONCE=1 ;;
    --skip) SKIP=1 ;;
    --page=*) START_PAGE="${arg#--page=}" ;;
    --after-epoch=*) AFTER_EPOCH="${arg#--after-epoch=}" ;;
  esac
done

# One-shot guard
if [ "$ONCE" -eq 1 ] && [ -f "$DONE_FILE" ]; then
  exit 0
fi

# Date-guard (allows safe RunAtLoad catch-up after Shut Down without ever firing early!)
if [ "$AFTER_EPOCH" -gt 0 ]; then
  NOW_EPOCH="$(date +%s)"
  if [ "$NOW_EPOCH" -lt "$AFTER_EPOCH" ]; then
    exit 0
  fi
fi

# Prevent duplicate concurrent runs (auto-reclaim stale lock if previous PID died)
LOCK_DIR="/tmp/anniv_show_running.lock"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  OLD_PID="$(cat "$LOCK_DIR/pid" 2>/dev/null || true)"
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    exit 0
  fi
  rm -rf "$LOCK_DIR"
  mkdir "$LOCK_DIR" 2>/dev/null || exit 0
fi
echo "$$" > "$LOCK_DIR/pid"

trap '' HUP
SRV_PID=""
HOST_PID=""
PORT_FILE="/tmp/anniv_port_$$"
cleanup() {
  if [ -n "$HOST_PID" ]; then kill "$HOST_PID" 2>/dev/null || true; fi
  if [ -n "$SRV_PID" ]; then kill "$SRV_PID" 2>/dev/null || true; fi
  rm -f "$PORT_FILE"
  rm -rf "$LOCK_DIR" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

log "Trigger started (wait_unlock=$WAIT_UNLOCK once=$ONCE skip=$SKIP)"

# Wait until the Mac session is active & unlocked (handles Sleep / Lock Screen at 00:00)
if [ "$WAIT_UNLOCK" -eq 1 ]; then
  log "Checking screen lock state..."
  while true; do
    STATE=$(/usr/bin/osascript -l JavaScript -e '
      ObjC.import("CoreGraphics");
      ObjC.import("Foundation");
      const d = ObjC.castRefToObject($.CGSessionCopyCurrentDictionary());
      if (d.isNil()) { "locked"; }
      else {
        const l = d.objectForKey("CGSSessionScreenIsLocked");
        const c = d.objectForKey("kCGSSessionOnConsoleKey");
        const isLocked = !l.isNil() && Boolean(ObjC.unwrap(l));
        const onConsole = !c.isNil() && Boolean(ObjC.unwrap(c));
        (!isLocked && onConsole) ? "ready" : "locked";
      }
    ' 2>/dev/null || echo "locked")
    if [ "$STATE" = "ready" ]; then
      break
    fi
    sleep 2
  done
  log "Screen unlocked and active; pausing 1.2s before launch"
  sleep 1.2
fi

if [ "$ONCE" -eq 1 ]; then
  touch "$DONE_FILE"
fi

# Start local static server: prefer Node (guaranteed with Claude Code), fallback to real Python3, else file://
rm -f "$PORT_FILE"
EXTRA_PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.volta/bin:$HOME/.asdf/shims:$HOME/.local/bin"
if [ -d "$HOME/.nvm/versions/node" ]; then
  NVM_LATEST="$(ls -1 "$HOME/.nvm/versions/node" 2>/dev/null | sort -V | tail -1 || true)"
  if [ -n "$NVM_LATEST" ]; then
    EXTRA_PATH="$HOME/.nvm/versions/node/$NVM_LATEST/bin:$EXTRA_PATH"
  fi
fi
export PATH="$EXTRA_PATH:$PATH"
ANNIV_URL_VAL=""

if command -v node >/dev/null 2>&1; then
  node "$ROOT/tools/serve.mjs" "$ROOT/web" "$PORT_FILE" &
  SRV_PID=$!
  log "Started Node asset server (pid=$SRV_PID)"
elif [ -x /opt/homebrew/bin/python3 ] || [ -x /Library/Frameworks/Python.framework/Versions/Current/bin/python3 ] || xcode-select -p >/dev/null 2>&1; then
  PY_BIN="$(command -v python3)"
  "$PY_BIN" "$ROOT/tools/serve.py" "$ROOT/web" "$PORT_FILE" &
  SRV_PID=$!
  log "Started Python3 asset server (pid=$SRV_PID)"
else
  log "No Node/Python3 found; falling back to direct file:// mode"
fi

if [ -n "$SRV_PID" ]; then
  for _ in $(seq 1 40); do
    if [ -s "$PORT_FILE" ]; then break; fi
    sleep 0.1
  done
  if [ -s "$PORT_FILE" ]; then
    ANNIV_URL_VAL="http://127.0.0.1:$(cat "$PORT_FILE")"
    log "Asset server listening at $ANNIV_URL_VAL"
  else
    log "Warning: local server did not bind in time; falling back to file://"
  fi
fi

export ANNIV_ROOT="$ROOT"
export ANNIV_URL="$ANNIV_URL_VAL"
export ANNIV_SKIP="$SKIP"
export ANNIV_PAGE="$START_PAGE"

log "Launching host.js..."
/usr/bin/osascript -l JavaScript "$ROOT/host.js" &
HOST_PID=$!
wait "$HOST_PID" || true
HOST_PID=""
log "Show exited cleanly."

if [ "$ONCE" -eq 1 ]; then
  UID_NUM="$(id -u)"
  /bin/launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || /bin/launchctl unload "$PLIST_PATH" 2>/dev/null || true
  rm -f "$PLIST_PATH"
  log "Self-cleaned LaunchAgent $LABEL."
fi

#!/usr/bin/env bash
# Rebuilds src/cv.pdf from docs/cv/cv.html using headless Chrome.
set -e
here="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
root="$(cd "$(dirname "$0")/../.." && pwd -W 2>/dev/null || pwd)"
chrome="/c/Program Files/Google/Chrome/Application/chrome.exe"
"$chrome" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$root/src/cv.pdf" "file:///$here/cv.html"

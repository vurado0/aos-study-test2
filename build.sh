#!/usr/bin/env bash
# Baut index.html aus src/ (eine einzige, selbstständige HTML-Datei)
set -e
cd "$(dirname "$0")"
python3 src/i18n/mkdict.py
{ cat src/head.html; echo '<script>'; cat src/app1.js src/app2.js src/app3.js; echo '</script>'; echo '<script>'; cat src/dict.js; echo; cat src/i18n.js; echo '</script>'; echo '</body></html>'; } > index.html
echo "index.html gebaut ($(wc -c < index.html) Byte)"

#!/usr/bin/env bash
# Проверка портфолио: синтаксис движка, горизонтальная прокрутка и ошибки скриптов на четырёх ширинах экрана.
# Запуск: tools/check.sh [путь к chrome-headless-shell]
set -u
cd "$(dirname "$0")/.."
B="${1:-$(ls ~/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | tail -1)}"
[ -x "$B" ] || { echo "Не найден chrome-headless-shell"; exit 2; }
node --check assets/engine.js || exit 1
T=$(mktemp -d); cp -r . "$T/site"; fail=0
probe='<script>addEventListener("error",function(e){document.documentElement.dataset.err=(document.documentElement.dataset.err||"")+e.message+"; "});</script>'
measure='<script>setTimeout(function(){var o=document.getElementById("opener"),r=document.documentElement,a=r.scrollWidth-r.clientWidth;if(o){o.hidden=true;r.classList.remove("locked");document.getElementById("letter").classList.add("entered")}var b=r.scrollWidth-r.clientWidth;r.dataset.res="closed="+a+" open="+b+" sections="+document.querySelectorAll("section").length},400)</script>'
for page in "" pudra/ garden/ mono/ evening/ ticket/ kraft/ finally/; do
  f="$T/site/${page}index.html"
  python3 - "$f" "$probe" "$measure" <<'PY'
import sys
f,probe,measure=sys.argv[1:]
s=open(f,encoding='utf-8').read()
s=s.replace('<head>','<head>'+probe,1).replace('</body>',measure+'</body>',1)
open(f.replace('index.html','check.html'),'w',encoding='utf-8').write(s)
PY
  for w in 375 430 768 1440; do
    out=$(timeout 60 "$B" --no-sandbox --virtual-time-budget=3000 --window-size=$w,900 --dump-dom "file://$T/site/${page}check.html" 2>/dev/null | grep -oE '<html[^>]*>' | head -1)
    res=$(echo "$out" | grep -oE 'data-res="[^"]*"'); err=$(echo "$out" | grep -oE 'data-err="[^"]*"')
    ok=OK; echo "$res" | grep -qE 'closed=0 open=0' || ok=FAIL; [ -n "$err" ] && ok=FAIL
    [ "$ok" = FAIL ] && fail=1
    printf '%-4s /%-9s %5spx  %s %s\n' "$ok" "$page" "$w" "$res" "$err"
  done
done
rm -rf "$T"; exit $fail

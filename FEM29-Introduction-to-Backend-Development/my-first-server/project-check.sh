#!/bin/bash
# Usage: start your server (node server.js) in one terminal, then run in another:  bash project-check.sh
BASE=${1:-http://localhost:3000}
pass=0; fail=0

check() {   # check "description" expected_status expected_text path
  local desc=$1 want_status=$2 want_text=$3 path=$4
  local status
  status=$(curl -s -m 5 -o /tmp/pc-body -w '%{http_code}' "$BASE$path")
  if [ "$status" = "$want_status" ] && grep -qF -- "$want_text" /tmp/pc-body; then
    echo "PASS  $desc"; pass=$((pass+1))
  else
    echo "FAIL  $desc (status $status, expected $want_status containing: $want_text)"; fail=$((fail+1))
  fi
}

check "GET /                      -> 200 and the greeting"       200 "Hello, this is my first Node.js server!" /
check "GET /api/health            -> 200 and status ok"          200 '"status":"ok"'                            /api/health
check "GET /api/greet?name=Amina  -> greets by name"             200 "Hello, Amina!"                            "/api/greet?name=Amina"
check "GET /api/greet             -> default greeting"           200 "Hello, stranger!"                         /api/greet
check "GET /does-not-exist        -> 404 with an error message"  404 "Not found"                                /does-not-exist

ctype=$(curl -s -m 5 -o /dev/null -w '%{content_type}' "$BASE/api/health")
if [[ "$ctype" == application/json* ]]; then echo "PASS  /api/health sends Content-Type: application/json"; pass=$((pass+1))
else echo "FAIL  /api/health Content-Type is '$ctype', expected application/json"; fail=$((fail+1)); fi

echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]

#!/bin/bash
# Usage: start your API (npm start), then in another terminal:  bash task-api-check.sh [base-url]
BASE=${1:-http://localhost:3000}
pass=0; fail=0
TMP=$(mktemp)

ok()   { echo "PASS  $1"; pass=$((pass+1)); }
bad()  { echo "FAIL  $1   ($2)"; fail=$((fail+1)); }

# request METHOD PATH [JSON_BODY]  -> sets STATUS and BODY, and LOCATION when present
request() {
  local method=$1 path=$2 data=$3
  if [ -n "$data" ]; then
    curl -s -i -m 5 -X "$method" -H 'Content-Type: application/json' -d "$data" "$BASE$path" > "$TMP"
  else
    curl -s -i -m 5 -X "$method" "$BASE$path" > "$TMP"
  fi
  tr -d '\r' < "$TMP" > "$TMP.clean"
  STATUS=$(head -n 1 "$TMP.clean" | awk '{print $2}')
  LOCATION=$(grep -i '^location:' "$TMP.clean" | head -n 1 | awk '{print $2}')
  CTYPE=$(grep -i '^content-type:' "$TMP.clean" | head -n 1)
  BODY=$(awk 'BEGIN{b=0} b{print} /^$/{b=1}' "$TMP.clean")
}

expect() { # expect "description" expected_status [expected_text_in_body]
  if [ "$STATUS" = "$2" ] && { [ -z "$3" ] || [[ "$BODY" == *"$3"* ]]; }; then ok "$1"; else bad "$1" "status $STATUS, expected $2${3:+ containing: $3}"; fi
}

request GET /tasks;                                                      expect "GET /tasks -> 200 and a JSON array" 200 "["
[[ "$CTYPE" == *application/json* ]] && ok "GET /tasks sends Content-Type: application/json" || bad "GET /tasks Content-Type" "$CTYPE"

request POST /tasks '{"title":"Check task","completed":false}';         expect "POST /tasks -> 201 with the created task" 201 '"title":"Check task"'
[[ "$LOCATION" =~ ^/tasks/[0-9]+$ ]] && ok "POST /tasks sends a Location header ($LOCATION)" || bad "POST /tasks Location header" "got '$LOCATION'"
TASK_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -n 1 | cut -d: -f2)
TASK_PATH=/tasks/$TASK_ID

request POST /tasks '{"completed":true}';                                expect "POST without a title -> 400" 400
request POST /tasks '{"title": ';                                        expect "POST with malformed JSON -> 400" 400

request GET "$TASK_PATH";                                                expect "GET one task -> 200" 200 '"title":"Check task"'
request GET /tasks/999999;                                               expect "GET a missing task -> 404" 404
request PUT "$TASK_PATH" '{"title":"Changed title","completed":true}';   expect "PUT replaces the task -> 200" 200 '"completed":true'
FIRST=$BODY
request PUT "$TASK_PATH" '{"title":"Changed title","completed":true}'
if [ "$STATUS" = 200 ] && [ "$BODY" = "$FIRST" ] && [[ "$BODY" == *'"completed":true'* ]]; then ok "repeating the same PUT gives the same 200 result (idempotent)"; else bad "PUT idempotency" "status $STATUS; the repeated PUT must also return 200 with the same body"; fi
request DELETE "$TASK_PATH";                                             expect "DELETE -> 204" 204
request DELETE "$TASK_PATH";                                             expect "DELETE again -> 404" 404
request GET "$TASK_PATH";                                                expect "GET the deleted task -> 404" 404
request GET /does-not-exist;                                             expect "unknown route -> 404" 404

echo "$pass passed, $fail failed"
rm -f "$TMP" "$TMP.clean"
[ "$fail" -eq 0 ]

#!/usr/bin/env bash
# Checks a RUNNING Media Library API with curl (the same requests you would send from Postman).
#   npm start            (in one terminal)
#   npm run check        (in another)      or: BASE=http://localhost:4000 bash media-check.sh
# It creates items and deletes them again, so it leaves the library as it found it.
BASE="${BASE:-http://localhost:${PORT:-4000}}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
pass=0; fail=0

printf '\x89PNG\r\n\x1a\n_test_image_' > "$TMP/logo.png"
printf '%%PDF-1.4\n%%test\n' > "$TMP/report.pdf"
printf 'just text' > "$TMP/notes.txt"
head -c $((5 * 1024 * 1024 + 1)) /dev/zero > "$TMP/big.png"

# check "name" expected_status  curl-args...    -> body is left in $BODY
check() {
  local name="$1" want="$2"; shift 2
  local out; out="$(curl -s -o "$TMP/body" -w '%{http_code}' "$@")"
  BODY="$(cat "$TMP/body")"
  if [ "$out" = "$want" ]; then pass=$((pass + 1)); echo "ok    $name ($out)"
  else fail=$((fail + 1)); echo "FAIL  $name: wanted $want, got $out: $BODY"; fi
}
has() { # has "name" "text that must be in the last body"
  if [[ "$BODY" == *"$2"* ]]; then pass=$((pass + 1)); echo "ok    $1"
  else fail=$((fail + 1)); echo "FAIL  $1: '$2' not found in: $BODY"; fi
}
id_of() { sed -E 's/.*"id":"([0-9a-f]{24})".*/\1/' <<<"$BODY"; }

check "server is up"                          200 "$BASE/media?limit=1"
check "upload PNG with metadata"              201 -F "file=@$TMP/logo.png;type=image/png" -F title="Check logo" -F tags="check,logo" -F category=design "$BASE/media"
has   "  stores originalName"                 '"originalName":"logo.png"'
has   "  stores mimeType"                     '"mimeType":"image/png"'
ID1="$(id_of)"
check "upload PDF"                            201 -F "file=@$TMP/report.pdf;type=application/pdf" -F title="Check report" -F tags="check" "$BASE/media"
ID2="$(id_of)"
check "reject missing title"                  400 -F "file=@$TMP/logo.png;type=image/png" "$BASE/media"
has   "  field-level error"                   '"field":"title"'
check "reject invalid category"               400 -F "file=@$TMP/logo.png;type=image/png" -F title=x -F category=memes "$BASE/media"
check "reject unsupported file type"          400 -F "file=@$TMP/notes.txt;type=text/plain" -F title=x "$BASE/media"
check "reject oversized file (> 5 MB)"        400 -F "file=@$TMP/big.png;type=image/png" -F title=x "$BASE/media"
check "reject missing file"                   400 -F title=x "$BASE/media"
check "list with filters"                     200 "$BASE/media?tags=check&category=design"
has   "  finds the PNG"                       '"title":"Check logo"'
check "pagination"                            200 "$BASE/media?limit=1&page=1&sortBy=title&order=asc"
has   "  pagination block"                    '"pagination"'
check "search by title"                       200 "$BASE/media?search=report"
has   "  finds the PDF"                       '"title":"Check report"'
check "reject invalid query (limit=51)"       400 "$BASE/media?limit=51"
check "get one"                               200 "$BASE/media/$ID1"
check "get unknown id -> 404"                 404 "$BASE/media/aaaaaaaaaaaaaaaaaaaaaaaa"
check "get malformed id -> 400"               400 "$BASE/media/nope"
check "update metadata"                       200 -X PUT -H 'Content-Type: application/json' -d '{"title":"Renamed","tags":["a","b"]}' "$BASE/media/$ID1"
has   "  new title"                           '"title":"Renamed"'
check "reject empty update"                   400 -X PUT -H 'Content-Type: application/json' -d '{}' "$BASE/media/$ID1"
check "delete item 1"                         200 -X DELETE "$BASE/media/$ID1"
check "delete item 2"                         200 -X DELETE "$BASE/media/$ID2"
check "deleted item is gone"                  404 "$BASE/media/$ID1"
check "unknown route -> 404 JSON"             404 "$BASE/nope"
has   "  standard error shape"                '"status":"error"'

echo; echo "$pass passed, $fail failed"; [ "$fail" -eq 0 ]

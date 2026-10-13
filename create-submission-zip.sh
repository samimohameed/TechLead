#!/usr/bin/env bash
set -euo pipefail

OUTPUT_ZIP="StockSquares-Submission.zip"

echo "Creating clean submission archive: ${OUTPUT_ZIP}..."

# Remove previous zip if exists
rm -f "${OUTPUT_ZIP}"

# Create zip excluding binaries, dependencies, and build artifacts
zip -r "${OUTPUT_ZIP}" . \
  -x "*.git*" \
  -x "*node_modules*" \
  -x "*/bin/*" \
  -x "*/obj/*" \
  -x "*dist*" \
  -x "*.vs*" \
  -x "*.DS_Store*" \
  -x "${OUTPUT_ZIP}"

echo "Done! Created ${OUTPUT_ZIP} successfully."
ls -lh "${OUTPUT_ZIP}"

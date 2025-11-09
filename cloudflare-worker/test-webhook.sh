#!/bin/bash
# Test webhook endpoint with simulated GitHub payload

WEBHOOK_URL="https://claudegen-bot.mike-be8.workers.dev/webhook"
WEBHOOK_SECRET="RipaJD7e6oP9b4pvLjItpzBnGEPoBVQC"

# Sample GitHub issue comment payload
PAYLOAD='{
  "action": "created",
  "issue": {
    "number": 9,
    "title": "[TEST] Phase 3: Claude API Integration Test",
    "body": "Test issue",
    "html_url": "https://github.com/Mikecranesync/claudegen-coach/issues/9"
  },
  "comment": {
    "id": 9999999,
    "body": "@claude fix src/components/common/Button/Button.tsx\n\nChange padding to 12px",
    "user": {
      "login": "Mikecranesync"
    },
    "html_url": "https://github.com/Mikecranesync/claudegen-coach/issues/9#issuecomment-9999999",
    "created_at": "2025-11-08T23:50:00Z"
  },
  "repository": {
    "name": "claudegen-coach",
    "full_name": "Mikecranesync/claudegen-coach",
    "owner": {
      "login": "Mikecranesync"
    }
  }
}'

# Calculate HMAC-SHA256 signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.*= //')

echo "========================================="
echo "Testing Webhook Endpoint"
echo "========================================="
echo ""
echo "URL: $WEBHOOK_URL"
echo "Signature: sha256=$SIGNATURE"
echo ""
echo "Sending test payload..."
echo ""

# Send POST request with GitHub-style headers
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: issue_comment" \
  -H "X-GitHub-Delivery: test-$(date +%s)" \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  -d "$PAYLOAD" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v

echo ""
echo "========================================="
echo "Check wrangler tail logs for processing"
echo "========================================="

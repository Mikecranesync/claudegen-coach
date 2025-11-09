# PowerShell Webhook Test Script
# Tests the Cloudflare Worker webhook endpoint with a simulated GitHub payload

$webhookUrl = "https://claudegen-bot.mike-be8.workers.dev/webhook"
$webhookSecret = "RipaJD7e6oP9b4pvLjItpzBnGEPoBVQC"

# Sample GitHub issue comment payload
$payload = @'
{
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
}
'@

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Testing Webhook Endpoint" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL: $webhookUrl" -ForegroundColor Yellow
Write-Host ""

# Calculate HMAC-SHA256 signature
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($webhookSecret)
$payloadBytes = [Text.Encoding]::UTF8.GetBytes($payload)
$hash = $hmac.ComputeHash($payloadBytes)
$signature = "sha256=" + [BitConverter]::ToString($hash).Replace("-", "").ToLower()

Write-Host "Signature: $signature" -ForegroundColor Yellow
Write-Host ""
Write-Host "Sending test payload..." -ForegroundColor Green
Write-Host ""

try {
    # Send POST request with GitHub-style headers
    $headers = @{
        "Content-Type" = "application/json"
        "X-GitHub-Event" = "issue_comment"
        "X-GitHub-Delivery" = "test-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
        "X-Hub-Signature-256" = $signature
    }

    $response = Invoke-WebRequest `
        -Uri $webhookUrl `
        -Method POST `
        -Headers $headers `
        -Body $payload `
        -UseBasicParsing

    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "HTTP Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host $response.Content

} catch {
    Write-Host "Response Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Check wrangler tail logs for processing" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Script để test API với Keycloak token

Write-Host "=== Getting token from Keycloak ===" -ForegroundColor Cyan

# Lấy token từ Keycloak
$tokenResponse = curl.exe -s -X POST "http://localhost:8082/auth/realms/master/protocol/openid-connect/token" `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "grant_type=password" `
  -d "client_id=backend" `
  -d "username=52200292" `
  -d "password=153351"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to get token! Exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Response: $tokenResponse" -ForegroundColor Red
    exit 1
}

# Parse JSON response
try {
    $tokenData = $tokenResponse | ConvertFrom-Json
    $token = $tokenData.access_token
    
    if ($token) {
        Write-Host "Token received successfully!" -ForegroundColor Green
        Write-Host "Token (first 50 chars): $($token.Substring(0, [Math]::Min(50, $token.Length)))..." -ForegroundColor Cyan
        
        # Decode token để xem thông tin (không verify, chỉ decode)
        $tokenParts = $token.Split('.')
        if ($tokenParts.Length -eq 3) {
            $payload = $tokenParts[1]
            # Add padding nếu cần
            while ($payload.Length % 4) { $payload += "=" }
            $payloadBytes = [System.Convert]::FromBase64String($payload)
            $payloadJson = [System.Text.Encoding]::UTF8.GetString($payloadBytes)
            $payloadData = $payloadJson | ConvertFrom-Json
            
            Write-Host "`nToken Info:" -ForegroundColor Yellow
            Write-Host "  Issuer: $($payloadData.iss)" -ForegroundColor Gray
            Write-Host "  Audience: $($payloadData.aud)" -ForegroundColor Gray
            Write-Host "  Expires: $([DateTimeOffset]::FromUnixTimeSeconds($payloadData.exp).LocalDateTime)" -ForegroundColor Gray
            Write-Host "  Issued At: $([DateTimeOffset]::FromUnixTimeSeconds($payloadData.iat).LocalDateTime)" -ForegroundColor Gray
            Write-Host "  Current Time: $(Get-Date)" -ForegroundColor Gray
        }
        
        # Test API với token
        Write-Host "`n=== Calling API ===" -ForegroundColor Cyan
        $apiResponse = curl.exe -s -w "`nHTTP Status: %{http_code}`n" "http://localhost:8081/api/student" -H "Authorization: Bearer $token"
        Write-Host $apiResponse
    } else {
        Write-Host "Failed to get token! No access_token in response" -ForegroundColor Red
        Write-Host "Response: $tokenResponse" -ForegroundColor Red
    }
} catch {
    Write-Host "Error parsing token response: $_" -ForegroundColor Red
    Write-Host "Raw response: $tokenResponse" -ForegroundColor Red
}


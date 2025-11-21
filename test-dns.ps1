# DNS Server Test Script
# Kiểm tra DNS server đã config đúng chưa

Write-Host "=== Testing DNS Server Configuration ===" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra DNS server container đang chạy
Write-Host "1. Checking DNS server container status..." -ForegroundColor Yellow
$dnsStatus = docker-compose ps dns-server 2>&1
if ($dnsStatus -match "Up") {
    Write-Host "   [OK] DNS server container is running" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] DNS server container is NOT running!" -ForegroundColor Red
    Write-Host "   Start it with: docker-compose up -d dns-server" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Kiểm tra logs để tìm lỗi cấu hình
Write-Host "2. Checking DNS server logs for errors..." -ForegroundColor Yellow
$logs = docker-compose logs --tail=20 dns-server 2>&1
if ($logs -match "error|Error|ERROR|failed|Failed|FAILED") {
    Write-Host "   [WARN] Warnings/Errors found in logs:" -ForegroundColor Yellow
    $logs | Select-String -Pattern "error|Error|ERROR|failed|Failed|FAILED" | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [OK] No obvious errors in recent logs" -ForegroundColor Green
}
Write-Host ""

# Định nghĩa expected IPs từ zone file
# Note: IPs này phải khớp với IP trong dns-server/zones/db.cloud.local
$expectedIPs = @{
    "frontend.cloud.local" = "172.19.0.2"
    "backend.cloud.local" = "172.19.0.7"
    "auth.cloud.local" = "172.19.0.6"
    "database.cloud.local" = "172.19.0.10"
    "storage.cloud.local" = "172.19.0.4"
    "ns.cloud.local" = "172.19.0.8"
}

# Test các DNS records từ zone cloud.local
# Note: DNS server container không có nslookup/dig, nên test từ container khác
Write-Host "3. Testing DNS resolution for all records from backend container..." -ForegroundColor Yellow
Write-Host "   (Comparing resolved IPs with zone file configuration)" -ForegroundColor Gray
$records = @(
    "frontend.cloud.local",
    "backend.cloud.local", 
    "auth.cloud.local",
    "database.cloud.local",
    "storage.cloud.local",
    "ns.cloud.local"
)

$successCount = 0
$failCount = 0
$warningCount = 0

foreach ($record in $records) {
    Write-Host "   Testing: $record" -NoNewline
    
    # Test từ backend container (có nslookup)
    $result = docker-compose exec -T backend sh -c "nslookup $record dns-server 2>&1" 2>&1
    
    if ($result -match "Address:|Name:") {
        # Lấy IP address từ kết quả (bỏ qua dòng Address đầu tiên - đó là DNS server IP)
        # Lấy dòng Address thứ 2 (sau dòng Name) - đó là IP của domain
        $ipMatch = $result | Select-String -Pattern "Address:\s+(\d+\.\d+\.\d+\.\d+)$" | ForEach-Object { $_.Matches.Groups[1].Value } | Select-Object -Last 1
        
        if ($ipMatch) {
            # So sánh với expected IP
            $expectedIP = $expectedIPs[$record]
            if ($expectedIP -and $ipMatch -eq $expectedIP) {
                Write-Host " - [OK] IP matches zone file ($ipMatch)" -ForegroundColor Green
                $successCount++
            } elseif ($expectedIP) {
                Write-Host " - [WARN] IP mismatch! Expected: $expectedIP, Got: $ipMatch" -ForegroundColor Yellow
                $warningCount++
            } else {
                Write-Host " - [OK] Resolved to $ipMatch (no expected IP defined)" -ForegroundColor Green
                $successCount++
            }
        } else {
            Write-Host " - [FAIL] Could not extract IP from result" -ForegroundColor Red
            $failCount++
        }
    } else {
        Write-Host " - [FAIL] DNS resolution failed" -ForegroundColor Red
        $failCount++
    }
}
Write-Host "   Result: $successCount successful, $warningCount warnings, $failCount failed" -ForegroundColor $(if ($failCount -eq 0 -and $warningCount -eq 0) { "Green" } elseif ($failCount -eq 0) { "Yellow" } else { "Red" })
Write-Host ""

# Test DNS từ frontend container (cross-container test)
Write-Host "4. Testing DNS resolution from frontend container (cross-container test)..." -ForegroundColor Yellow
try {
    $frontendTest = docker-compose exec -T frontend sh -c "nslookup backend.cloud.local dns-server 2>&1 || ping -c 1 backend.cloud.local 2>&1" 2>&1
    
    $testResult = $frontendTest | Select-String -Pattern "backend|172\.|64 bytes|PING"
    if ($testResult) {
        Write-Host "   [OK] DNS resolution works from frontend to backend" -ForegroundColor Green
        $testResult | Select-Object -First 2 | ForEach-Object {
            Write-Host "     $_" -ForegroundColor Gray
        }
    } else {
        Write-Host "   [FAIL] DNS resolution failed from frontend container" -ForegroundColor Red
    }
} catch {
    Write-Host "   [WARN] Could not test from frontend container: $_" -ForegroundColor Yellow
}
Write-Host ""

# Kiểm tra cấu hình Bind9
Write-Host "5. Validating Bind9 configuration files..." -ForegroundColor Yellow

# Kiểm tra named.conf
docker-compose exec -T dns-server named-checkconf /etc/bind/named.conf 2>&1 | Out-Null
$configCheckExitCode = $LASTEXITCODE
$configCheck = docker-compose exec -T dns-server named-checkconf /etc/bind/named.conf 2>&1
if ($configCheckExitCode -eq 0) {
    Write-Host "   [OK] named.conf is valid" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] named.conf has errors!" -ForegroundColor Red
    Write-Host "   $configCheck" -ForegroundColor Yellow
}

# Kiểm tra zone cloud.local
docker-compose exec -T dns-server named-checkzone cloud.local /etc/bind/zones/db.cloud.local 2>&1 | Out-Null
$zoneCheckExitCode = $LASTEXITCODE
$zoneCheck = docker-compose exec -T dns-server named-checkzone cloud.local /etc/bind/zones/db.cloud.local 2>&1
if ($zoneCheckExitCode -eq 0) {
    Write-Host "   [OK] Zone cloud.local is valid" -ForegroundColor Green
    if ($zoneCheck -match "OK") {
        $zoneCheck | Select-String -Pattern "OK" | ForEach-Object {
            Write-Host "     $_" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "   [FAIL] Zone cloud.local has errors!" -ForegroundColor Red
    Write-Host "   $zoneCheck" -ForegroundColor Yellow
}

# Kiểm tra zone localhost
docker-compose exec -T dns-server named-checkzone localhost /etc/bind/zones/db.localhost 2>&1 | Out-Null
$localhostCheckExitCode = $LASTEXITCODE
$localhostCheck = docker-compose exec -T dns-server named-checkzone localhost /etc/bind/zones/db.localhost 2>&1
if ($localhostCheckExitCode -eq 0) {
    Write-Host "   [OK] Zone localhost is valid" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Zone localhost has errors!" -ForegroundColor Red
    Write-Host "   $localhostCheck" -ForegroundColor Yellow
}
Write-Host ""

# Kiểm tra files có được mount đúng không
Write-Host "6. Checking if zone files are mounted correctly..." -ForegroundColor Yellow
$zoneFiles = docker-compose exec -T dns-server ls -la /etc/bind/zones/ 2>&1
if ($zoneFiles -match "db.cloud.local|db.localhost") {
    Write-Host "   [OK] Zone files are present" -ForegroundColor Green
    $zoneFiles | Select-String -Pattern "db\." | ForEach-Object {
        Write-Host "     $_" -ForegroundColor Gray
    }
} else {
    Write-Host "   [FAIL] Zone files not found!" -ForegroundColor Red
}
Write-Host ""

# Kiểm tra IP thực tế của containers và so sánh với zone file
Write-Host "6b. Comparing actual container IPs with zone file configuration..." -ForegroundColor Yellow
$servicesToCheck = @{
    "frontend" = "172.19.0.2"
    "backend" = "172.19.0.7"
    "auth" = "172.19.0.6"
    "database" = "172.19.0.10"
    "storage-server" = "172.19.0.4"
    "dns-server" = "172.19.0.8"
}

$ipMismatches = 0
$ipMatches = 0

foreach ($serviceName in $servicesToCheck.Keys) {
    $expectedIP = $servicesToCheck[$serviceName]
    
    # Lấy IP thực tế của container
    try {
        $containerName = "minicloud-$($serviceName -replace '_', '-')-1"
        $actualIP = docker inspect $containerName --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>&1
        
        if ($actualIP -match '^\d+\.\d+\.\d+\.\d+$') {
            if ($actualIP -eq $expectedIP) {
                Write-Host "   [OK] $serviceName : $actualIP (matches zone file)" -ForegroundColor Green
                $ipMatches++
            } else {
                Write-Host "   [WARN] $serviceName : Actual=$actualIP, Expected=$expectedIP" -ForegroundColor Yellow
                $ipMismatches++
            }
        } else {
            Write-Host "   [SKIP] $serviceName : Could not get IP (container may not exist)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   [SKIP] $serviceName : Error checking IP" -ForegroundColor Gray
    }
}

if ($ipMismatches -eq 0) {
    Write-Host "   Summary: All container IPs match zone file!" -ForegroundColor Green
} else {
    Write-Host "   Summary: $ipMismatches IP(s) do not match zone file (this is OK if Docker assigned different IPs)" -ForegroundColor Yellow
}
Write-Host ""

# Kiểm tra xem DNS server có đang listen trên port 53 không
Write-Host "7. Checking DNS server is listening on port 53..." -ForegroundColor Yellow
$dnsListening = docker-compose exec -T dns-server sh -c 'netstat -tuln 2>&1 | grep ":53 " || ss -tuln 2>&1 | grep ":53 "' 2>&1
if ($dnsListening -match ":53") {
    Write-Host "   [OK] DNS server is listening on port 53" -ForegroundColor Green
} else {
    Write-Host "   [WARN] Could not verify DNS server is listening on port 53" -ForegroundColor Yellow
    Write-Host "   (This may be normal if netstat/ss is not available in container)" -ForegroundColor Gray
}
Write-Host ""

# Tổng kết
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
$configValid = ($configCheckExitCode -eq 0)
$totalIssues = $failCount + $warningCount
if (($failCount -eq 0) -and $configValid -and ($warningCount -eq 0)) {
    Write-Host '[SUCCESS] DNS server is configured correctly!' -ForegroundColor Green
    Write-Host '  ✓ All DNS records resolve correctly' -ForegroundColor Green
    Write-Host '  ✓ IPs match zone file configuration' -ForegroundColor Green
    Write-Host '  ✓ Bind9 configuration is valid' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Next steps:' -ForegroundColor Yellow
    Write-Host '  - Test from other containers: docker-compose exec backend nslookup frontend.cloud.local dns-server' -ForegroundColor Gray
    Write-Host '  - Check DNS logs: docker-compose logs -f dns-server' -ForegroundColor Gray
}
elseif (($failCount -eq 0) -and $configValid -and ($warningCount -gt 0)) {
    Write-Host '[WARNING] DNS server is configured but some IPs do not match zone file.' -ForegroundColor Yellow
    Write-Host '  ⚠ This may be normal if Docker assigned different IPs to containers.' -ForegroundColor Yellow
    Write-Host '  ⚠ Update zone file (db.cloud.local) to match actual container IPs if required.' -ForegroundColor Yellow
}
else {
    Write-Host '[FAIL] Some issues detected. Please review the output above.' -ForegroundColor Red
    Write-Host ''
    Write-Host 'Troubleshooting:' -ForegroundColor Yellow
    Write-Host '  - Check logs: docker-compose logs dns-server' -ForegroundColor Gray
    Write-Host '  - Verify zone file IPs match container IPs:' -ForegroundColor Gray
    Write-Host '    docker inspect minicloud-frontend-1' -ForegroundColor Gray
    Write-Host '  - Restart DNS server: docker-compose restart dns-server' -ForegroundColor Gray
    Write-Host '  - Rebuild if required: docker-compose up -d --build dns-server' -ForegroundColor Gray
}



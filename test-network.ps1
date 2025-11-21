# Network Connectivity Test Script
# Kiểm tra thông mạng giữa các containers trong Docker network bằng ping

param(
    [string]$FromContainer = "backend",
    [int]$PingCount = 3
)

Write-Host "=== Network Connectivity Test ===" -ForegroundColor Cyan
Write-Host "Pinging from container: $FromContainer" -ForegroundColor Yellow
Write-Host "Ping count: $PingCount" -ForegroundColor Yellow
Write-Host ""

# Danh sách các services cần ping (tên service trong docker-compose.yml)
$services = @(
    "frontend",
    "backend",
    "auth",
    "database",
    "storage-server",
    "dns-server",
    "monitoring-prometheus-server",
    "monitoring-node-exporter-server",
    "logging-server",
    "proxy"
)

# Mapping service names với domain names (nếu có trong DNS)
$serviceDomains = @{
    "frontend" = "frontend.cloud.local"
    "backend" = "backend.cloud.local"
    "auth" = "auth.cloud.local"
    "database" = "database.cloud.local"
    "storage-server" = "storage.cloud.local"
    "dns-server" = "ns.cloud.local"
}

# Kiểm tra container source có đang chạy không
$sourceStatus = docker-compose ps $FromContainer 2>&1
if ($sourceStatus -notmatch "Up") {
    Write-Host "[FAIL] Source container '$FromContainer' is NOT running!" -ForegroundColor Red
    Write-Host "Available containers:" -ForegroundColor Yellow
    docker-compose ps --format "table {{.Service}}\t{{.Status}}" 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    exit 1
}

Write-Host "[OK] Source container '$FromContainer' is running" -ForegroundColor Green
Write-Host ""

$successCount = 0
$failCount = 0
$skipCount = 0

# Ping từng service
foreach ($service in $services) {
    # Bỏ qua ping chính nó
    if ($service -eq $FromContainer) {
        Write-Host "Skipping $service (source container)" -ForegroundColor Gray
        $skipCount++
        continue
    }
    
    Write-Host "Pinging $service..." -NoNewline -ForegroundColor Yellow
    
    # Kiểm tra service có đang chạy không
    $targetStatus = docker-compose ps $service 2>&1
    if ($targetStatus -notmatch "Up") {
        Write-Host " [SKIP] Container not running" -ForegroundColor Gray
        $skipCount++
        continue
    }
    
    # Ping bằng tên service
    $pingResult = docker-compose exec -T $FromContainer sh -c "ping -c $PingCount $service 2>&1" 2>&1
    
    # Kiểm tra kết quả ping
    if ($pingResult -match "64 bytes|packet loss|0% packet loss|transmitted.*received") {
        # Ping thành công
        $packetInfo = $pingResult | Select-String -Pattern "(\d+) packets transmitted.*(\d+) received" | ForEach-Object { $_.Matches.Groups }
        $timeInfo = $pingResult | Select-String -Pattern "min/avg/max.*= ([\d.]+)/([\d.]+)/([\d.]+)" | ForEach-Object { $_.Matches.Groups }
        
        if ($packetInfo -and $packetInfo[2].Value -eq $PingCount) {
            Write-Host " [OK]" -ForegroundColor Green
            if ($timeInfo) {
                Write-Host "   Avg time: $($timeInfo[2].Value) ms" -ForegroundColor Gray
            }
            $successCount++
        } else {
            Write-Host " [PARTIAL] Some packets lost" -ForegroundColor Yellow
            $successCount++
        }
    } elseif ($pingResult -match "Name or service not known|could not resolve|unknown host") {
        Write-Host " [FAIL] DNS resolution failed" -ForegroundColor Red
        $failCount++
    } elseif ($pingResult -match "Network is unreachable|No route to host") {
        Write-Host " [FAIL] Network unreachable" -ForegroundColor Red
        $failCount++
    } else {
        Write-Host " [FAIL] Ping failed" -ForegroundColor Red
        $pingResult | Select-String -Pattern "ping:|error|failed" | Select-Object -First 2 | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
        $failCount++
    }
}

Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "Skipped: $skipCount" -ForegroundColor Gray
Write-Host ""

# Test ping bằng domain names (nếu có DNS)
Write-Host "=== Testing with DNS domain names (.cloud.local) ===" -ForegroundColor Cyan
Write-Host ""

$dnsSuccessCount = 0
$dnsFailCount = 0

foreach ($service in $serviceDomains.Keys) {
    if ($service -eq $FromContainer) {
        continue
    }
    
    $domain = $serviceDomains[$service]
    Write-Host "Pinging $domain ($service)..." -NoNewline -ForegroundColor Yellow
    
    # Ping bằng domain name
    $dnsPingResult = docker-compose exec -T $FromContainer sh -c "ping -c $PingCount $domain 2>&1" 2>&1
    
    if ($dnsPingResult -match "64 bytes|0% packet loss") {
        Write-Host " [OK]" -ForegroundColor Green
        $dnsSuccessCount++
    } elseif ($dnsPingResult -match "bad address|Name or service not known") {
        Write-Host " [FAIL] DNS resolution failed" -ForegroundColor Red
        $dnsFailCount++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $dnsFailCount++
    }
}

Write-Host ""
Write-Host "=== DNS Ping Summary ===" -ForegroundColor Cyan
Write-Host "Successful: $dnsSuccessCount" -ForegroundColor Green
Write-Host "Failed: $dnsFailCount" -ForegroundColor $(if ($dnsFailCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

# Tổng kết
if ($failCount -eq 0 -and $dnsFailCount -eq 0) {
    Write-Host "[SUCCESS] All network connectivity tests passed!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Some connectivity tests failed. Check network configuration." -ForegroundColor Yellow
}


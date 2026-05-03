function Test-Endpoint {
    param($method, $uri, $body = $null, $token = $null)
    $headers = @{"Content-Type" = "application/json"}
    if ($token) { $headers.Add("Authorization", "Bearer $token") }
    $params = @{
        Uri = $uri
        Method = $method
        Headers = $headers
        ErrorAction = "Stop"
    }
    if ($body) { $params.Add("Body", ($body | ConvertTo-Json)) }
    try {
        $response = Invoke-RestMethod @params
        Write-Host "SUCCESS: $method $uri" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "FAILED: $method $uri - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $errBody = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errBody)
            Write-Host "Error Body: $($reader.ReadToEnd())" -ForegroundColor Gray
        }
        return $null
    }
}

# Wait for server to be ready
Write-Host "Waiting for server on port 8080..."
while ($true) {
    try {
        $ping = Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue
        if ($ping.TcpTestSucceeded) { break }
    } catch {}
    Start-Sleep -Seconds 2
}

Write-Host "`n--- STARTING TESTS ---"

# 1. Register Admin
$adminData = @{
    email = "admin@camp.com"
    password = "adminpassword"
    fullName = "System Administrator"
    role = "ADMIN"
}
$adminReg = Test-Endpoint "POST" "http://localhost:8080/api/auth/register" $adminData

# 2. Login
$loginData = @{ email = "admin@camp.com"; password = "adminpassword" }
$authResponse = Test-Endpoint "POST" "http://localhost:8080/api/auth/login" $loginData
$token = $authResponse.data.token

# 3. Create Campsite (Protected ADMIN)
$campsiteData = @{
    name = "Majestic Forest"
    location = "Aïn Draham, Tunisia"
    capacity = 50
    nightlyPrice = 45.5
}
$campsite = Test-Endpoint "POST" "http://localhost:8080/api/campsites" $campsiteData $token

# 4. Get Campsites (Public GET)
$campsites = Test-Endpoint "GET" "http://localhost:8080/api/campsites"

Write-Host "`n--- TESTS COMPLETE ---"
if ($campsites.data.content) {
    Write-Host "Total Campsites: $($campsites.data.totalElements)"
}

$ErrorActionPreference = "Stop"

$email = "debug_user_" + (Get-Date -Format "yyyyMMddHHmmss") + "@example.com"
$password = "password123"

Write-Host "Registering user: $email"

try {
    $registerBody = @{
        email = $email
        password = $password
        displayName = "Debug User"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -ContentType "application/json" -Body $registerBody
    Write-Host "Registration successful: $($registerResponse | ConvertTo-Json -Depth 2)"
} catch {
    Write-Host "Registration failed: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Response Body: $($reader.ReadToEnd())"
    }
    # Proceed to login anyway to test that path explicitly if registration failed due to user existing
}

Write-Host "`nLogging in user: $email"

try {
    $loginBody = @{
        email = $email
        password = $password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    Write-Host "Login successful: $($loginResponse | ConvertTo-Json -Depth 2)"
} catch {
    Write-Host "Login failed: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Response Body: $($reader.ReadToEnd())"
    }
}

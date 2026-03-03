# Automation Verification Script

$baseUrl = "http://localhost:8080/api"
$email = "auto_test_" + (Get-Random) + "@example.com"
$password = "password"

# 0. Register
echo "`n0. Registering new user..."
$registerBody = @{
    displayName = "Automation Tester"
    email = $email
    password = $password
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    echo "   Registration successful for $email"
} catch {
    echo "   Registration failed (might already exist): $_"
    # Continue to login
}

# 1. Login
echo "`n1. Logging in..."
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.accessToken
    $headers = @{ Authorization = "Bearer $token" }
    echo "   Login successful."
} catch {
    echo "   Login failed: $_"
    exit 1
}

# 1.5 Verify Token with GET
echo "`n1.5 Verifying Token (GET /workspaces)..."
try {
    $workspaces = Invoke-RestMethod -Uri "$baseUrl/workspaces" -Method Get -Headers $headers
    echo "   GET /workspaces successful. Found $($workspaces.Count) workspaces."
} catch {
    echo "   GET /workspaces failed: $_"
}

# 2. Create Workspace (Needed for new user)
echo "`n2. Creating Workspace..."
$wsBody = @{
    name = "Automation Workspace"
    description = "Test Workspace"
} | ConvertTo-Json
$workspaceResponse = Invoke-RestMethod -Uri "$baseUrl/workspaces" -Method Post -Body $wsBody -Headers $headers -ContentType "application/json"
$workspaceId = $workspaceResponse.id
echo "   Workspace ID: $workspaceId"

# 2.5 Create and Activate Workflow
echo "`n2.5 Creating and Activating Workflow..."
$wfBody = @{
    name = "Standard Workflow"
    description = "A simple START -> DONE workflow"
} | ConvertTo-Json
$wfResponse = Invoke-RestMethod -Uri "$baseUrl/workspaces/$workspaceId/workflows" -Method Post -Body $wfBody -Headers $headers -ContentType "application/json"
$workflowId = $wfResponse.id
echo "   Workflow ID: $workflowId"

# Add START state
$startStateBody = @{ name = "Start"; type = "START" } | ConvertTo-Json
$startState = Invoke-RestMethod -Uri "$baseUrl/workflows/$workflowId/states" -Method Post -Body $startStateBody -Headers $headers -ContentType "application/json"
$startStateId = $startState.id

# Add DONE state
$doneStateBody = @{ name = "Done"; type = "DONE" } | ConvertTo-Json
$doneState = Invoke-RestMethod -Uri "$baseUrl/workflows/$workflowId/states" -Method Post -Body $doneStateBody -Headers $headers -ContentType "application/json"
$doneStateId = $doneState.id

# Add Transition
$transBody = @{ name = "Complete"; fromStateId = $startStateId; toStateId = $doneStateId } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/workflows/$workflowId/transitions" -Method Post -Body $transBody -Headers $headers -ContentType "application/json" | Out-Null

# Activate
Invoke-RestMethod -Uri "$baseUrl/workflows/$workflowId/validate" -Method Post -Headers $headers | Out-Null
echo "   Workflow Activated."

# 3. Create Project
echo "`n3. Creating Project with Workflow..."
$projBody = @{
    name = "Automation Project"
    description = "Test Project"
    workflowId = $workflowId
} | ConvertTo-Json
$projectResponse = Invoke-RestMethod -Uri "$baseUrl/workspaces/$workspaceId/projects" -Method Post -Body $projBody -Headers $headers -ContentType "application/json"
$projectId = $projectResponse.id
echo "   Project ID: $projectId"


# 4. Create Automation Rule with Condition (IF Priority == URGENT THEN NOTIFY)
echo "`n4. Creating Conditional Automation Rule..."
$ruleName = "Urgent Notification Rule " + (Get-Random)
$conditions = @(
    @{
        field = "priority"
        operator = "EQUALS"
        value = "URGENT"
    }
) | ConvertTo-Json -Compress

$ruleBody = @{
    name = $ruleName
    description = "Notify on Urgent tasks"
    triggerEvent = "TASK_CREATED"
    conditionsJson = $conditions
    actionType = "NOTIFY"
    actionConfigJson = @{
        title = "URGENT TASK CREATED"
        message = "A task with URGENT priority has been created. Attention required."
    } | ConvertTo-Json -Compress
    active = $true
} | ConvertTo-Json

try {
    $ruleResponse = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/automation" -Method Post -Body $ruleBody -Headers $headers -ContentType "application/json"
    $ruleId = $ruleResponse.id
    echo "   Rule Created. ID: $ruleId, Name: $ruleName"
} catch {
    echo "   Rule creation failed: $_"
    exit 1
}

# 5. Create Task (LOW priority - should NOT trigger)
echo "`n5a. Creating LOW Priority Task (Should NOT trigger)..."
$taskLowBody = @{
    title = "Low Priority Task " + (Get-Random)
    description = "This should NOT trigger the automation rule"
    priority = "LOW"
} | ConvertTo-Json

try {
    $taskResponse = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/tasks" -Method Post -Body $taskLowBody -Headers $headers -ContentType "application/json"
    echo "   Task Created. ID: $($taskResponse.id)"
} catch {
    echo "   Task creation failed: $_"
}

# 5b. Create Task (URGENT priority - SHOULD trigger)
echo "`n5b. Creating URGENT Priority Task (SHOULD trigger)..."
$taskUrgentBody = @{
    title = "Urgent Priority Task " + (Get-Random)
    description = "This SHOULD trigger the automation rule"
    priority = "URGENT"
} | ConvertTo-Json

try {
    $taskResponse = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/tasks" -Method Post -Body $taskUrgentBody -Headers $headers -ContentType "application/json"
    echo "   Task Created. ID: $($taskResponse.id)"
} catch {
    echo "   Task creation failed: $_"
}

# 6. Verify Logs
echo "`n6. Checking Logs for Selective Execution..."
Start-Sleep -Seconds 5 # Give async executor time

# Read logs
$logContent = Get-Content -Path "backend_debug.log" -Tail 500
$searchString = "Executing action NOTIFY for rule $ruleName"

$matchCount = ($logContent | Select-String -SimpleMatch $searchString).Count

if ($matchCount -eq 1) {
    echo "   SUCCESS: Found EXACTLY ONE execution log for rule '$ruleName'!"
    echo "   This confirms the condition logic correctly filtered out the LOW priority task."
} elseif ($matchCount -gt 1) {
    echo "   FAILURE: Found $matchCount execution logs. Condition logic MIGHT NOT be working correctly."
} else {
    echo "   FAILURE: Did not find execution log for rule '$ruleName'."
    echo "   Check if the event was published and if the condition matched correctly."
}

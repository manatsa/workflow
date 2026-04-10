# Login and get token
$loginBody = @{
    username = 'admin'
    password = 'P@88345!'
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri 'http://localhost:9500/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
$token = $loginResponse.data.token

$headers = @{
    Authorization = "Bearer $token"
    'Cache-Control' = 'no-cache'
}

# Get all workflows
$workflows = Invoke-RestMethod -Uri 'http://localhost:9500/api/workflows' -Method Get -Headers $headers
$pettyCash = $workflows.data | Where-Object { $_.name -like '*PETTY*' -or $_.name -like '*Petty*' }

if ($pettyCash) {
    # Get PETTY CASH workflow by ID
    $workflowResponse = Invoke-RestMethod -Uri "http://localhost:9500/api/workflows/$($pettyCash.id)" -Method Get -Headers $headers

    Write-Host "Workflow: $($workflowResponse.data.name)"
    Write-Host "Code: $($workflowResponse.data.code)"
    Write-Host "Fields in workflow:"

    foreach ($form in $workflowResponse.data.forms) {
        Write-Host "  Form: $($form.name)"
        foreach ($field in $form.fields) {
            Write-Host "    - $($field.label) (name: $($field.name))"
        }
    }

    # Check if 'test delete' field exists
    $found = $false
    foreach ($form in $workflowResponse.data.forms) {
        foreach ($field in $form.fields) {
            if ($field.name -like '*test*delete*' -or $field.label -like '*test*delete*') {
                $found = $true
                Write-Host "`nWARNING: 'test delete' field still exists!"
            }
        }
    }

    if (-not $found) {
        Write-Host "`nSUCCESS: 'test delete' field is no longer in the workflow!"
    }
} else {
    Write-Host "PETTY CASH workflow not found"
}

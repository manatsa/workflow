# Login and get token
$loginBody = @{
    username = 'admin'
    password = 'P@88345!'
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri 'http://localhost:9500/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
$token = $loginResponse.data.token

Write-Host "Got token: $($token.Substring(0, 20))..."

# Get workflows and find PETTY CASH
$headers = @{
    Authorization = "Bearer $token"
}

$workflows = Invoke-RestMethod -Uri 'http://localhost:9500/api/workflows' -Method Get -Headers $headers
$pettyCash = $workflows.data | Where-Object { $_.name -like '*PETTY*' -or $_.name -like '*Petty*' }

if ($pettyCash) {
    Write-Host "Found workflow: $($pettyCash.name) (ID: $($pettyCash.id))"

    # Get the full workflow details to find the field
    $workflowDetails = Invoke-RestMethod -Uri "http://localhost:9500/api/workflows/$($pettyCash.id)" -Method Get -Headers $headers

    # Find 'test delete' field
    $testDeleteField = $null
    foreach ($form in $workflowDetails.data.forms) {
        foreach ($field in $form.fields) {
            if ($field.name -like '*test*delete*' -or $field.label -like '*test*delete*') {
                $testDeleteField = $field
                Write-Host "Found field: $($field.label) (name: $($field.name), ID: $($field.id))"
            }
        }
    }

    if ($testDeleteField) {
        # Delete the field by updating the workflow without it
        Write-Host "Deleting field..."

        # Remove the field from the forms
        $updatedForms = @()
        foreach ($form in $workflowDetails.data.forms) {
            $updatedFields = $form.fields | Where-Object { $_.id -ne $testDeleteField.id }
            $form.fields = $updatedFields
            $updatedForms += $form
        }

        $workflowDetails.data.forms = $updatedForms

        $updateBody = $workflowDetails.data | ConvertTo-Json -Depth 10

        $updateResponse = Invoke-RestMethod -Uri "http://localhost:9500/api/workflows/$($pettyCash.id)" -Method Put -Headers $headers -Body $updateBody -ContentType 'application/json'

        if ($updateResponse.success) {
            Write-Host "Field deleted successfully!"
        } else {
            Write-Host "Failed to delete field: $($updateResponse.message)"
        }
    } else {
        Write-Host "Field 'test delete' not found in workflow"
        Write-Host "Available fields:"
        foreach ($form in $workflowDetails.data.forms) {
            foreach ($field in $form.fields) {
                Write-Host "  - $($field.label) (name: $($field.name))"
            }
        }
    }
} else {
    Write-Host "PETTY CASH workflow not found"
    Write-Host "Available workflows:"
    $workflows.data | ForEach-Object { Write-Host "  - $($_.name)" }
}

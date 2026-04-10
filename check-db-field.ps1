# Check if the field exists directly in the PostgreSQL database
$connectionString = "Host=localhost;Port=5432;Database=workflow;Username=sonar;Password=P@88345!"

# Using psql if available, otherwise use .NET
try {
    $result = psql -h localhost -p 5432 -U sonar -d workflow -c "SELECT id, name, label FROM workflow_fields WHERE name LIKE '%test%Delete%' OR label LIKE '%test%Delete%';" 2>$null
    if ($result) {
        Write-Host "Database query result:"
        Write-Host $result
    }
} catch {
    Write-Host "psql not available, trying .NET..."
}

# Try with .NET Npgsql (if available)
try {
    Add-Type -Path "C:\Program Files\PostgreSQL\*\lib\Npgsql.dll" -ErrorAction SilentlyContinue

    $conn = New-Object Npgsql.NpgsqlConnection($connectionString)
    $conn.Open()

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT id, name, label FROM workflow_fields WHERE name LIKE '%test%Delete%' OR label LIKE '%test%Delete%'"

    $reader = $cmd.ExecuteReader()
    Write-Host "Database query result:"
    while ($reader.Read()) {
        Write-Host "  ID: $($reader['id']), Name: $($reader['name']), Label: $($reader['label'])"
    }
    $reader.Close()
    $conn.Close()
} catch {
    Write-Host "Could not query database directly: $($_.Exception.Message)"
}

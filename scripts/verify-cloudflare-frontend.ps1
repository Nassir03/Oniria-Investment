$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root 'frontend'

Write-Host 'Checking Cloudflare Worker/package naming...'
$package = Get-Content (Join-Path $frontend 'package.json') -Raw | ConvertFrom-Json
if ($package.name -ne 'oniria-investment') {
    throw "frontend/package.json name must be 'oniria-investment' but is '$($package.name)'"
}

$lock = Get-Content (Join-Path $frontend 'package-lock.json') -Raw | ConvertFrom-Json
if ($lock.name -ne 'oniria-investment') {
    throw "frontend/package-lock.json name must be 'oniria-investment' but is '$($lock.name)'"
}

$wranglerFiles = @(
    (Join-Path $frontend 'wrangler.jsonc'),
    (Join-Path $frontend 'wrangler.json'),
    (Join-Path $frontend 'wrangler.toml')
) | Where-Object { Test-Path $_ }

if ($wranglerFiles.Count -gt 0) {
    throw "This project is configured for Cloudflare automatic Next.js setup. Remove committed Wrangler config before deploying: $($wranglerFiles -join ', ')"
}

$matches = Get-ChildItem $frontend -Recurse -File |
    Where-Object { $_.FullName -notmatch '\\node_modules\\|\\.next\\|\\.open-next\\|\\.wrangler\\' } |
    Select-String -Pattern 'WORKER_SELF_REFERENCE|oniria-investments-frontend'
if ($matches) {
    $matches | Format-Table Path, LineNumber, Line -AutoSize
    throw 'Old Cloudflare Worker naming/binding text is still present in deployable frontend source.'
}

Write-Host 'Installing exact frontend dependencies from package-lock.json...'
Push-Location $frontend
try {
    npm ci
    npm run typecheck
    npm run build
}
finally {
    Pop-Location
}

Write-Host 'Frontend verification passed.' -ForegroundColor Green

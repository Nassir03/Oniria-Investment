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

$wranglerPath = Join-Path $frontend 'wrangler.jsonc'
if (-not (Test-Path $wranglerPath)) {
    throw 'frontend/wrangler.jsonc is required for the OpenNext Cloudflare deployment.'
}

# This repository keeps wrangler.jsonc as strict JSON (despite the .jsonc
# extension), so PowerShell can validate the routing contract directly.
$wrangler = Get-Content $wranglerPath -Raw | ConvertFrom-Json
$runWorkerFirst = $wrangler.assets.run_worker_first
if ($runWorkerFirst -is [bool]) {
    if (-not $runWorkerFirst) {
        throw 'Cloudflare assets.run_worker_first must be true or include /api/* and /media/*.'
    }
} else {
    $workerFirstRoutes = @($runWorkerFirst)
    foreach ($requiredRoute in @('/api/*', '/media/*')) {
        if ($workerFirstRoutes -notcontains $requiredRoute) {
            throw "Cloudflare assets.run_worker_first must include $requiredRoute so dynamic requests cannot be intercepted by static assets."
        }
    }
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

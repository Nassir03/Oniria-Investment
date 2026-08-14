$ErrorActionPreference = 'Stop'

Write-Host "ONIRIA local PostgreSQL configuration" -ForegroundColor Cyan
Write-Host "This writes .env safely. Do not type the PowerShell prompt text itself." -ForegroundColor Yellow

$hostName = Read-Host "PostgreSQL host [127.0.0.1]"
if ([string]::IsNullOrWhiteSpace($hostName)) { $hostName = '127.0.0.1' }
$port = Read-Host "PostgreSQL port [3310]"
if ([string]::IsNullOrWhiteSpace($port)) { $port = '3310' }
$user = Read-Host "PostgreSQL user [postgres]"
if ([string]::IsNullOrWhiteSpace($user)) { $user = 'postgres' }
$db = Read-Host "Database name [oniria]"
if ([string]::IsNullOrWhiteSpace($db)) { $db = 'oniria' }
$securePassword = Read-Host "PostgreSQL password" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

$encodedUser = [System.Uri]::EscapeDataString($user)
$encodedPassword = [System.Uri]::EscapeDataString($password)
$databaseUrl = "postgresql+asyncpg://${encodedUser}:${encodedPassword}@${hostName}:${port}/${db}"

$envText = @"
APP_NAME=ONIRIA Investments API
ENVIRONMENT=local
DEBUG=true
API_V1_PREFIX=/api/v1
FRONTEND_ORIGINS=http://localhost:3200,http://127.0.0.1:3200
DATABASE_URL=$databaseUrl
SUPABASE_URL=
SUPABASE_JWT_ISSUER=
SUPABASE_JWKS_URL=
SUPABASE_SERVICE_ROLE_KEY=
STORAGE_BUCKET=oniria-media
RESEND_API_KEY=
CONTACT_NOTIFICATION_EMAIL=oniriaassist@gmail.com
EMAIL_FROM=ONIRIA Investments <oniriaassist@gmail.com>
SENTRY_DSN=
LEAD_RATE_LIMIT_PER_MINUTE=10
MAX_UPLOAD_BYTES=10485760
ALLOWED_UPLOAD_MIME_TYPES=image/jpeg,image/png,image/webp,image/avif
"@

Set-Content -Path .env -Value $envText -Encoding UTF8
Write-Host ".env created successfully." -ForegroundColor Green
Write-Host "Next run: python scripts/doctor.py" -ForegroundColor Green

#!/bin/bash
set -e

VERSION=$(date +%Y%m%d)
DIST="dist/dck-$VERSION"

# Si ya existe la imagen, saltar el build (mucho más rápido)
if docker image inspect dck-app:latest &>/dev/null && [[ "$1" != "--build" ]]; then
    echo "✅ [1/4] Imagen existente encontrada (omitiendo build)."
    echo "         Usa ./release.sh --build para forzar reconstrucción."
else
    echo "🔨 [1/4] Construyendo imagen Docker..."
    docker compose build app
fi

echo "💾 [2/4] Guardando imagen..."
mkdir -p "$DIST"
docker save dck-app:latest -o "$DIST/dck-image.tar"

echo "📄 [3/4] Copiando archivos de configuración..."
cat > "$DIST/docker-compose.yml" << 'EOF'
services:
  db:
    image: postgres:16-alpine
    container_name: dck_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: dck_db
      POSTGRES_USER: dck_user
      POSTGRES_PASSWORD: dck_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dck_user -d dck_db"]
      interval: 5s
      timeout: 3s
      retries: 10

  app:
    image: dck-app:latest
    container_name: dck_app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://dck_user:dck_password@db:5432/dck_db
      SESSION_SECRET: dck-super-secret-key-change-in-production!!
      UPLOAD_DIR: /app/uploads
      NODE_ENV: production
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      db:
        condition: service_healthy

volumes:
  postgres_data:
  uploads_data:
EOF

cat > "$DIST/instalar.sh" << 'EOF'
#!/bin/bash
echo "🚀 Instalando DCK..."
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado."
    echo "   Descárgalo en: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "📦 Cargando imagen..."
docker load < dck-image.tar

echo "▶️  Iniciando servicios..."
docker compose up -d

echo ""
echo "✅ DCK instalado y corriendo!"
echo ""
echo "   🌐 App:    http://localhost:3000"
echo "   👤 Usuario: admin@dck.local"
echo "   🔑 Clave:   admin123"
echo ""
echo "   ⚠️  Cambia la contraseña después del primer login."
EOF
chmod +x "$DIST/instalar.sh"

cat > "$DIST/detener.sh" << 'EOF'
#!/bin/bash
docker compose down
echo "✅ DCK detenido."
EOF
chmod +x "$DIST/detener.sh"

# ── Windows: PowerShell ──────────────────────────────────────────
cat > "$DIST/instalar.ps1" << 'EOF'
# Requiere ejecucion como Administrador
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    Write-Host "Solicitando permisos de administrador..." -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Definition)`""
    exit
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Instalador DCK - Sistema de Manifiestos       " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ── PASO 1: Verificar / Instalar Docker ──────────────────────────
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if (-not $dockerInstalled) {
    Write-Host "[1/4] Docker no encontrado. Instalando Docker Desktop..." -ForegroundColor Yellow
    Write-Host "      Esto puede tardar varios minutos." -ForegroundColor Gray

    # Habilitar WSL2 (requerido por Docker Desktop)
    Write-Host "      Habilitando WSL2..." -ForegroundColor Gray
    wsl --install --no-distribution 2>&1 | Out-Null
    Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -NoRestart -ErrorAction SilentlyContinue | Out-Null

    # Descargar instalador de Docker Desktop
    $installerPath = "$env:TEMP\DockerDesktopInstaller.exe"
    Write-Host "      Descargando Docker Desktop (~600 MB)..." -ForegroundColor Gray
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" `
        -OutFile $installerPath -UseBasicParsing

    # Instalar en silencio
    Write-Host "      Instalando Docker Desktop..." -ForegroundColor Gray
    Start-Process -FilePath $installerPath `
        -ArgumentList "install --quiet --accept-license --backend=wsl-2" `
        -Wait -NoNewWindow

    # Actualizar PATH para esta sesion
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path","User")

    Write-Host "      Docker Desktop instalado." -ForegroundColor Green
} else {
    Write-Host "[1/4] Docker ya instalado." -ForegroundColor Green
}

# ── PASO 2: Iniciar Docker Desktop y esperar que este listo ──────
Write-Host "[2/4] Iniciando Docker Desktop..." -ForegroundColor Yellow

$dockerExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (Test-Path $dockerExe) {
    Start-Process $dockerExe -ErrorAction SilentlyContinue
}

Write-Host "      Esperando que Docker este listo" -ForegroundColor Gray -NoNewline
$timeout = 120
$elapsed = 0
$ready = $false
while ($elapsed -lt $timeout) {
    try {
        $result = docker info 2>&1
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    } catch {}
    Start-Sleep 3
    $elapsed += 3
    Write-Host "." -NoNewline -ForegroundColor Gray
}
Write-Host ""

if (-not $ready) {
    Write-Host "ERROR: Docker no respondio en $timeout segundos." -ForegroundColor Red
    Write-Host "       Abre Docker Desktop manualmente y vuelve a ejecutar este script."
    Read-Host "Presiona Enter para salir"
    exit 1
}
Write-Host "      Docker listo." -ForegroundColor Green

# ── PASO 3: Cargar imagen DCK ────────────────────────────────────
Write-Host "[3/4] Cargando imagen DCK..." -ForegroundColor Yellow
docker load -i dck-image.tar
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se pudo cargar la imagen." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# ── PASO 4: Iniciar servicios ────────────────────────────────────
Write-Host "[4/4] Iniciando DCK..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se pudieron iniciar los servicios." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Esperar a que la app responda
Write-Host "      Esperando que la app este lista" -ForegroundColor Gray -NoNewline
$appReady = $false
for ($i = 0; $i -lt 20; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        $appReady = $true; break
    } catch {}
    Start-Sleep 2
    Write-Host "." -NoNewline -ForegroundColor Gray
}
Write-Host ""

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  DCK instalado y corriendo!                   " -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  App:      http://localhost:3000" -ForegroundColor White
Write-Host "  Usuario:  admin@dck.local" -ForegroundColor White
Write-Host "  Contrase: admin123" -ForegroundColor White
Write-Host ""
Write-Host "  Cambia la contrasena despues del primer login." -ForegroundColor Yellow
Write-Host ""

# Abrir navegador
Start-Process "http://localhost:3000"

Read-Host "Presiona Enter para cerrar"
EOF

cat > "$DIST/detener.ps1" << 'EOF'
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Definition)`""
    exit
}
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Definition)
docker compose down
Write-Host "DCK detenido." -ForegroundColor Green
Read-Host "Presiona Enter para cerrar"
EOF

cat > "$DIST/iniciar.ps1" << 'EOF'
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Definition)`""
    exit
}
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Definition)
Write-Host "Iniciando DCK..." -ForegroundColor Cyan
docker compose up -d
Start-Process "http://localhost:3000"
Write-Host "DCK corriendo en http://localhost:3000" -ForegroundColor Green
Read-Host "Presiona Enter para cerrar"
EOF

echo "📦 [4/4] Creando paquete zip..."
cd dist && zip -r "dck-$VERSION.zip" "dck-$VERSION/" && cd ..

echo ""
echo "✅ Paquete listo: dist/dck-$VERSION.zip"
echo ""
echo "   Para instalar en Mac/Linux:"
echo "   1. Descomprimir el zip"
echo "   2. Ejecutar: ./instalar.sh"
echo ""
echo "   Para instalar en Windows:"
echo "   1. Descomprimir el zip"
echo "   2. Click derecho en instalar.ps1 -> Ejecutar con PowerShell"
echo "      (Docker se instala automaticamente si no esta)"

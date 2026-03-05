; DCK - Instalador para Windows
; Compilar con: makensis dck.nsi

Unicode true
!include "MUI2.nsh"
!include "LogicLib.nsh"

;--------------------------------
; Configuración
Name "DCK - Sistema de Manifiestos"
OutFile "..\dist\DCK-Installer.exe"
InstallDir "$PROGRAMFILES64\DCK"
InstallDirRegKey HKLM "Software\DCK" "Install_Dir"
RequestExecutionLevel admin
BrandingText "DCK v1.0"

;--------------------------------
; Interfaz visual (MUI2)
!define MUI_ABORTWARNING
!define MUI_HEADERIMAGE
!define MUI_WELCOMEPAGE_TITLE "Bienvenido al instalador de DCK"
!define MUI_WELCOMEPAGE_TEXT "Este asistente instalará DCK - Sistema de Manifiestos en tu equipo.$\r$\n$\r$\nSe instalará Docker Desktop automáticamente si no está presente.$\r$\n$\r$\nHaz clic en Siguiente para continuar."
!define MUI_FINISHPAGE_RUN ""
!define MUI_FINISHPAGE_RUN_TEXT "Abrir DCK en el navegador"
!define MUI_FINISHPAGE_RUN_FUNCTION "OpenBrowser"
!define MUI_FINISHPAGE_TITLE "Instalación completada"
!define MUI_FINISHPAGE_TEXT "DCK se ha instalado correctamente.$\r$\n$\r$\nUsuario: admin@dck.local$\r$\nContraseña: admin123$\r$\n$\r$\nCambia la contraseña después del primer inicio de sesión."

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Spanish"

;--------------------------------
; Función para abrir navegador al final
Function OpenBrowser
  ExecShell "open" "http://localhost:3000"
FunctionEnd

;--------------------------------
; Sección principal de instalación
Section "DCK" SEC_MAIN

  SetOutPath "$INSTDIR"
  DetailPrint "Copiando archivos..."
  File "dck-image.tar"
  File "docker-compose.yml"

  ; ── Ruta completa a Docker (evita problemas de PATH en contexto admin) ──
  StrCpy $R0 "$PROGRAMFILES64\Docker\Docker\resources\bin\docker.exe"

  ; ── Paso 1: Instalar Docker si no está ──────────────────────────
  DetailPrint "Verificando Docker Desktop..."
  nsExec::ExecToLog '"$R0" info'
  Pop $0
  ${If} $0 != 0
    DetailPrint "Instalando Docker Desktop con winget..."
    DetailPrint "(Esto puede tardar varios minutos)"
    nsExec::ExecToLog 'winget install Docker.DockerDesktop --silent --accept-package-agreements --accept-source-agreements'
    Pop $0
    ${If} $0 != 0
      MessageBox MB_ICONSTOP "Error instalando Docker Desktop.$\r$\nPor favor instálalo manualmente desde https://www.docker.com/products/docker-desktop"
      Abort
    ${EndIf}
    DetailPrint "Docker Desktop instalado."
  ${Else}
    DetailPrint "Docker ya está instalado."
  ${EndIf}

  ; ── Paso 2: Iniciar Docker Desktop ──────────────────────────────
  DetailPrint "Iniciando Docker Desktop..."
  Exec '"$PROGRAMFILES64\Docker\Docker\Docker Desktop.exe"'

  DetailPrint "Esperando que Docker esté listo (puede tardar ~30 segundos)..."
  StrCpy $1 0
  loop:
    nsExec::ExecToStack '"$R0" info'
    Pop $0
    ${If} $0 == 0
      Goto docker_ready
    ${EndIf}
    IntOp $1 $1 + 1
    ${If} $1 > 40
      MessageBox MB_ICONSTOP "Docker no respondió. Ábrelo manualmente y vuelve a ejecutar el instalador."
      Abort
    ${EndIf}
    Sleep 3000
    Goto loop
  docker_ready:
  DetailPrint "Docker listo."

  ; ── Paso 3: Cargar imágenes (app + postgres, instalación offline) ────
  DetailPrint "Cargando imágenes DCK (puede tardar unos minutos)..."
  nsExec::ExecToLog '"$R0" load -i "$INSTDIR\dck-image.tar"'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_ICONSTOP "Error cargando las imágenes Docker."
    Abort
  ${EndIf}

  ; ── Paso 4: Iniciar servicios (--pull never: usa imágenes ya cargadas) ──
  DetailPrint "Iniciando DCK..."
  nsExec::ExecToLog '"$R0" compose -f "$INSTDIR\docker-compose.yml" up -d --pull never'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_ICONSTOP "Error iniciando los servicios DCK.$\r$\nRevisa que el puerto 3000 no esté ocupado."
    Abort
  ${EndIf}

  ; ── Accesos directos ────────────────────────────────────────────
  DetailPrint "Creando accesos directos..."
  CreateDirectory "$SMPROGRAMS\DCK"
  CreateShortcut "$SMPROGRAMS\DCK\DCK Sistema.lnk" "http://localhost:3000"
  CreateShortcut "$SMPROGRAMS\DCK\Iniciar DCK.lnk" "cmd.exe" '/c docker compose -f "$INSTDIR\docker-compose.yml" up -d && start http://localhost:3000' "" "" SW_SHOWMINIMIZED
  CreateShortcut "$SMPROGRAMS\DCK\Detener DCK.lnk" "cmd.exe" '/c docker compose -f "$INSTDIR\docker-compose.yml" down' "" "" SW_SHOWMINIMIZED
  CreateShortcut "$SMPROGRAMS\DCK\Desinstalar DCK.lnk" "$INSTDIR\uninstall.exe"
  CreateShortcut "$DESKTOP\DCK.lnk" "http://localhost:3000" "" "" 0

  ; Registro Windows para desinstalar desde Panel de Control
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DCK" "DisplayName" "DCK - Sistema de Manifiestos"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DCK" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DCK" "DisplayVersion" "1.0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DCK" "Publisher" "DCK"

  WriteUninstaller "$INSTDIR\uninstall.exe"
  DetailPrint "Instalación completada."

SectionEnd

;--------------------------------
; Desinstalador
Section "Uninstall"
  StrCpy $R0 "$PROGRAMFILES64\Docker\Docker\resources\bin\docker.exe"
  DetailPrint "Deteniendo servicios..."
  nsExec::ExecToLog '"$R0" compose -f "$INSTDIR\docker-compose.yml" down'

  DetailPrint "Eliminando imágenes Docker..."
  nsExec::ExecToLog '"$R0" rmi dck-app:latest postgres:16-alpine'

  Delete "$INSTDIR\dck-image.tar"
  Delete "$INSTDIR\docker-compose.yml"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"

  Delete "$SMPROGRAMS\DCK\*.*"
  RMDir "$SMPROGRAMS\DCK"
  Delete "$DESKTOP\DCK.lnk"

  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DCK"
  DeleteRegKey HKLM "Software\DCK"
SectionEnd

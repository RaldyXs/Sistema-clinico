$ErrorActionPreference = "Continue"
Write-Output "Iniciando detector automatico en espera de la reactivacion de Linux Mint (192.168.16.19)..."
$ip = "192.168.16.19"
$detected = $false

for ($step = 1; $step -le 150; $step++) {
    $pingOk = Test-Connection -ComputerName $ip -Count 1 -Quiet
    if ($pingOk) {
        $detected = $true
        Write-Output ">>> ¡MAQUINA DETECTADA EN LINEA! ($ip) a los $($step * 2) segundos. <<<"
        break
    }
    Start-Sleep -Seconds 2
}

if (-not $detected) {
    Write-Output "Tiempo de espera agotado (5 minutos) sin detectar la maquina."
    exit 1
}

Write-Output "Transfiriendo script de configuracion 24/7..."
scp -o ConnectTimeout=5 -o StrictHostKeyChecking=no C:/Proyectos/Sistema-clinico/scripts/configurar-servidor-24-7.sh "joseph@${ip}:/home/joseph/configurar-servidor-24-7.sh"

Write-Output "Ejecutando configuracion permanente en Linux Mint..."
ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "joseph@${ip}" "sudo bash /home/joseph/configurar-servidor-24-7.sh && rm -f /home/joseph/configurar-servidor-24-7.sh && echo '=== CONTENEDORES DOCKER ===' && docker ps"

Write-Output ">>> CONFIGURACION 24/7 COMPLETADA CON EXITO <<<"

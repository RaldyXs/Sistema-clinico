$detected = $false
for ($i = 0; $i -lt 60; $i++) {
    $profile = Get-NetConnectionProfile -InterfaceIndex 12 -ErrorAction SilentlyContinue
    if ($profile -and $profile.NetworkCategory -eq "Private") {
        $detected = $true
        Write-Output ">>> ¡RED PRIVADA ACTIVADA! Probando conexion con 192.168.16.19... <<<"
        break
    }
    Start-Sleep -Seconds 2
}

if ($detected) {
    Start-Sleep -Seconds 1
    $ping = Test-Connection -ComputerName 192.168.16.19 -Count 2 -Quiet
    Write-Output "Ping a Linux Mint: $ping"
    $curl = curl.exe -m 3 -I http://192.168.16.19 2>&1
    Write-Output "Curl a la web: $curl"
} else {
    Write-Output "Aun en red publica."
}

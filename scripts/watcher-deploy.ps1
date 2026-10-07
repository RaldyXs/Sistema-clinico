for ($i = 0; $i -lt 1800; $i++) {
    $n = Get-NetNeighbor -IPAddress 192.168.16.19 -ErrorAction SilentlyContinue
    if ($n -and $n.State -ne 'Unreachable') {
        Write-Host "Host reachable! Transferring bundle..."
        scp -o ConnectTimeout=3 -o StrictHostKeyChecking=no C:\Proyectos\web_dist.tar.gz joseph@192.168.16.19:/home/joseph/web_dist.tar.gz
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Bundle transferred. Extracting and deploying to Docker clinica_web..."
            ssh -o StrictHostKeyChecking=no joseph@192.168.16.19 "mkdir -p /home/joseph/Sistema-clinico/apps/web && tar -xzf /home/joseph/web_dist.tar.gz -C /home/joseph/Sistema-clinico/apps/web/ && docker cp /home/joseph/Sistema-clinico/apps/web/dist/. clinica_web:/usr/share/nginx/html/ && rm -f /home/joseph/web_dist.tar.gz && (crontab -l 2>/dev/null; echo '* * * * * ping -c 1 192.168.16.4 >/dev/null 2>&1') | sort -u | crontab -"
            Write-Host "DEPLOYED_SUCCESSFULLY"
            break
        }
    }
    Start-Sleep -Seconds 2
}

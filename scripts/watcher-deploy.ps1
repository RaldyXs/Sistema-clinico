for ($i = 0; $i -lt 1800; $i++) {
    $n = Get-NetNeighbor -IPAddress 192.168.16.19 -ErrorAction SilentlyContinue
    if ($n -and $n.State -ne 'Unreachable') {
        Write-Host "Host reachable! Deploying..."
        scp -o ConnectTimeout=3 -o StrictHostKeyChecking=no C:\Proyectos\web_dist.tar.gz joseph@192.168.16.19:/home/joseph/web_dist.tar.gz
        if ($LASTEXITCODE -eq 0) {
            ssh -o StrictHostKeyChecking=no joseph@192.168.16.19 "tar -xzf /home/joseph/web_dist.tar.gz -C /home/joseph/Sistema-clinico/apps/web/ && docker cp /home/joseph/Sistema-clinico/apps/web/dist/. clinica_web:/usr/share/nginx/html/ && rm -f /home/joseph/web_dist.tar.gz"
            Write-Host "DEPLOYED_SUCCESSFULLY"
            break
        }
    }
    Start-Sleep -Seconds 2
}

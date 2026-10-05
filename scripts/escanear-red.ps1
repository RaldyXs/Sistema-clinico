$subnet = "192.168.16."
Write-Output "Escaneando subred $subnet 1..254..."

$jobs = @()
1..254 | ForEach-Object {
    $ip = "$subnet$_"
    $jobs += Start-Job -ScriptBlock {
        param($target)
        $t22 = $false
        $t80 = $false
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $ar = $tcp.BeginConnect($target, 22, $null, $null)
            if ($ar.AsyncWaitHandle.WaitOne(200)) {
                $tcp.EndConnect($ar)
                $t22 = $true
            }
            $tcp.Close()
        } catch {}

        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $ar = $tcp.BeginConnect($target, 80, $null, $null)
            if ($ar.AsyncWaitHandle.WaitOne(200)) {
                $tcp.EndConnect($ar)
                $t80 = $true
            }
            $tcp.Close()
        } catch {}

        if ($t22 -or $t80) {
            [PSCustomObject]@{
                IP = $target
                SSH = $t22
                HTTP = $t80
            }
        }
    } -ArgumentList $ip
}

$results = $jobs | Wait-Job -Timeout 10 | Receive-Job
$jobs | Remove-Job -Force
$results | Format-Table -AutoSize

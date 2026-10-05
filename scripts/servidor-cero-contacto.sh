#!/bin/bash
# ==============================================================================
# Servidor Clínico 24/7 - Modo Cero Contacto (Headless Server)
# ==============================================================================
# Este script convierte esta PC en un verdadero servidor desatendido:
# 1. Desactiva el ahorro de energía en la tarjeta de red WiFi.
# 2. Configura auto-despliegue continuo (cada 2 minutos revisa GitHub y actualiza Docker).
# 3. Mantiene activo el enlace con Windows mediante ping continuo.
# ==============================================================================

set -e

REPO_DIR="$HOME/Sistema-clinico"

echo "⚙️ Configurando Servidor 24/7 Desatendido..."

# 1. Desactivar ahorro de energía en WiFi para que nunca corte la red
if command -v nmcli &> /dev/null; then
    sudo bash -c 'cat > /etc/NetworkManager/conf.d/default-wifi-powersave-off.conf <<EOF
[connection]
wifi.powersave = 2
EOF'
    sudo systemctl restart NetworkManager 2>/dev/null || true
fi

# 2. Asegurar que git en la máquina no dé errores de permisos
git config --global --add safe.directory "$REPO_DIR"

# 3. Crear el script de sincronización automática
mkdir -p "$HOME/scripts"
cat > "$HOME/scripts/auto-sync.sh" << 'EOF'
#!/bin/bash
REPO_DIR="$HOME/Sistema-clinico"
WINDOWS_IP="192.168.16.4"

# Mantener viva la tabla de red hacia Windows
ping -c 1 "$WINDOWS_IP" >/dev/null 2>&1 || true

cd "$REPO_DIR" || exit 1

# Verificar si hay cambios en GitHub
git fetch origin main >/dev/null 2>&1 || exit 0
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "[$(date)] Nuevos cambios detectados. Actualizando..." >> "$HOME/sync.log"
    git pull origin main >> "$HOME/sync.log" 2>&1
    
    # Si viene bundle web precompilado, actualizar el contenedor de inmediato
    if [ -d "$REPO_DIR/apps/web/dist" ]; then
        docker cp "$REPO_DIR/apps/web/dist/." clinica_web:/usr/share/nginx/html/ >> "$HOME/sync.log" 2>&1 || true
        echo "[$(date)] Frontend actualizado con éxito en Docker." >> "$HOME/sync.log"
    fi
fi
EOF

chmod +x "$HOME/scripts/auto-sync.sh"

# 4. Programar en Crontab para ejecutarse cada 2 minutos y al encender la PC
(crontab -l 2>/dev/null | grep -v "auto-sync.sh"; echo "*/2 * * * * $HOME/scripts/auto-sync.sh"; echo "@reboot sleep 30 && $HOME/scripts/auto-sync.sh") | crontab -

# 5. Ejecutar una primera sincronización inmediata
"$HOME/scripts/auto-sync.sh"

echo "=========================================================="
echo "✅ ¡Servidor 24/7 Modo Cero Contacto configurado con éxito!"
echo "=========================================================="
echo "A partir de este momento:"
echo "• No necesitas monitor, teclado ni ratón en esta PC."
echo "• Cada vez que se suban cambios a GitHub desde Windows,"
echo "  esta PC se actualizará automáticamente en 2 minutos."
echo "=========================================================="

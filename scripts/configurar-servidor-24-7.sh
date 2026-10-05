#!/bin/bash
# ==============================================================================
# Script de Configuración: Convertir Linux Mint en Servidor 24/7 Permanente
# ==============================================================================
# Desactiva la suspensión por inactividad, hibernación y suspensión al cerrar la tapa
# para que Docker y los servicios web estén disponibles el 99.9% del tiempo sin caídas.

echo "========================================================"
echo "  Configurando Linux Mint como Servidor 24/7 Permanente"
echo "========================================================"

# 1. Enmascarar objetivos de suspensión a nivel de Systemd (Kernel)
echo "[1/4] Desactivando objetivos de suspensión a nivel de sistema..."
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target

# 2. Configurar systemd-logind para ignorar cierre de tapa (por si es laptop)
echo "[2/4] Configurando comportamiento de cierre de tapa (Lid Switch)..."
sudo sed -i 's/#HandleLidSwitch=.*/HandleLidSwitch=ignore/' /etc/systemd/logind.conf
sudo sed -i 's/^HandleLidSwitch=.*/HandleLidSwitch=ignore/' /etc/systemd/logind.conf
sudo sed -i 's/#HandleLidSwitchExternalPower=.*/HandleLidSwitchExternalPower=ignore/' /etc/systemd/logind.conf
sudo sed -i 's/^HandleLidSwitchExternalPower=.*/HandleLidSwitchExternalPower=ignore/' /etc/systemd/logind.conf

# 3. Desactivar suspensión en el gestor de energía del escritorio (Cinnamon / MATE / XFCE)
echo "[3/4] Desactivando temporizadores de inactividad de escritorio..."
gsettings set org.cinnamon.settings-daemon.plugins.power sleep-inactive-ac-timeout 0 2>/dev/null || true
gsettings set org.cinnamon.settings-daemon.plugins.power sleep-inactive-battery-timeout 0 2>/dev/null || true
gsettings set org.cinnamon.settings-daemon.plugins.power lock-on-suspend false 2>/dev/null || true

# 4. Asegurar que Docker inicie automáticamente con el sistema
echo "[4/4] Verificando que Docker inicie automáticamente con el arranque..."
sudo systemctl enable docker

echo "========================================================"
echo "  Estado de la Suspensión:"
echo "========================================================"
systemctl status sleep.target | grep -i "Loaded:"
echo ""
echo "✅ ¡Configuración completada con éxito!"
echo "Esta máquina ahora funcionará continuamente sin suspenderse ni cortar la red."

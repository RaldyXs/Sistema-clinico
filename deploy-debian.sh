#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue Automatizado para Debian 12 (Proxmox VE)
# Sistema Clínico SaaS
# ==============================================================================

set -e

echo "========================================================"
echo "🏥 Desplegando Sistema Clínico SaaS en Debian 12"
echo "========================================================"

# 1. Comprobar permisos de root
if [ "$EUID" -ne 0 ]; then
  echo "⚠️ Por favor ejecuta este script con sudo: sudo ./deploy-debian.sh"
  exit 1
fi

# 2. Instalar Docker si no está presente
if ! command -v docker &> /dev/null; then
  echo "📦 Docker no detectado. Instalando Docker oficial en Debian 12..."
  apt-get update
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  echo "✅ Docker instalado correctamente."
else
  echo "✅ Docker ya está instalado."
fi

# 3. Comprobar archivo .env
if [ ! -f ".env" ]; then
  echo "⚠️ No se encontró archivo .env. Creando uno a partir de .env.example..."
  cp .env.example .env
  
  # Generar JWT_SECRET aleatorio criptográfico
  JWT_RAND=$(openssl rand -hex 32)
  sed -i "s/genera_un_secreto_criptografico_de_al_menos_64_caracteres_aleatorios/$JWT_RAND/" .env
  
  # Generar Password aleatorio para PostgreSQL
  DB_RAND=$(openssl rand -hex 16)
  sed -i "s/tu_password_seguro_aqui/$DB_RAND/g" .env
  
  echo "🔑 Secretos criptográficos generados automáticamente en .env"
fi

# 4. Construir y levantar contenedores
echo "🚀 Levantando contenedores (PostgreSQL, NestJS API, Web Nginx)..."
docker compose down --remove-orphans || true
docker compose up -d --build

# 5. Obtener IP local del servidor
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "========================================================"
echo "🎉 ¡DESPLIEGUE COMPLETADO EXITOSAMENTE!"
echo "========================================================"
echo "Puedes acceder al sistema desde cualquier navegador en:"
echo "👉 Portal Clínico:  http://$SERVER_IP"
echo "👉 Consola Admin:   http://$SERVER_IP/admin"
echo "👉 API Backend:     http://$SERVER_IP:3000"
echo "========================================================"
echo "Para ver logs en tiempo real:"
echo "  docker compose logs -f"
echo "========================================================"

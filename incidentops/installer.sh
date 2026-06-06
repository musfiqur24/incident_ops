#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$PWD}"
NODE_MAJOR="${NODE_MAJOR:-20}"
MONGODB_MAJOR="${MONGODB_MAJOR:-8.0}"

if [[ "${EUID}" -eq 0 ]]; then
  echo "Please run this script as the ubuntu user, not as root. It will ask for sudo when needed."
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This installer is designed for Ubuntu/Debian-based Linux servers."
  exit 1
fi

source /etc/os-release
CODENAME="${VERSION_CODENAME:-}"

if [[ -z "$CODENAME" ]]; then
  echo "Could not detect Ubuntu codename."
  exit 1
fi

echo "Detected Ubuntu codename: $CODENAME"

if [[ "$CODENAME" != "noble" && "$CODENAME" != "jammy" && "$CODENAME" != "focal" ]]; then
  echo ""
  echo "Unsupported Ubuntu version for MongoDB direct installation: $CODENAME"
  echo "Please use one of the following for this project:"
  echo "  - Ubuntu 24.04 LTS: noble"
  echo "  - Ubuntu 22.04 LTS: jammy"
  echo "  - Ubuntu 20.04 LTS: focal"
  echo ""
  echo "Recommended for students: Ubuntu Server 24.04 LTS"
  exit 1
fi

echo "==> Cleaning old/broken MongoDB repositories"
sudo rm -f /etc/apt/sources.list.d/*mongo*
sudo rm -f /etc/apt/sources.list.d/*mongodb*
sudo rm -f /usr/share/keyrings/mongodb*.gpg
sudo rm -f /usr/share/keyrings/mongodb-*.gpg

echo "==> Updating apt packages"
sudo apt-get clean
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release build-essential

echo "==> Installing Node.js ${NODE_MAJOR}.x from NodeSource"
sudo mkdir -p /etc/apt/keyrings

curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | \
  sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | \
  sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null

sudo apt-get update -y
sudo apt-get install -y nodejs

echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"

echo "==> Installing MongoDB Community Server ${MONGODB_MAJOR}"

curl -fsSL "https://pgp.mongodb.com/server-${MONGODB_MAJOR}.asc" | \
  sudo gpg -o "/usr/share/keyrings/mongodb-server-${MONGODB_MAJOR}.gpg" \
  --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-${MONGODB_MAJOR}.gpg ] https://repo.mongodb.org/apt/ubuntu ${CODENAME}/mongodb-org/${MONGODB_MAJOR} multiverse" | \
  sudo tee "/etc/apt/sources.list.d/mongodb-org-${MONGODB_MAJOR}.list"

sudo apt-get update -y
sudo apt-get install -y mongodb-org

echo "==> Starting MongoDB service"
sudo mkdir -p /var/lib/mongodb /var/log/mongodb
sudo chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb

sudo systemctl daemon-reload
sudo systemctl start mongod
sudo systemctl enable mongod

sleep 10

echo "MongoDB service: $(systemctl is-active mongod)"

echo "==> Creating environment files if missing"
cd "$APP_DIR"

if [[ ! -f backend/.env ]]; then
  cp backend/.env.example backend/.env
fi

if [[ ! -f frontend/.env ]]; then
  cp frontend/.env.example frontend/.env
fi

echo "==> Installing project dependencies"
npm install
npm run install:all

echo "==> Seeding database"
npm run seed

echo ""
echo "Installation complete."
echo "Node: $(node -v)"
echo "npm: $(npm -v)"
echo "MongoDB service: $(systemctl is-active mongod)"
echo ""
echo "Run the app with:"
echo "npm run dev"
echo ""
echo "Frontend:"
echo "http://YOUR_VM_PUBLIC_IP:5173"
echo ""
echo "Backend health:"
echo "http://YOUR_VM_PUBLIC_IP:5001/api/health"
echo ""
echo "Login:"
echo "admin@auto-reliability.com / hello123"

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

echo "==> Updating apt packages"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release build-essential

echo "==> Installing Node.js ${NODE_MAJOR}.x from NodeSource"
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_REPO="deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main"
echo "$NODE_REPO" | sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null
sudo apt-get update -y
sudo apt-get install -y nodejs

node -v

sudo apt install -y npm

npm -v

echo "==> Installing MongoDB Community Server"
# Update system packages
echo "Updating system packages..."
sudo apt-get update -y


#From a terminal, install gnupg and curl if they are not already available
sudo apt-get install gnupg curl

#To import the MongoDB public GPG key, run the following command
curl -fsSL https://pgp.mongodb.com/server-8.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg \
   --dearmor


#Create the list file /etc/apt/sources.list.d/mongodb-enterprise-8.0.list for your version of Ubuntu.
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.com/apt/ubuntu noble/mongodb-enterprise/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-enterprise-8.0.list

#Reload the package database
sudo apt-get update

#Install MongoDB Enterprise Server
sudo apt-get install -y mongodb-enterprise

# Start MongoDB service
echo "Starting MongoDB service..."
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod

# Wait 10s for MongoDB to fully get started
sleep 20

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
echo "Run the app with: npm run dev"
echo "Frontend: http://YOUR_VM_PUBLIC_IP:5173"
echo "Backend health: http://YOUR_VM_PUBLIC_IP:5001/api/health"
echo "Login: admin@auto-reliability.com / hello123"

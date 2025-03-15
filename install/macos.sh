#!/bin/bash
# 🚀 Door Fred AI

echo "🔍 Controleren of Docker is geïnstalleerd..."
if ! command -v docker &> /dev/null
then
    echo "🛠️ Docker niet gevonden, installeren..."
    brew install --cask docker
    open --background -a Docker
    echo "⏳ Wachten tot Docker draait..."
    while ! docker system info > /dev/null 2>&1; do sleep 2; done
    echo "✅ Docker is geïnstalleerd en gestart!"
else
    echo "✅ Docker is al geïnstalleerd!"
fi

echo "🔍 Controleren of Docker Compose is geïnstalleerd..."
if ! command -v docker-compose &> /dev/null
then
    echo "🛠️ Docker Compose niet gevonden, installeren..."
    brew install docker-compose
    echo "✅ Docker Compose is geïnstalleerd!"
else
    echo "✅ Docker Compose is al geïnstalleerd!"
fi

echo "🔍 Controleren of Docker Desktop GUI nodig is..."
if [ ! -d "/Applications/Docker.app" ]; then
    echo "🖥️ Docker GUI niet gevonden, installeren..."
    brew install --cask docker
    echo "✅ Docker GUI geïnstalleerd!"
    echo "🔄 Start Docker Desktop..."
    open --background -a Docker
else
    echo "✅ Docker Desktop is al geïnstalleerd!"
fi

echo "📂 Aanmaken van Docker Compose configuratie..."
cat <<EOF > docker-compose.yml

services:
  mongo1:
    image: mongo:8.0
    container_name: mongo1
    restart: always
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all"]
    ports:
      - "27017:27017"
    volumes:
      - mongo1_data:/data/db

  mongo2:
    image: mongo:8.0
    container_name: mongo2
    restart: always
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all"]
    ports:
      - "27018:27017"
    volumes:
      - mongo2_data:/data/db

  mongo3:
    image: mongo:8.0
    container_name: mongo3
    restart: always
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all"]
    ports:
      - "27019:27017"
    volumes:
      - mongo3_data:/data/db

volumes:
  mongo1_data:
  mongo2_data:
  mongo3_data:
EOF

echo "📂 Aanmaken van init script..."
cat <<EOF > init-replica.sh
#!/bin/bash
# 🚀 Door Fred AI

echo "⏳ Wachten tot MongoDB instances opstarten..."
sleep 10

echo "🔧 Initialiseren van Replica Set..."
docker exec -it mongo1 mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo1:27017' },
    { _id: 1, host: 'mongo2:27017' },
    { _id: 2, host: 'mongo3:27017' }
  ]
});
"

echo "✅ Replica Set geconfigureerd!"
echo "🔗 Verbinden met: mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0"
EOF

chmod +x init-replica.sh

echo "🚀 Starten van Docker containers..."
docker-compose up -d

echo "⏳ Wachten tot MongoDB klaar is..."
sleep 10

echo "🔧 Initialiseren van Replica Set..."
bash init-replica.sh

echo "✅ MongoDB Replica Set is volledig geïnstalleerd en gestart!"
echo "🔗 Connection URL: mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0"

cd ..
# schrijf naar .env
echo "📝 Schrijven naar .env..."
cat <<EOF > .env
DATABASE_URL="mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0"
POLARLEARN_URL="localhost:3000"

AUTH_GOOGLE_ID="Stop hier de Google OAuth2 Client ID die je hebt gekregen van de google cloud console"
AUTH_GOOGLE_SECRET="Stop hier de Google OAuth2 Client Secret die je hebt gekregen van de google cloud console"
AUTH_GITHUB_ID="Stop hier de GitHub OAuth2 Client ID die je hebt gekregen van de GitHub Developer Settings"
AUTH_GITHUB_SECRET="Stop hier de GitHub OAuth2 Client Secret die je hebt gekregen van de GitHub Developer Settings"

AUTH_SECRET="RAGrYVkgy0ebjRUcTsJq4U2gexrr5IWrvBS6YvyoWBw=" # onveilig vervang voor prod
AUTH_URL="localhost:3000"
EOF

echo "✅ .env is geconfigureerd!"
echo "🛠️ install met npm"
npm install --legacy-peer-deps


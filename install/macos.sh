#!/bin/bash

echo "
                                             __ 
   _____     _         __                   |  |
  |  _  |___| |___ ___|  |   ___ ___ ___ ___|  |
  |   __| . | | .'|  _|  |__| -_| .'|  _|   |__|
  |__|  |___|_|__,|_| |_____|___|__,|_| |_|_|__|

"
echo " 
als er een error is geen paniek, probeer de installatie opnieuw te runnen
"

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
DB_NAME="polarlearn"
random_string=$(openssl rand -base64 32)

# Stop MongoDB als het al draait
pgrep mongod &> /dev/null && { echo "🛑 Stoppen van draaiende MongoDB-processen..."; pkill mongod; sleep 5; }

mkdir -p "$SCRIPT_DIR/mongo/rs1" "$SCRIPT_DIR/mongo/rs2" "$SCRIPT_DIR/mongo/rs3"

# Functie om MongoDB te starten met detectie van errors
start_mongodb() {
    echo "🚀 MongoDB-instances starten..."
    for i in {1..3}; do  # Maximaal 3 pogingen
        mongod --dbpath "$SCRIPT_DIR/mongo/rs1" --port 27017 --replSet rs0 --bind_ip 127.0.0.1 --fork --logpath "$SCRIPT_DIR/mongo/rs1.log"
        mongod --dbpath "$SCRIPT_DIR/mongo/rs2" --port 27018 --replSet rs0 --bind_ip 127.0.0.1 --fork --logpath "$SCRIPT_DIR/mongo/rs2.log"
        mongod --dbpath "$SCRIPT_DIR/mongo/rs3" --port 27019 --replSet rs0 --bind_ip 127.0.0.1 --fork --logpath "$SCRIPT_DIR/mongo/rs3.log"

        sleep 5

        if pgrep mongod > /dev/null; then
            echo "✅ MongoDB succesvol gestart."
            return 0
        else
            echo "❌ Fout bij starten van MongoDB (poging $i/3), opnieuw proberen..."
            sleep 5
        fi
    done

    echo "🚨 Kan MongoDB niet starten na 3 pogingen, controleer logs!"
    exit 1
}

# Start MongoDB met foutafhandeling
start_mongodb

# Initialiseer Replica Set als deze nog niet bestaat
echo "🔄 Initialiseren van Replica Set..."
INIT_OUTPUT=$(mongosh --port 27017 --quiet --eval "rs.status()" 2>&1)

if echo "$INIT_OUTPUT" | grep -q "MongoServerError: already initialized"; then
    echo "✅ Replica Set is al ingesteld, overslaan."
else
    mongosh --port 27017 --quiet --eval "
    rs.initiate({
      _id: 'rs0',
      members: [
        { _id: 0, host: '127.0.0.1:27017' },
        { _id: 1, host: '127.0.0.1:27018' },
        { _id: 2, host: '127.0.0.1:27019' }
      ]
    });
    "
    echo "✅ Replica Set geconfigureerd."
fi

# Wacht tot de Replica Set klaar is
sleep 5

# Maak database aan
mongosh --port 27017 --quiet --eval "
use $DB_NAME;
db.test_collection.insertOne({ created: new Date() });
"

# Toon connection URL
echo "✅ MongoDB Replica Set gestart en database '$DB_NAME' aangemaakt!"

# Installeer npm dependencies
npm i --legacy-peer-deps

# Schrijf .env bestand
echo "
DATABASE_URL=mongodb://127.0.0.1:27017,127.0.0.1:27018,127.0.0.1:27019/$DB_NAME?replicaSet=rs0
POLARLEARN_URL=\"localhost:3000\"

AUTH_GOOGLE_ID=\"Stop hier de Google OAuth2 Client ID die je hebt gekregen van de google cloud console\"
AUTH_GOOGLE_SECRET=\"Stop hier de Google OAuth2 Client Secret die je hebt gekregen van de google cloud console\"
AUTH_GITHUB_ID=\"Stop hier de GitHub OAuth2 Client ID die je hebt gekregen van de GitHub Developer Settings\"
AUTH_GITHUB_SECRET=\"Stop hier de GitHub OAuth2 Client Secret die je hebt gekregen van de GitHub Developer Settings\"

AUTH_SECRET=\"$random_string\"
AUTH_URL=\"localhost:3000\"
" >> .env

# Prisma push
pnpx prisma db push

clear
echo "
                                             __ 
   _____     _         __                   |  |
  |  _  |___| |___ ___|  |   ___ ___ ___ ___|  |
  |   __| . | | .'|  _|  |__| -_| .'|  _|   |__|
  |__|  |___|_|__,|_| |_____|___|__,|_| |_|_|__|

"

echo "✅ PolarLearn geïnstalleerd!"
echo
echo "🔗 Koppel MongoDB Compass met de DB met de volgende connection string:"
echo "  mongodb://127.0.0.1:27017,127.0.0.1:27018,127.0.0.1:27019/$DB_NAME?replicaSet=rs0"
echo
echo "🚀 Start PolarLearn met:"
echo "  npm run dev"
echo 
echo "🛠️ Test de build met:"
echo "  pnpm build"
echo
echo "🛑 Stop de database met:"
echo "  sudo pkill mongod"
echo
echo "Veel succes! 🚀"

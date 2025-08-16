#!/bin/bash

echo "
                                             __ 
   _____     _         __                   |  |
  |  _  |___| |___ ___|  |   ___ ___ ___ ___|  |
  |   __| . | | .'|  _|  |__| -_| .'|  _|   |__|
  |__|  |___|_|__,|_| |_____|___|__,|_| |_|_|__|

"
echo " 
als er een error is, geen paniek! Probeer de installatie opnieuw uit te voeren.
"

# Detect if we're running in Termux
is_termux() {
    [ -n "$TERMUX_VERSION" ] || [ -d "/data/data/com.termux" ]
}
# 📦 Installeren van MongoDB
install_mongodb() {
    if command -v mongod &> /dev/null; then
        echo "✅ MongoDB is al geïnstalleerd."
        return
    fi

    echo "🚀 MongoDB installeren..."
    
    if is_termux; then
        echo "📱 Termux gedetecteerd - MongoDB installeren via pkg..."
        pkg update
        pkg install -y mongodb
    else
        case "$OSTYPE" in
        "linux"* )
            if command apt -v &> /dev/null; then
                # Voor Debian/Ubuntu
                    sudo apt-get update # Copilot suggestie
                    sudo apt-get install -y gnupg curl
                    curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
                    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/8.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
                    sudo apt-get update
                    sudo apt-get install -y mongodb-org
                elif command dnf --version &> /dev/null; then
                    sudo dnf install -y mongodb
                elif command yay --version &> /dev/null; then
                #ik kan geen manier vinden om het te automatiseren. Dus als jij het weet stop het er in!
                    yay -S aur/mongodb-bin
                else
                    echo "❌ Geen compatibele package manager/distro gevonden!"
                    exit 1
            fi ;;

        "darwin"* )
            #macos. niet zeker of ook moderne versies darwin zijn maar ik heb geen manier om te checken
            if command brew -v &> /dev/null; then
                    brew tap mongodb/brew
                    brew install mongodb-community@8.0
                else
                    echo "❌ Geen compatibele package manager gevonden!"
                    exit 1
            fi ;;
        * )
            echo '❌ Geen compatibele OS gevonden! (hoe voer je dit script dan uit!?)'
        esac
    fi

    if ! command -v mongod &> /dev/null; then
        echo "❌ MongoDB installatie is mislukt!"
        exit 1
    fi
    echo "✅ MongoDB succesvol geïnstalleerd."
}
# instaleer node + pnpm
install_node() {
    if command -v node &> /dev/null; then
        echo "✅ Node.js is al geïnstalleerd."
        # Controleer de versie
        NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/^v//')
        if [ "$NODE_VERSION" -ge 19 ]; then
            echo "ℹ️ Node.js versie is $NODE_VERSION, dit is goed genoeg."
        else
            echo "ℹ️ Node.js versie is $NODE_VERSION, dit is niet hoog genoeg."
            echo "🚀 Node.js updaten naar de laatste LTS versie..."
            if command -v nvm &> /dev/null; then
                echo "ℹ️ nvm is al geïnstalleerd, updaten..."
                nvm install --lts
                nvm use --lts
            else
                echo "🚀 nvm installeren..."
                wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
                nvm install --lts
                nvm use --lts
            fi
            echo "✅ Node.js succesvol bijgewerkt naar de laatste LTS versie."
        fi
        echo "🚀 pnpm updaten..."
        
        # Check if node is working before updating pnpm
        if ! node --version &> /dev/null; then
            echo "❌ Node.js werkt niet correct, kan pnpm niet updaten!"
            exit 1
        fi
        
        npm install -g pnpm@latest-10
        if ! command -v pnpm &> /dev/null; then
            echo "❌ pnpm update is mislukt!"
            exit 1
        fi
        echo "✅ pnpm succesvol bijgewerkt."
        return
    fi

    echo "🚀 Node.js installeren..."
    
    if is_termux; then
        echo "📱 Termux gedetecteerd - Node.js installeren via pkg..."
        pkg update
        # Install OpenSSL first to ensure compatibility
        pkg install -y openssl
        pkg install -y nodejs
        
        # Check if node works properly
        if ! node --version &> /dev/null; then
            echo "⚠️ Node.js van pkg heeft linking problemen, proberen met nvm..."
            # Remove the problematic nodejs installation
            pkg uninstall -y nodejs
            
            # Install curl for nvm if not available
            if ! command -v curl &> /dev/null; then
                pkg install -y curl
            fi
            
            # Install nvm
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
            
            # Source nvm
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
            
            # Install latest LTS Node.js via nvm
            nvm install --lts
            nvm use --lts
            
            # Check if node works now
            if ! node --version &> /dev/null; then
                echo "❌ Node.js installatie via nvm is ook mislukt!"
                exit 1
            fi
        fi
        
        # In Termux, npm is typically included with nodejs
        if ! command -v npm &> /dev/null; then
            echo "ℹ️ npm niet gevonden, installeren via pkg..."
            pkg install -y npm || echo "⚠️ npm package niet beschikbaar, mogelijk al gebundeld met nodejs"
        fi
    else
        case "$OSTYPE" in
        "linux"* )
                if command -v apt &> /dev/null; then
                    sudo apt update && sudo apt install -y nodejs
                    sudo apt install npm -y
                elif command -v dnf &> /dev/null; then
                    sudo dnf install -y nodejs
                    elif command brew -v &> /dev/null; then
                        brew install node
                    elif command yay --version &> /dev/null; then
                    #ik kan geen manier vinden om het te automatiseren. Dus als jij het weet stop het er in!
                        yay -S extra/nodejs
                else
                    echo "❌ Geen compatibele package manager gevonden!"            
                    exit 1
            fi ;;
        "darwin"* )
            #macos. niet zeker of ook moderne versies darwin zijn maar ik heb geen manier om te checken
            if command brew -v &> /dev/null; then
                    brew install node
                else 
                echo "❌ Geen compatibele package manager gevonden! Installeer brew via https://brew.sh/"            
                    exit 1
            fi ;;
        * )
            echo '❌ Oeps! Dit script is niet geconfigureerd voor jouw OS. Probeer het handmatig te installeren.'
        esac
    fi
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js installatie is mislukt!"
        exit 1
    fi
    echo "✅ Node.js succesvol geïnstalleerd."
    echo "🚀 pnpm installeren..."
    
    # Check if node is working before installing pnpm
    if ! node --version &> /dev/null; then
        echo "❌ Node.js werkt niet correct, kan pnpm niet installeren!"
        exit 1
    fi
    
    npm install -g pnpm@latest-10
    if ! command -v pnpm &> /dev/null; then
        echo "❌ pnpm installatie is mislukt!"
        exit 1
    fi
    echo "✅ pnpm succesvol geïnstalleerd."
}

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
DB_NAME="polarlearn"

# Generate random string - use different methods based on available tools
if command -v openssl &> /dev/null; then
    random_string=$(openssl rand -base64 32)
elif command -v xxd &> /dev/null && [ -r /dev/urandom ]; then
    random_string=$(head -c 24 /dev/urandom | xxd -p)
elif command -v sha256sum &> /dev/null; then
    # Fallback for systems without openssl or xxd
    random_string=$(date +%s%N | sha256sum | head -c 32)
else
    # Ultimate fallback using basic tools
    random_string=$(date +%s%N)$(whoami)$(hostname 2>/dev/null || echo "unknown") | md5sum 2>/dev/null | head -c 32 || date +%s%N
fi

install_node
install_mongodb

# Stop MongoDB als het al draait
if is_termux; then
    pgrep mongod &> /dev/null && { echo "🛑 Stoppen van draaiende MongoDB-processen..."; pkill mongod; sleep 10; }
else
    pgrep mongod &> /dev/null && { echo "🛑 Stoppen van draaiende MongoDB-processen..."; sudo pkill mongod; sleep 10; }
fi

# Database directories opnieuw aanmaken
mkdir -p "$SCRIPT_DIR/mongo/rs1" "$SCRIPT_DIR/mongo/rs2" "$SCRIPT_DIR/mongo/rs3"

# Probeer MongoDB 3 keer te starten als het faalt
max_attempts=3
attempt=1
while [ $attempt -le $max_attempts ]; do
    echo "🚀 MongoDB-instances starten (poging $attempt/$max_attempts)..."

    mongod --dbpath "$SCRIPT_DIR/mongo/rs1" --port 27017 --replSet rs0 --bind_ip 127.0.0.1 --fork --logpath "$SCRIPT_DIR/mongo/rs1.log"
    mongod --dbpath "$SCRIPT_DIR/mongo/rs2" --port 27018 --replSet rs0 --bind_ip 127.0.0.1 --fork --logpath "$SCRIPT_DIR/mongo/rs2.log"
    mongod --dbpath "$SCRIPT_DIR/mongo/rs3" --port 27019 --replSet rs0 --bind_ip 127.0.0.1 --fork --logpath "$SCRIPT_DIR/mongo/rs3.log"

    sleep 5

    # Controleer of MongoDB draait
    if pgrep mongod > /dev/null; then
        echo "✅ MongoDB succesvol gestart."
        break
    else
        echo "❌ Fout bij starten van MongoDB (poging $attempt/$max_attempts), opnieuw proberen..."
        pkill mongod
        sleep 5
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "🚨 Kan MongoDB niet starten na $max_attempts pogingen, controleer logs!"
    exit 1
fi

# Initialiseer Replica Set
mongosh --port 27017 --quiet --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: '127.0.0.1:27017' },
    { _id: 1, host: '127.0.0.1:27018' },
    { _id: 2, host: '127.0.0.1:27019' }
  ]
});
"  > /dev/null 2>&1

sleep 5

# Maak database aan
mongosh --port 27017 --quiet --eval "
use $DB_NAME;
db.test_collection.insertOne({ created: new Date() });
"  > /dev/null 2>&1
echo "✅ db aangemaakt"
echo "🚀 Starten met install van node packages (Dit kan heel lang duren)"
# Verberg npm logs
pnpm i

# .env bestand aanmaken (alleen als het nog niet bestaat)
if [ ! -f .env ]; then
    echo "
DATABASE_URL=\"mongodb://127.0.0.1:27017,127.0.0.1:27018,127.0.0.1:27019/$DB_NAME?replicaSet=rs0\"
POLARLEARN_URL=\"http://localhost:3000\"

AUTH_GOOGLE_ID=\"Stop hier de Google OAuth2 Client ID die je hebt gekregen van de google cloud console\"
AUTH_GOOGLE_SECRET=\"Stop hier de Google OAuth2 Client Secret die je hebt gekregen van de google cloud console\"
AUTH_GITHUB_ID=\"Stop hier de GitHub OAuth2 Client ID die je hebt gekregen van de GitHub Developer Settings\"
AUTH_GITHUB_SECRET=\"Stop hier de GitHub OAuth2 Client Secret die je hebt gekregen van de GitHub Developer Settings\"

AUTH_SECRET=\"$random_string\"
AUTH_URL=\"http://localhost:3000\"
SECRET=\"$random_string\"
DISCORD_WEBHOOK=\"\"
" >> .env
    chmod 644 .env
    echo "✅ .env bestand aangemaakt!"
else
    echo "ℹ️ .env bestand bestaat al, overslaan..."
fi

# Verberg logs van Prisma migratie
pnpx prisma db push > /dev/null 2>&1


# eind scherm

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
echo "🔗 Koppel MongoDB Compass met de database via:"
echo "  mongodb://127.0.0.1:27017,127.0.0.1:27018,127.0.0.1:27019/$DB_NAME?replicaSet=rs0"
echo
echo "🚀 Start PolarLearn met:"
echo "  npm run dev"
echo 
echo "🛠️ Test de build met:"
echo "  pnpm build"
echo
echo "🛑 Stop de database met:"
if is_termux; then
    echo "  pkill mongod"
else
    echo "  sudo pkill mongod"
    echo "🟩 Of als je systemd gebruikt:"
    echo "  sudo systemctl stop mongod"
fi
echo
echo "Veel succes! 🚀"

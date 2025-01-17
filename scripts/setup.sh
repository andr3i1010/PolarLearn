#!/usr/bin/env bash

NON_INTERACTIVE=false
BUILD_MODE=""
DB_TYPE=""
DATABASE_URL=""
POLARLEARN_URL=""
ALLOW_EVERYONE_ON_DEV=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

for arg in "$@"; do
    case $arg in
        --non-interactive)
        NON_INTERACTIVE=true
        shift
        ;;
        --build=*)
        BUILD_MODE="${arg#*=}"
        shift
        ;;
        --db-type=*)
        DB_TYPE="${arg#*=}"
        shift
        ;;
        --database-url=*)
        DATABASE_URL="${arg#*=}"
        shift
        ;;
        --polarlearn-url=*)
        POLARLEARN_URL="${arg#*=}"
        shift
        ;;
        --allow-everyone-on-dev=*)
        ALLOW_EVERYONE_ON_DEV="${arg#*=}"
        shift
        ;;
        --google-client-id=*)
        GOOGLE_CLIENT_ID="${arg#*=}"
        shift
        ;;
        --google-client-secret=*)
        GOOGLE_CLIENT_SECRET="${arg#*=}"
        shift
        ;;
        --github-client-id=*)
        GITHUB_CLIENT_ID="${arg#*=}"
        shift
        ;;
        --github-client-secret=*)
        GITHUB_CLIENT_SECRET="${arg#*=}"
        shift
        ;;
    esac
done

check_env() {
    if [ ! -f "./.env.example" ]; then
        echo "Error: Deze script moet worden uitgevoerd in de root van PolarLearn." >&2
        exit 1
    fi
}

check_whiptail() {
    if ! [ -x "$(command -v whiptail)" ]; then
        echo 'Error: Whiptail is niet geinstalleerd.' >&2
        exit 1
    fi
}

select_database() {
    if [ "$NON_INTERACTIVE" = true ]; then
        db="$DB_TYPE"
    else
        db=$(whiptail --title "PolarLearn" --menu "Kies de database" 15 78 6 \
                    "PostgreSQL" "" \
                    "MySQL" "" \
                    "MSSQL" "" \
                    "PlanetScale" "" \
                    "CockroachDB" "" \
                    "MongoDB" "" 3>&1 1>&2 2>&3)
    fi
    case $db in
        "PostgreSQL")
        echo -e "\033[1;33m🐘 PostgreSQL geselecteerd\033[0m"
        sed -i '/datasource db {/!b;n;s/provider = ".*"/provider = "postgresql"/' prisma/schema.prisma
        ;;
        "MySQL")
        echo -e "\033[1;33m🐬 MySQL geselecteerd\033[0m"
        sed -i '/datasource db {/!b;n;s/provider = ".*"/provider = "mysql"/' prisma/schema.prisma
        ;;
        "MSSQL")
        echo -e "\033[1;33m🪟 MSSQL geselecteerd\033[0m"
        sed -i '/datasource db {/!b;n;s/provider = ".*"/provider = "sqlserver"/' prisma/schema.prisma
        ;;
        "PlanetScale")
        echo -e "\033[1;33m🪐 PlanetScale geselecteerd\033[0m"
        sed -i '/datasource db {/!b;n;s/provider = ".*"/provider = "mysql"/' prisma/schema.prisma
        ;;
        "CockroachDB")
        echo -e "\033[1;33m🪳 CockroachDB geselecteerd\033[0m"
        sed -i '/datasource db {/!b;n;s/provider = ".*"/provider = "cockroachdb"/' prisma/schema.prisma
        ;;
        "MongoDB")
        echo -e "\033[1;33m🌿 MongoDB geselecteerd\033[0m"
        sed -i '/datasource db {/!b;n;s/provider = ".*"/provider = "mongodb"/' prisma/schema.prisma
        ;;
        *)
        echo -e "\033[1;31m########## Annuleren gedrukt. ##########"
        exit 1
        ;;
    esac
}

configure_env() {
    echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
    select_database
    echo "POLARLEARN_URL=\"$POLARLEARN_URL\"" >> .env
    echo "ALLOW_EVERYONE_ON_DEV=\"$ALLOW_EVERYONE_ON_DEV\"" >> .env
    echo "AUTH_GOOGLE_ID=\"$GOOGLE_CLIENT_ID\"" >> .env
    echo "AUTH_GOOGLE_SECRET=\"$GOOGLE_CLIENT_SECRET\"" >> .env
    echo "AUTH_GITHUB_ID=\"$GITHUB_CLIENT_ID\"" >> .env
    echo "AUTH_GITHUB_SECRET=\"$GITHUB_CLIENT_SECRET\"" >> .env
    echo "AUTH_SECRET=\"$(openssl rand --base64 32)\"" >> .env
    echo -e "\033[1;32m🎉 .env is geconfigureerd! Voer dit script opnieuw uit om PolarLearn te bouwen."
}

first_time() {
    if [ ! -f "./.env" ]; then
        if [ "$NON_INTERACTIVE" = true ]; then
            configure_env
        else
            if whiptail --title "PolarLearn" --yesno "Dit lijkt de eerste keer te zijn dat je PolarLearn bouwt. Wil je door deze script de .env configureren?" 8 78; then
                dburl=$(whiptail --title "PolarLearn" --inputbox "Voer hier in de URL van de database:" 8 78 3>&1 1>&2 2>&3)
                echo "DATABASE_URL=\"$dburl\"" >> .env
                select_database
                polarlearn_url=$(whiptail --title "PolarLearn" --inputbox "Voer hier in de URL van waar PolarLearn wordt gehost:" 8 78 3>&1 1>&2 2>&3)
                echo "POLARLEARN_URL=\"$polarlearn_url\"" >> .env

                if whiptail --title "PolarLearn" --yesno "Wil je dat iedereen op de development build kan komen zelfs als de gebruiker niet is ingelogd?" 8 78; then
                    echo "ALLOW_EVERYONE_ON_DEV=\"true\"" >> .env
                else 
                    echo "ALLOW_EVERYONE_ON_DEV=\"false\"" >> .env
                fi

                googlecid=$(whiptail --title "PolarLearn" --inputbox "Voer hier in de Google OAuth2 Client ID:" 8 78 3>&1 1>&2 2>&3)
                googlecsecret=$(whiptail --title "PolarLearn" --inputbox "Voer hier in de Google OAuth2 Client Secret:" 8 78 3>&1 1>&2 2>&3)
                echo "GOOGLE_CLIENT_ID=$googlecid" >> .env
                echo "GOOGLE_CLIENT_SECRET=\"$googlecsecret\"" >> .env

                ghid=$(whiptail --title "PolarLearn" --inputbox "Voer hier in de GitHub OAuth2 Client ID:" 8 78 3>&1 1>&2 2>&3)
                ghsecret=$(whiptail --title "PolarLearn" --inputbox "Voer hier in de GitHub OAuth2 Client Secret:" 8 78 3>&1 1>&2 2>&3)

                echo "GITHUB_CLIENT_ID=\"$ghid\"" >> .env
                echo "GITHUB_CLIENT_SECRET=\"$ghsecret\"" >> .env

                echo "AUTH_SECRET=\"$(openssl rand --base64 32)\"" >> .env

                echo -e "\033[1;32m🎉 .env is geconfigureerd! Voer dit script opnieuw uit om PolarLearn te bouwen."
            else
                echo -e "\033[1;31m########## Annuleren gedrukt. ##########"
                exit 1
            fi
        fi
    fi
}

confirm_env() {
    if [ ! -f "./.env" ]; then
        echo -e "\033[1;31m########### .env bestand niet gevonden ###########"
        exit 1
    fi

    if ! grep -q "DATABASE_URL" .env || ! grep -q "POLARLEARN_URL" .env || ! grep -q "ALLOW_EVERYONE_ON_DEV" .env || ! grep -q "AUTH_GOOGLE_ID" .env || ! grep -q "AUTH_GOOGLE_SECRET" .env || ! grep -q "AUTH_GITHUB_ID" .env || ! grep -q "AUTH_GITHUB_SECRET" .env || ! grep -q "AUTH_SECRET" .env; then
        echo -e "\033[1;31m########### .env bestand is niet volledig ingevuld ###########"
        exit 1
    fi
}

build() {
    echo -e "\033[1;33m🚀 PolarLearn wordt gebouwd...\033[0m"
    pnpx prisma generate
    pnpm build
    echo -e "\033[1;32m🎉 PolarLearn is gebouwd!"
}

check_env
check_whiptail
first_time

if [ "$BUILD_MODE" = "prod" ]; then
    echo -e "\033[1m\033[92m#### 🌐 Productie build geselecteerd ####\033[0m"
    confirm_env
    select_database
    build
    echo -e "\033[1;33m🚀 PolarLearn wordt gestart...\033[0m"
    pnpm start
elif [ "$BUILD_MODE" = "dev" ]; then
    echo -e "\033[1m\033[38;5;214m#### 🧑‍💻 Development build geselecteerd ####\033[0m"
    confirm_env
    select_database
    build
    echo -e "\033[1;33m🚀 Dev server starten...\033[0m"
    pnpm dev
else
    if whiptail --title "PolarLearn " --yesno "Builden voor:" --yes-button "Productie" --no-button "Development" 8 78; then
        echo -e "\033[1m\033[92m#### 🌐 Productie build geselecteerd ####\033[0m"
        confirm_env
        select_database
        echo -n "Zijn deze instellingen correct? (y/n): "
        read -r confirm
        if [ "$confirm" != "y" ]; then
            echo -e "\033[1;31m########## Annuleren gedrukt. ##########"
            exit 1
        fi 
        build
        echo -e "\033[1;33m🚀 PolarLearn wordt gestart...\033[0m"
        pnpm start
    else
        echo -e "\033[1m\033[38;5;214m#### 🧑‍💻 Development build geselecteerd ####\033[0m"
        confirm_env
        select_database
        echo -n "Zijn deze instellingen correct? (y/n): "
        read -r confirm
        if [ "$confirm" != "y" ]; then
            echo -e "\033[1;31m########## Annuleren gedrukt. ##########"
            exit 1
        fi
        build
        echo -e "\033[1;33m🚀 Dev server starten...\033[0m"
        pnpm dev
    fi
fi
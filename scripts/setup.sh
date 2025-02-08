#!/usr/bin/env bash

set -e

NON_INTERACTIVE=false
BUILD_MODE=""
DATABASE_URL=""
POLARLEARN_URL=""
ALLOW_EVERYONE_ON_DEV=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Simplify argument parsing
for arg in "$@"; do
    case $arg in
        --non-interactive)
            NON_INTERACTIVE=true
            ;;
        --build=*)
            BUILD_MODE="${arg#*=}"
            ;;
        --database-url=*)
            DATABASE_URL="${arg#*=}"
            ;;
        --polarlearn-url=*)
            POLARLEARN_URL="${arg#*=}"
            ;;
        --allow-everyone-on-dev=*)
            ALLOW_EVERYONE_ON_DEV="${arg#*=}"
            ;;
        --google-client-id=*)
            GOOGLE_CLIENT_ID="${arg#*=}"
            ;;
        --google-client-secret=*)
            GOOGLE_CLIENT_SECRET="${arg#*=}"
            ;;
        --github-client-id=*)
            GITHUB_CLIENT_ID="${arg#*=}"
            ;;
        --github-client-secret=*)
            GITHUB_CLIENT_SECRET="${arg#*=}"
            ;;
        *)
            echo "Unknown option: $arg" >&2
            exit 1
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
    if ! command -v whiptail &> /dev/null; then
        echo 'Error: Whiptail is niet geïnstalleerd.' >&2
        exit 1
    fi
}

# Consolidate environment variable configuration
configure_env() {
    cat <<EOF >> .env
DATABASE_URL="$DATABASE_URL"
POLARLEARN_URL="$POLARLEARN_URL"
ALLOW_EVERYONE_ON_DEV="$ALLOW_EVERYONE_ON_DEV"
AUTH_GOOGLE_ID="$GOOGLE_CLIENT_ID"
AUTH_GOOGLE_SECRET="$GOOGLE_CLIENT_SECRET"
AUTH_GITHUB_ID="$GITHUB_CLIENT_ID"
AUTH_GITHUB_SECRET="$GITHUB_CLIENT_SECRET"
AUTH_SECRET="$(openssl rand --base64 32)"
EOF
    echo -e "\033[1;32m🎉 .env is geconfigureerd! Voer dit script opnieuw uit om PolarLearn te bouwen."
}

first_time() {
    if [ ! -f "./.env" ]; then
        if [ "$NON_INTERACTIVE" = true ]; then
            configure_env
        else
            if whiptail --title "PolarLearn" --yesno "Dit lijkt de eerste keer te zijn dat je PolarLearn bouwt. Wil je door deze script de .env configureren?" 8 78; then
                DATABASE_URL=$(whiptail --title "PolarLearn" --inputbox "Voer hier in de URL van de database:" 8 78 3>&1 1>&2 2>&3)
                POLARLEARN_URL=$(whiptail --title "PolarLearn" --inputbox "Voer hier in de URL van waar PolarLearn wordt gehost:" 8 78 3>&1 1>&2 2>&3)
                ALLOW_EVERYONE_ON_DEV=$(whiptail --title "PolarLearn" --yesno "Wil je dat iedereen op de development build kan komen zelfs als de gebruiker niet is ingelogd?" 8 78 && echo "true" || echo "false")
                GOOGLE_CLIENT_ID=$(whiptail --title "PolarLearn" --inputbox "Voer hier in de Google OAuth2 Client ID:" 8 78 3>&1 1>&2 2>&3)
                GOOGLE_CLIENT_SECRET=$(whiptail --title "PolarLearn" --inputbox "Voer hier in de Google OAuth2 Client Secret:" 8 78 3>&1 1>&2 2>&3)
                GITHUB_CLIENT_ID=$(whiptail --title "PolarLearn" --inputbox "Voer hier in de GitHub OAuth2 Client ID:" 8 78 3>&1 1>&2 2>&3)
                GITHUB_CLIENT_SECRET=$(whiptail --title "PolarLearn" --inputbox "Voer hier in de GitHub OAuth2 Client Secret:" 8 78 3>&1 1>&2 2>&3)
                configure_env
                pnpm i
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

    required_vars=("DATABASE_URL" "POLARLEARN_URL" "ALLOW_EVERYONE_ON_DEV" "AUTH_GOOGLE_ID" "AUTH_GOOGLE_SECRET" "AUTH_GITHUB_ID" "AUTH_GITHUB_SECRET" "AUTH_SECRET")
    for var in "${required_vars[@]}"; do
        if ! grep -q "$var" .env; then
            echo -e "\033[1;31m########### .env bestand is niet volledig ingevuld ###########"
            exit 1
        fi
    done
}
# Refactor build mode selection and confirmation
select_build_mode() {
    if whiptail --title "PolarLearn" --yesno "Builden voor:" --yes-button "Productie" --no-button "Development" 8 78; then
        BUILD_MODE="prod"
    else
        BUILD_MODE="dev"
    fi

    if [ "$BUILD_MODE" = "prod" ]; then
        echo -e "\033[1m\033[92m#### 🌐 Productie build geselecteerd ####\033[0m"
    else
        echo -e "\033[1m\033[38;5;214m#### 🧑‍💻 Development build geselecteerd ####\033[0m"
    fi

    echo -n "Zijn deze instellingen correct? (y/n): "
    read -r confirm
    if [ "$confirm" != "y" ]; then
        echo -e "\033[1;31m########## Annuleren gedrukt. ##########"
        exit 1
    fi
}

check_whiptail
first_time

if [ "$BUILD_MODE" = "prod" ]; then
    build
    echo -e "\033[1;33m🚀 PolarLearn wordt gestart...\033[0m"
    pnpm start
elif [ "$BUILD_MODE" = "dev" ]; then
    echo -e "\033[1m\033[38;5;214m#### 🧑‍💻 Development build geselecteerd ####\033[0m"
    echo -e "\033[1;33m🚀 Dev server starten...\033[0m"
    pnpm dev
else
    select_build_mode
    if [ "$BUILD_MODE" = "prod" ]; then
        echo -e "\033[1;33m🚀 PolarLearn wordt gestart...\033[0m"
        pnpx prisma generate
        pnpx prisma db push
        pnpm start
    else
        echo -e "\033[1;33m🚀 Dev server starten...\033[0m"
        pnpx prisma generate
        pnpx prisma db push
        pnpm dev
    fi
fi
#!/bin/sh
# Check required environment variables
: "${DATABASE_URL:?Missing DATABASE_URL}"
: "${POLARLEARN_URL:?Missing POLARLEARN_URL}"
: "${ALLOW_EVERYONE_ON_DEV:?Missing ALLOW_EVERYONE_ON_DEV}"
: "${AUTH_GOOGLE_ID:?Missing AUTH_GOOGLE_ID}"
: "${AUTH_GOOGLE_SECRET:?Missing AUTH_GOOGLE_SECRET}"
: "${AUTH_GITHUB_ID:?Missing AUTH_GITHUB_ID}"
: "${AUTH_GITHUB_SECRET:?Missing AUTH_GITHUB_SECRET}"
: "${AUTH_SECRET:?Missing AUTH_SECRET}"
: "${NEXT_PUBLIC_URL:?Missing NEXT_PUBLIC_URL}"

export AUTH_URL="${NEXT_PUBLIC_URL}"

echo "Starting app..."
# Run prisma db push first then start the app
exec sh -c "pnpx prisma db push && pnpm start"
#!/bin/sh
: "${DATABASE_URL:?Missing DATABASE_URL}"
: "${GOOGLE_ID:?Missing GOOGLE_ID}"
: "${GOOGLE_SECRET:?Missing GOOGLE_SECRET}"
: "${GITHUB_ID:?Missing GITHUB_ID}"
: "${GITHUB_SECRET:?Missing GITHUB_SECRET}"
: "${SECRET:?Missing SECRET}"
: "${NEXT_PUBLIC_URL:?Missing NEXT_PUBLIC_URL}"
: "${PEPPER:?Missing PEPPER}"

echo "Starting app..."
# Run prisma db push first then start the app
exec sh -c "pnpx prisma db push && pnpm start"
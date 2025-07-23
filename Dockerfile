# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy only dependency-related files and prisma schema for caching
COPY package.json pnpm-lock.yaml ./
COPY prisma/schema.prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Now copy the rest of the source code
COPY . .

# Build the app
RUN pnpm build

## ---- Production Stage ----
FROM gcr.io/distroless/nodejs22-debian12

WORKDIR /app

# Copy only the built .next folder, package.json, and any other runtime assets needed
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src/hono-server.ts ./src/hono-server.ts
COPY --from=builder /app/src/main.ts ./src/main.ts
# Add any other files needed at runtime here

EXPOSE 3000

CMD ["./node_modules/.bin/tsx", "./src/main.ts"]
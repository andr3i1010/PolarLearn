# ---- Build Stage ----
FROM node:lts AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm typescript

# Copy only dependency-related files and prisma schema for caching
COPY package.json pnpm-lock.yaml ./
COPY prisma/schema.prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Now copy the rest of the source code
COPY . .


# Build the app (Next.js build and others)
RUN pnpm build

# Bundle server files with tsup to rewrite path aliases
RUN pnpm exec tsup src/main.ts src/hono-server.ts --out-dir dist --format cjs

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

# Copy compiled server files
COPY --from=builder /app/dist/hono-server.js ./dist/hono-server.js
COPY --from=builder /app/dist/main.js ./dist/main.js
# Add any other files needed at runtime here

EXPOSE 3000
ENV NODE_ENV=production

CMD ["-r", "tsconfig-paths/register", "dist/main.js"]
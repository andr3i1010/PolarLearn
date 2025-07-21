# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Only copy the lockfile and package.json for caching dependencies
COPY pnpm-lock.yaml package.json  ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Now copy the rest of the source code
COPY . .

# Build the app
RUN pnpm build

# ---- Production Stage ----
FROM gcr.io/distroless/nodejs22-debian12

WORKDIR /app

COPY --from=builder /app .

EXPOSE 3000

CMD ["node", "--import", "tsx", "src/main.ts"]


# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- Production Stage ----
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app
COPY --from=builder /app .

EXPOSE 3000

CMD ["/app/node_modules/.bin/tsx", "src/main.ts"]

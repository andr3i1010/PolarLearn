FROM node:lts-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN yes | pnpm install
COPY . .
COPY public /app/public
RUN pnpx prisma generate
RUN pnpm build

FROM node:lts-alpine
WORKDIR /app
RUN npm install -g pnpm
RUN apk add --no-cache git
COPY package.json pnpm-lock.yaml* ./
RUN yes | pnpm install --prod
COPY .git .git
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next .next
COPY --from=builder /app/public /app/public
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["sh", "/app/entrypoint.sh"]
CMD ["pnpm", "start"]

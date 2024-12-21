FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY package.json package-lock.json ./
COPY .env ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "dist/main.js"]


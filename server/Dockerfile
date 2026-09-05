FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=7860
ENV HOST=0.0.0.0
ENV CACHE_DIR=/tmp/cache

RUN mkdir -p /tmp/cache && chown -R node:node /tmp/cache /app

USER node

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder --chown=node:node /app/dist ./dist

EXPOSE 7860

CMD ["node", "dist/index.js"]

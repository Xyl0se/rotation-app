FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json .
COPY packages/rotation-domain/package.json ./packages/rotation-domain/package.json
COPY server/package.json ./server/package.json
RUN npm ci
COPY packages/rotation-domain ./packages/rotation-domain
COPY server ./server
RUN npm run build:domain && npm --prefix server run build

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/rotation-domain/package.json ./packages/rotation-domain/package.json
COPY server/package.json ./server/package.json
RUN npm ci --omit=dev
COPY --from=builder --chown=1026:100 /app/packages/rotation-domain/dist ./packages/rotation-domain/dist
COPY --from=builder --chown=1026:100 /app/server/dist ./server/dist
RUN mkdir -p /rotation-data/data /rotation-data/exports/current-rotation \
    && chown -R 1026:100 /rotation-data

# Matches the supported Synology volume owner documented for Rotation.
USER 1026:100

EXPOSE 3001
CMD ["node", "server/dist/index.js"]

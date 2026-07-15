FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY --from=builder --chown=1026:100 /app/dist ./dist
COPY --from=builder --chown=1026:100 /app/package*.json .
RUN npm ci --omit=dev
RUN mkdir -p /rotation-data/data /rotation-data/exports/current-rotation \
    && chown -R 1026:100 /rotation-data

# Matches the supported Synology volume owner documented for Rotation.
USER 1026:100

EXPOSE 3001
CMD ["node", "dist/index.js"]

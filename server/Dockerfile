FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine

# Create unprivileged user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S node -u 1001

WORKDIR /app

COPY --from=builder --chown=node:nodejs /app/dist ./dist
COPY --from=builder --chown=node:nodejs /app/package*.json .
RUN npm ci --omit=dev

# Switch to unprivileged user
USER node

EXPOSE 3001
CMD ["node", "dist/index.js"]

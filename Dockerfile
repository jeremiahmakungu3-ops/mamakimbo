# ==============================================================================
# NetPulse ISP & MikroTik Hotspot Manager - Production Dockerfile
# Optimized for Google Cloud Run (Container-based Serverless Deployment)
# ==============================================================================

# --- Stage 1: Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package descriptors first for Docker layer caching
COPY package*.json ./
RUN npm ci

# Copy full application source
COPY . .

# Build frontend production bundle into /dist
RUN npm run build

# Prune devDependencies to keep image lean
RUN npm prune --production

# --- Stage 2: Production Runtime Image ---
FROM node:22-alpine AS runner

WORKDIR /app

# Install curl for container health check probes
RUN apk add --no-cache curl

# Cloud Run defaults: Port 8080 (overrideable via PORT env var)
ENV NODE_ENV=production
ENV PORT=8080

# Create non-root system user for security
USER node

# Copy production artifacts from builder stage
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/server ./server
COPY --chown=node:node --from=builder /app/server.ts ./server.ts
COPY --chown=node:node --from=builder /app/migrations ./migrations
COPY --chown=node:node --from=builder /app/tsconfig.json ./tsconfig.json

# Cloud Run liveness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Expose standard Cloud Run port
EXPOSE 8080

# Production start command using tsx runner
CMD ["npm", "start"]

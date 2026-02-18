# ─── Stage 1: Build ──────────────────────────────────────────
FROM node:20-slim AS build

WORKDIR /app

# Install build tools for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy workspace config and package.json files first (layer caching)
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/client/package.json packages/client/
COPY packages/server/package.json packages/server/

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY packages/client/ packages/client/
COPY packages/server/ packages/server/

# Build all packages (shared → client → server)
RUN npm run build

# ─── Stage 2: Production ────────────────────────────────────
FROM node:20-slim AS production

WORKDIR /app

# better-sqlite3 needs build tools for native module rebuild
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy workspace config + only server/shared package.json (client has no runtime deps)
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/

# Install production dependencies only
RUN npm ci --omit=dev --workspace=packages/server --workspace=packages/shared && \
    rm -rf /root/.npm

# Copy built artifacts from build stage
COPY --from=build /app/packages/shared/dist/ packages/shared/dist/
COPY --from=build /app/packages/server/dist/ packages/server/dist/
COPY --from=build /app/packages/client/dist/ packages/client/dist/

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=8080
ENV DATABASE_PATH=/app/data/wraith.db

# Persist SQLite database across container restarts
VOLUME /app/data

EXPOSE 8080

CMD ["node", "packages/server/dist/index.js"]

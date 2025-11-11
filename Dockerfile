FROM node:22-slim AS base

WORKDIR /app
ENV NODE_ENV=production

# Enable pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install deps first (better caching)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

# Build
COPY . .
RUN pnpm build

# Prune dev deps for smaller runtime
RUN pnpm prune --prod

# Runtime image
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Where SQLite will live by default
ENV DB_PATH=/data/app.db
VOLUME ["/data"]

# Copy built app and prod deps
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e 'fetch(`http://127.0.0.1:${process.env.PORT||3000}/api/ping`).then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))'

CMD ["node", "dist/server/node-build.mjs"]



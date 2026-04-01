# Stage 1: Build
FROM node:22-bookworm AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npx tsc

# Stage 2: Runtime
FROM node:22-bookworm

# Install Chromium dependencies for Remotion
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-noto-color-emoji \
  fonts-noto-cjk \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist

# Copy source for Remotion bundler (needs .tsx entry point at runtime)
COPY src/remotion ./src/remotion
COPY src/config.ts ./src/config.ts

EXPOSE 3000

CMD ["node", "--max-old-space-size=3072", "dist/server.js"]

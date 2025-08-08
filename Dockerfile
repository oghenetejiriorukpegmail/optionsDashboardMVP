# Use the official Node.js runtime as the base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Add necessary packages for SQLite and native dependencies
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create nodejs group and user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data directory with proper permissions
RUN mkdir -p /app/data
RUN chown -R nextjs:nodejs /app/data

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

# Create public directory if it doesn't exist
RUN mkdir -p ./public && chown nextjs:nodejs ./public

# Switch to nextjs user
USER nextjs

# Expose application port (defaults to 4000, can be overridden)
EXPOSE 4000

# Set environment variables
ENV HOSTNAME="0.0.0.0"

# Initialize database and start application
CMD ["sh", "/app/scripts/docker-init.sh"]

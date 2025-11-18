# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Show npm version for debugging
RUN npm --version

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
# Use npm install which respects package-lock.json but is more forgiving than npm ci
RUN if [ -f package-lock.json ]; then \
      echo "📦 Found package-lock.json, installing dependencies..."; \
      npm install --legacy-peer-deps; \
    else \
      echo "⚠️  package-lock.json not found, using npm install..."; \
      npm install --legacy-peer-deps; \
    fi

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables (safe defaults for build process)
ENV DATABASE_URL="file:./prisma/dev.db"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="build-time-secret-minimum-32-characters-long-for-validation"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Generate Prisma Client with error handling
RUN echo "🔧 Generating Prisma Client..." && \
    npx prisma generate || { \
      echo "❌ Prisma generate failed!"; \
      echo "Checking Prisma schema..."; \
      ls -la prisma/ || echo "Prisma directory not found"; \
      cat prisma/schema.prisma 2>/dev/null || echo "Schema file not readable"; \
      exit 1; \
    }

# Build the application with verbose output
RUN echo "🏗️  Starting Next.js build..." && \
    npm run build 2>&1 | tee /tmp/build.log || { \
      echo "❌ Build failed! Showing last 50 lines of output:"; \
      tail -n 50 /tmp/build.log 2>/dev/null || echo "No build log available"; \
      echo "📋 Check the error messages above for details"; \
      exit 1; \
    }

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Copy Prisma binaries (needed for migrations)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]


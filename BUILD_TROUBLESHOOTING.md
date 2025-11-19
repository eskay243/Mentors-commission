# Build Troubleshooting Guide

This guide helps diagnose and fix common build issues with the EdTech Payment Platform.

## Quick Diagnostic Steps

### 1. Verify Build Locally (Recommended First Step)

```bash
# Run the build verification script
./verify-build.sh

# Or manually:
npm ci --legacy-peer-deps
npx prisma generate
npm run build
```

### 2. Test Docker Build Locally

```bash
# Build the Docker image locally
docker build -t mentors-commission-app:latest . 2>&1 | tee build-output.log

# Check for errors in the log
grep -i "error\|failed" build-output.log
```

### 3. Check Docker Compose Build

```bash
# Build using docker-compose
docker-compose build

# Or build and deploy
docker-compose up --build
```

## Common Build Errors and Solutions

### Error: "No such image: mentors-commission-app:latest"

**Cause:** Docker Compose is trying to use an image that doesn't exist.

**Solutions:**
1. Ensure `docker-compose.yml` doesn't have an `image:` line (or remove it)
2. Run `docker-compose build` before `docker-compose up`
3. Use `docker-compose up --build` to build and deploy together

### Error: "Prisma generate failed"

**Cause:** Prisma schema issues or missing dependencies.

**Solutions:**
1. Verify `prisma/schema.prisma` exists and is valid:
   ```bash
   npx prisma validate
   ```

2. Ensure Prisma is installed:
   ```bash
   npm install prisma @prisma/client
   ```

3. Generate Prisma Client manually:
   ```bash
   npx prisma generate
   ```

### Error: "DATABASE_URL is required"

**Cause:** Missing or invalid DATABASE_URL environment variable.

**Solutions:**
1. Create `.env` file with:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   ```

2. For production, use:
   ```env
   DATABASE_URL="file:./prisma/prod.db"
   ```

3. The Dockerfile sets build-time defaults, but ensure runtime `.env` file exists.

### Error: "NEXTAUTH_SECRET must be at least 32 characters"

**Cause:** NEXTAUTH_SECRET is missing or too short.

**Solutions:**
1. Generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```

2. Add to `.env` file:
   ```env
   NEXTAUTH_SECRET="your-generated-secret-here-minimum-32-characters"
   ```

3. The Dockerfile uses a build-time default, but production needs a real secret.

### Error: TypeScript compilation errors

**Cause:** Type errors in the codebase.

**Solutions:**
1. Check TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```

2. Fix any type errors reported
3. Ensure all imports are correct
4. Check that test files are excluded (see `tsconfig.json`)

### Error: Missing dependencies

**Cause:** `node_modules` not installed or out of sync.

**Solutions:**
1. Clean install:
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

2. Or use npm ci:
   ```bash
   npm ci --legacy-peer-deps
   ```

### Error: "wget: not found" (Healthcheck)

**Cause:** wget not installed in the Docker image.

**Solution:** Already fixed in Dockerfile (line 64), but if you see this:
- Ensure Dockerfile includes: `RUN apk add --no-cache wget`

### Error: Out of memory during build

**Cause:** Node.js running out of memory during build.

**Solution:** Already addressed in Dockerfile with:
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

If still failing, increase to 8192:
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=8192"
```

## Environment Variables Checklist

Ensure your `.env` file (or Hostinger environment variables) includes:

### Required:
- ✅ `DATABASE_URL` - Database connection string
- ✅ `NEXTAUTH_URL` - Your application URL
- ✅ `NEXTAUTH_SECRET` - At least 32 characters, use `openssl rand -base64 32`

### Optional (but recommended):
- `STRIPE_PUBLISHABLE_KEY` - For payment processing
- `STRIPE_SECRET_KEY` - For payment processing
- `STRIPE_WEBHOOK_SECRET` - For Stripe webhooks
- `RESEND_API_KEY` - For email notifications (or use SMTP)
- `EMAIL_SERVER_HOST` - For SMTP email
- `EMAIL_SERVER_PORT` - For SMTP email
- `EMAIL_SERVER_USER` - For SMTP email
- `EMAIL_SERVER_PASSWORD` - For SMTP email
- `EMAIL_FROM` - Sender email address

## Build Process Flow

1. **Dependencies Stage:**
   - Install npm dependencies
   - Uses `npm install --legacy-peer-deps`

2. **Builder Stage:**
   - Copy dependencies and source code
   - Set build-time environment variables
   - Initialize Prisma directory
   - Generate Prisma Client
   - Build Next.js application

3. **Runner Stage:**
   - Copy built application
   - Install wget for healthcheck
   - Set up non-root user
   - Configure runtime environment

## Getting Detailed Build Logs

### From Docker Build:
```bash
docker build -t mentors-commission-app:latest . 2>&1 | tee build-output.log
```

### From Docker Compose:
```bash
docker-compose build 2>&1 | tee build-output.log
```

### From npm:
```bash
npm run build 2>&1 | tee build-output.log
```

Then check the log file for specific errors:
```bash
grep -i "error\|failed" build-output.log
```

## Still Having Issues?

1. **Check the build logs** - Look for the specific error message
2. **Run verify-build.sh** - This script checks common issues
3. **Test locally first** - Build on your machine before deploying
4. **Check Hostinger logs** - Review the full build output in Hostinger Docker Manager

## Quick Reference Commands

```bash
# Verify build locally
./verify-build.sh

# Build Docker image
docker build -t mentors-commission-app:latest .

# Build with docker-compose
docker-compose build

# Build and deploy
docker-compose up --build

# Check Prisma
npx prisma validate
npx prisma generate

# Check TypeScript
npx tsc --noEmit

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```


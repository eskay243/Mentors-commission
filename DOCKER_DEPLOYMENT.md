# Docker Deployment Guide for Coolify

This guide covers deploying the EdTech Payment Platform using Docker on Hostinger VPS with Coolify.

## Why Docker?

- ✅ **Consistency**: Same environment across development and production
- ✅ **Isolation**: Dependencies and system libraries are contained
- ✅ **Easy Management**: Coolify handles Docker deployments excellently
- ✅ **Production Ready**: Better control and scalability
- ✅ **Volume Management**: Easier database file persistence

## Prerequisites

- Hostinger VPS with Coolify installed
- GitHub repository with code
- Domain name (optional but recommended)

## Quick Start

### 1. Prepare Your Repository

Ensure these files are in your repository:
- `Dockerfile` ✅ (multi-stage build with standalone output - recommended)
- `Dockerfile.simple` ✅ (alternative simpler version if needed)
- `.dockerignore` ✅ (already created)
- `next.config.js` with `output: 'standalone'` ✅ (already updated)

**Note**: If you encounter issues with the standalone build, you can:
1. Use `Dockerfile.simple` instead (rename it to `Dockerfile`)
2. Or remove `output: 'standalone'` from `next.config.js` and use `Dockerfile.simple`

### 2. Push to GitHub

```bash
git add Dockerfile .dockerignore docker-compose.yml next.config.js
git commit -m "Add Docker support for Coolify deployment"
git push origin main
```

### 3. Deploy in Coolify

#### Step 1: Create New Application
1. Open Coolify Dashboard
2. Click "New Resource" → "Application"
3. Select "GitHub" or "Git" as source
4. Choose your repository: `codelabpayments`
5. Select branch: `main`

#### Step 2: Configure Build
- **Build Pack**: Select "Dockerfile" (Coolify will auto-detect)
- **Port**: `3000`
- **Dockerfile Path**: Leave as `Dockerfile` (or use `Dockerfile.simple` if you prefer)
- Coolify will automatically:
  - Detect the Dockerfile
  - Build the Docker image
  - Run the container

**Dockerfile Options:**
- `Dockerfile` - Multi-stage build with standalone output (smaller, faster)
- `Dockerfile.simple` - Simpler single-stage build (easier to debug)

#### Step 3: Set Environment Variables

In Coolify → Your App → Environment Variables, add:

**Required:**
```env
DATABASE_URL="file:./prisma/prod.db"
# OR for PostgreSQL:
# DATABASE_URL="postgresql://user:password@host:5432/dbname"

NEXTAUTH_URL="https://your-domain.com"
# If no domain: http://your-vps-ip:3000

NEXTAUTH_SECRET="generate-a-random-32-character-secret"
# Generate with: openssl rand -base64 32

NODE_ENV="production"
```

**Optional:**
```env
# Stripe
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (choose one)
RESEND_API_KEY="re_..."
# OR
SENDGRID_API_KEY="SG..."
# OR
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@example.com"
EMAIL_SERVER_PASSWORD="your-password"
EMAIL_FROM="noreply@your-domain.com"
```

#### Step 4: Configure Volumes (for SQLite)

If using SQLite, you need to persist the database:

1. Go to Coolify → Your App → Volumes
2. Add volume:
   - **Host Path**: `/data/coolify/apps/edtech-payment-platform/prisma`
   - **Container Path**: `/app/prisma`
   - **Type**: Directory

This ensures your database persists across container restarts.

#### Step 5: Deploy

1. Click "Deploy" in Coolify
2. Monitor the build logs
3. Wait for "Deployment successful"

#### Step 6: Run Database Migrations

After first deployment:

1. Go to Coolify → Your App → Terminal
2. Run:
   ```bash
   npx prisma migrate deploy
   ```

Or use "One-time Commands" in Coolify:
```bash
npx prisma migrate deploy
```

### 4. Post-Deployment

#### Verify Health Check
```bash
curl https://your-domain.com/api/health
# Should return: {"status":"healthy",...}
```

#### Test Application
- Visit your application URL
- Try logging in
- Verify database operations work

## Local Testing with Docker

Before deploying, test locally:

```bash
# Build and run
docker-compose up --build

# Or using Docker directly
docker build -t edtech-payment-platform .
docker run -p 3000:3000 \
  -e DATABASE_URL="file:./prisma/dev.db" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="test-secret-key" \
  -v $(pwd)/prisma:/app/prisma \
  edtech-payment-platform
```

## Database Options

### Option 1: SQLite (Simple)
- **Pros**: Easy setup, no separate service
- **Cons**: Not ideal for high traffic
- **Setup**: Just mount `/app/prisma` as volume

### Option 2: PostgreSQL (Recommended for Production)
1. In Coolify, create a PostgreSQL service
2. Note the connection string
3. Set `DATABASE_URL` to PostgreSQL connection string
4. Format: `postgresql://user:password@postgres-container:5432/dbname`

## Domain & SSL Setup

1. **Point Domain to VPS**
   - Add A record: `@` → your VPS IP
   - Add A record: `www` → your VPS IP

2. **Configure SSL in Coolify**
   - Go to your application → Domains
   - Add your domain
   - Enable "Let's Encrypt SSL"
   - Coolify will automatically configure SSL

3. **Update NEXTAUTH_URL**
   - Change to: `https://your-domain.com`
   - Redeploy if needed

## Stripe Webhook Configuration

1. **Get Webhook URL**
   - Your webhook URL: `https://your-domain.com/api/payments/webhook`

2. **In Stripe Dashboard**
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/payments/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook secret
   - Add to Coolify env: `STRIPE_WEBHOOK_SECRET`

## Troubleshooting

### Build Fails
- Check Dockerfile syntax
- Verify all files are in repository
- Check build logs in Coolify

### Container Won't Start
- Check environment variables
- Verify DATABASE_URL is correct
- Review container logs in Coolify

### Database Issues
- Ensure volume is mounted (for SQLite)
- Verify DATABASE_URL format
- Check database permissions

### Application Errors
- Check application logs in Coolify
- Verify all environment variables are set
- Test health endpoint: `/api/health`

## Docker Commands Reference

```bash
# Build image
docker build -t edtech-payment-platform .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="file:./prisma/dev.db" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret" \
  -v $(pwd)/prisma:/app/prisma \
  edtech-payment-platform

# View logs
docker logs <container-id>

# Execute commands in container
docker exec -it <container-id> /bin/sh

# Run migrations in container
docker exec -it <container-id> npx prisma migrate deploy
```

## Production Checklist

- [ ] Dockerfile and .dockerignore in repository
- [ ] next.config.js has `output: 'standalone'`
- [ ] All environment variables configured in Coolify
- [ ] Database volume mounted (if using SQLite)
- [ ] Database migrations applied
- [ ] Health check endpoint working
- [ ] SSL certificate installed (if using domain)
- [ ] Stripe webhook configured (if using Stripe)
- [ ] Email service configured (if using emails)
- [ ] Application accessible and functional
- [ ] Logs are being monitored

## Advantages of Docker Deployment

1. **Isolation**: Your app runs in its own container
2. **Consistency**: Same environment everywhere
3. **Easy Scaling**: Can run multiple containers
4. **Volume Management**: Easy database persistence
5. **Coolify Integration**: Excellent Docker support
6. **Rollback**: Easy to rollback to previous image
7. **Resource Control**: Set CPU/memory limits

## Next Steps

1. **Monitor**: Set up monitoring for your application
2. **Backup**: Configure automated database backups
3. **CI/CD**: Set up CircleCI for automated deployments
4. **Scaling**: Consider PostgreSQL for better performance
5. **Caching**: Add Redis if needed for caching

## Support

For issues:
1. Check Coolify application logs
2. Review Docker build logs
3. Test health endpoint
4. Verify environment variables
5. Check database connectivity


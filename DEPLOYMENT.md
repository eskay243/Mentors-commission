# Deployment Guide

This guide covers deploying the EdTech Payment Platform to a Hostinger VPS with Coolify and CircleCI.

## Prerequisites

- Hostinger VPS with Coolify installed
- CircleCI account
- GitHub repository
- Domain name (optional but recommended)

## Setup Instructions

### 1. Coolify Setup on Hostinger VPS

1. **Access Coolify Dashboard**
   - Navigate to your Coolify instance
   - Create a new application

2. **Configure Application**
   - **Name**: `edtech-payment-platform`
   - **Source**: Connect to your GitHub repository
   - **Build Pack**: Node.js
   - **Port**: 3000

3. **Environment Variables**
   Set the following in Coolify:
   ```
   DATABASE_URL=your_database_url
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=your-secret-key-32-chars-minimum
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   EMAIL_SERVER_HOST=your_email_host
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=your_email_user
   EMAIL_SERVER_PASSWORD=your_email_password
   EMAIL_FROM=noreply@your-domain.com
   ```

4. **Database Setup**
   - If using SQLite: Ensure the database file is persisted in a volume
   - If using PostgreSQL/MySQL: Configure connection string in DATABASE_URL

5. **Run Database Migrations**
   - In Coolify, add a one-time command:
   ```bash
   npm run db:migrate:deploy
   ```

### 2. CircleCI Setup

1. **Connect Repository**
   - Go to CircleCI dashboard
   - Add your GitHub repository
   - Follow the setup wizard

2. **Configure Environment Variables**
   In CircleCI project settings, add:
   ```
   COOLIFY_WEBHOOK_URL=your_coolify_webhook_url
   ```

3. **Webhook Configuration**
   - In Coolify, go to your application settings
   - Find the webhook URL for deployments
   - Add it to CircleCI environment variables

### 3. Deployment Workflow

The CircleCI workflow will:
1. **Build**: Install dependencies, lint, generate Prisma client, build
2. **Test**: Run test suite (if configured)
3. **Deploy**: Trigger Coolify webhook to deploy

### 4. Manual Deployment

If you need to deploy manually:

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Navigate to Coolify directory or use Coolify CLI
coolify deploy
```

### 5. Post-Deployment

1. **Verify Health Check**
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **Run Migrations**
   ```bash
   npm run db:migrate:deploy
   ```

3. **Seed Database** (if needed)
   ```bash
   npm run db:seed
   ```

### 6. SSL/HTTPS Setup

Coolify typically handles SSL automatically via Let's Encrypt. Ensure:
- Your domain points to the VPS IP
- Port 80 and 443 are open in firewall
- Coolify SSL settings are configured

### 7. Monitoring

- **Health Check**: `/api/health` endpoint
- **Logs**: View in Coolify dashboard
- **Database**: Use Prisma Studio or database client

## Troubleshooting

### Build Fails
- Check Node.js version (requires 18+)
- Verify all environment variables are set
- Check build logs in CircleCI

### Deployment Fails
- Verify Coolify webhook URL is correct
- Check Coolify application logs
- Ensure database is accessible

### Database Issues
- Verify DATABASE_URL is correct
- Run migrations: `npm run db:migrate:deploy`
- Check database permissions

### Application Not Starting
- Check environment variables
- Verify port 3000 is accessible
- Review application logs in Coolify

## Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate installed
- [ ] Health check endpoint working
- [ ] Stripe webhook configured
- [ ] Email service configured
- [ ] Backup strategy in place
- [ ] Monitoring set up
- [ ] Error tracking configured (optional)

## Backup Strategy

1. **Database Backups**
   - Set up automated database backups
   - Store backups in secure location
   - Test restore procedures

2. **Application Backups**
   - Coolify may handle this automatically
   - Consider version control for configuration

## Scaling

For production scaling:
- Use PostgreSQL instead of SQLite
- Set up Redis for caching (optional)
- Configure load balancing if needed
- Monitor resource usage

## Support

For issues:
1. Check application logs in Coolify
2. Review CircleCI build logs
3. Check health endpoint
4. Review error logs


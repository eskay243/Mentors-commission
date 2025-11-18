# Hostinger VPS Deployment Guide

This guide covers deploying the EdTech Payment Platform directly on a Hostinger VPS using Docker Manager.

## Prerequisites

- Hostinger VPS with root/SSH access
- Domain name (optional but recommended)
- GitHub repository with your code
- Basic knowledge of Linux commands

## Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
# or
ssh your-username@your-vps-ip
```

## Step 2: Install Docker

If Docker is not already installed:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose (optional)
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version

# Add your user to docker group (if not root)
usermod -aG docker $USER
```

## Step 3: Clone Your Repository

```bash
# Navigate to a directory for your apps
cd /opt  # or /var/www or wherever you prefer
mkdir -p apps
cd apps

# Clone your repository
git clone https://github.com/eskay243/Mentors-commission.git
cd Mentors-commission
```

## Step 4: Create Environment File

```bash
# Create .env file
nano .env
```

Add your environment variables:

```env
DATABASE_URL="file:./prisma/prod.db"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key-minimum-32-characters-long"
NODE_ENV=production

# Stripe (if using)
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (optional - choose one)
# Option 1: Resend (recommended)
RESEND_API_KEY="re_..."

# Option 2: SendGrid
SENDGRID_API_KEY="SG..."

# Option 3: SMTP
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@example.com"
EMAIL_SERVER_PASSWORD="your-password"
EMAIL_FROM="noreply@your-domain.com"
```

Save and exit (Ctrl+X, then Y, then Enter)

## Step 5: Build the Docker Image

```bash
# Build the image
docker build -t edtech-payment-platform:latest .

# This will take a few minutes. Watch for any errors.
```

## Step 6: Run Database Migrations

```bash
# Run migrations inside a temporary container
docker run --rm \
  -v $(pwd)/prisma:/app/prisma \
  --env-file .env \
  edtech-payment-platform:latest \
  npx prisma migrate deploy
```

**Note:** If using SQLite, ensure the `prisma` directory has write permissions:
```bash
chmod -R 755 prisma
```

## Step 7: Run the Container

```bash
# Run the container
docker run -d \
  --name edtech-app \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/prisma:/app/prisma \
  --restart unless-stopped \
  edtech-payment-platform:latest
```

## Step 8: Verify Deployment

```bash
# Check container status
docker ps

# Check logs
docker logs edtech-app

# Follow logs in real-time
docker logs -f edtech-app

# Test the health endpoint
curl http://localhost:3000/api/health
```

## Step 9: Set Up Reverse Proxy (Nginx)

### Install Nginx

```bash
apt install nginx -y
```

### Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/edtech-app
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Increase body size limit for file uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Enable the Site

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/edtech-app /etc/nginx/sites-enabled/

# Remove default site (optional)
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

## Step 10: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot will automatically update your Nginx config
# Follow the prompts to complete setup
```

### Auto-renewal

Certbot sets up auto-renewal automatically. Test it:

```bash
certbot renew --dry-run
```

## Step 11: Firewall Configuration

```bash
# Install UFW (if not installed)
apt install ufw -y

# Allow SSH
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

## Useful Docker Commands

### Container Management

```bash
# View logs
docker logs -f edtech-app

# Stop container
docker stop edtech-app

# Start container
docker start edtech-app

# Restart container
docker restart edtech-app

# Remove container
docker rm edtech-app

# View container stats
docker stats edtech-app
```

### Rebuilding After Code Changes

```bash
# Stop and remove old container
docker stop edtech-app
docker rm edtech-app

# Navigate to project directory
cd /opt/apps/Mentors-commission

# Pull latest code
git pull

# Rebuild image
docker build -t edtech-payment-platform:latest .

# Run migrations (if needed)
docker run --rm \
  -v $(pwd)/prisma:/app/prisma \
  --env-file .env \
  edtech-payment-platform:latest \
  npx prisma migrate deploy

# Start new container
docker run -d \
  --name edtech-app \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/prisma:/app/prisma \
  --restart unless-stopped \
  edtech-payment-platform:latest
```

Or use the provided deployment script (see below).

## Deployment Script

A deployment script is provided at `deploy.sh` for easier redeployment. See the script for usage instructions.

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs edtech-app

# Check if port is already in use
netstat -tulpn | grep 3000

# Check container status
docker ps -a
```

### Database Issues

```bash
# Check database file permissions
ls -la prisma/

# Run migrations manually
docker run --rm \
  -v $(pwd)/prisma:/app/prisma \
  --env-file .env \
  edtech-payment-platform:latest \
  npx prisma migrate deploy

# Check database status
docker run --rm \
  -v $(pwd)/prisma:/app/prisma \
  --env-file .env \
  edtech-payment-platform:latest \
  npx prisma migrate status
```

### Build Failures

```bash
# Check if package-lock.json exists
ls -la package-lock.json

# If missing, generate it locally and commit
npm install
git add package-lock.json
git commit -m "Add package-lock.json"
git push

# Check Docker build logs
docker build -t edtech-payment-platform:latest . 2>&1 | tee build.log
```

### Nginx Issues

```bash
# Test Nginx configuration
nginx -t

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Check Nginx access logs
tail -f /var/log/nginx/access.log

# Restart Nginx
systemctl restart nginx
```

### Permission Issues

```bash
# Fix Prisma directory permissions
chmod -R 755 prisma
chown -R $USER:$USER prisma

# Fix Docker socket permissions (if needed)
sudo chmod 666 /var/run/docker.sock
```

## Monitoring

### Set Up Log Rotation

Create a log rotation config for Docker:

```bash
nano /etc/logrotate.d/docker-containers
```

Add:

```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
```

### Health Checks

The application includes a health check endpoint at `/api/health`. You can set up monitoring:

```bash
# Simple health check script
nano /usr/local/bin/health-check.sh
```

Add:

```bash
#!/bin/bash
curl -f http://localhost:3000/api/health || docker restart edtech-app
```

Make executable:

```bash
chmod +x /usr/local/bin/health-check.sh
```

Add to crontab (check every 5 minutes):

```bash
crontab -e
```

Add:

```
*/5 * * * * /usr/local/bin/health-check.sh
```

## Backup Strategy

### Database Backup

For SQLite:

```bash
# Create backup script
nano /usr/local/bin/backup-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /opt/apps/Mentors-commission/prisma/prod.db $BACKUP_DIR/prod_$DATE.db
# Keep only last 7 days
find $BACKUP_DIR -name "prod_*.db" -mtime +7 -delete
```

Make executable:

```bash
chmod +x /usr/local/bin/backup-db.sh
```

Add to crontab (daily backup at 2 AM):

```bash
crontab -e
```

Add:

```
0 2 * * * /usr/local/bin/backup-db.sh
```

## Security Best Practices

1. **Keep system updated:**
   ```bash
   apt update && apt upgrade -y
   ```

2. **Use strong passwords and SSH keys:**
   - Disable password authentication for SSH
   - Use SSH keys only

3. **Regular backups:**
   - Set up automated database backups
   - Test restore procedures

4. **Monitor logs:**
   - Regularly check application logs
   - Set up log rotation

5. **Keep Docker updated:**
   ```bash
   apt update && apt install docker-ce docker-ce-cli containerd.io -y
   ```

## Next Steps

- Set up CI/CD with CircleCI (see `.circleci/config.yml`)
- Configure monitoring and alerting
- Set up automated backups
- Configure email notifications for errors
- Set up staging environment

## Support

For issues or questions:
- Check application logs: `docker logs edtech-app`
- Check Nginx logs: `/var/log/nginx/error.log`
- Review this guide's troubleshooting section
- Check GitHub issues


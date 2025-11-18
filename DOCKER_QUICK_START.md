# Quick Start: Docker Deployment on Hostinger VPS

## 🚀 5-Minute Deployment Guide

### Prerequisites
- Hostinger VPS with SSH access
- Docker installed on VPS
- Domain name (optional)

### Step 1: Connect to Your VPS
```bash
ssh root@your-vps-ip
```

### Step 2: Install Docker (if not installed)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### Step 3: Clone Repository
```bash
cd /opt
mkdir -p apps && cd apps
git clone https://github.com/eskay243/Mentors-commission.git
cd Mentors-commission
```

### Step 4: Create Environment File
```bash
nano .env
```

Add minimum required variables:
```env
DATABASE_URL="file:./prisma/prod.db"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-32-char-secret-here"
NODE_ENV="production"
```

Save: `Ctrl+X`, then `Y`, then `Enter`

### Step 5: Build and Deploy
```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The script will:
- ✅ Build Docker image
- ✅ Run database migrations
- ✅ Start container
- ✅ Perform health check

### Step 6: Set Up Nginx (Optional but Recommended)

```bash
# Install Nginx
apt install nginx -y

# Create config
nano /etc/nginx/sites-available/edtech-app
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable:
```bash
ln -s /etc/nginx/sites-available/edtech-app /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Step 7: SSL Certificate (Optional)
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d your-domain.com
```

### ✅ Done!
Your app is now running at `http://your-vps-ip:3000` or `https://your-domain.com`

## Quick Commands

```bash
# View logs
docker logs -f edtech-app

# Restart
docker restart edtech-app

# Redeploy (after code changes)
cd /opt/apps/Mentors-commission
./deploy.sh
```

## Troubleshooting

**Build fails?**
- Check if `package-lock.json` exists: `ls -la package-lock.json`
- If missing, run: `npm install` locally and commit it
- Check build logs: `docker build -t edtech-payment-platform:latest . 2>&1 | tee build.log`

**Container won't start?**
- Check logs: `docker logs edtech-app`
- Verify `.env` file exists and has correct values
- Check port 3000 is available: `netstat -tulpn | grep 3000`

**Database issues?**
- Run migrations: `docker run --rm -v $(pwd)/prisma:/app/prisma --env-file .env edtech-payment-platform:latest npx prisma migrate deploy`
- Check permissions: `chmod -R 755 prisma`

## Need More Details?
See `HOSTINGER_VPS_DEPLOYMENT.md` for comprehensive guide.

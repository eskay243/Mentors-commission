# Production Server Update Guide

This guide will help you pull the latest changes from GitHub and deploy them to your Hostinger production server.

## Quick Steps Summary

1. **SSH into your Hostinger VPS**
2. **Navigate to your project directory**
3. **Pull latest code from GitHub**
4. **Run the deployment script** (or manually rebuild Docker)

---

## Detailed Instructions

### Step 1: Connect to Your Production Server

Open your terminal and SSH into your Hostinger VPS:

```bash
ssh root@your-vps-ip
# OR if you use a different user:
ssh your-username@your-vps-ip
```

**Note:** Replace `your-vps-ip` with your actual VPS IP address or hostname.

---

### Step 2: Navigate to Your Project Directory

Based on your deployment documentation, your project should be located at:

```bash
cd /opt/apps/Mentors-commission
```

**If your project is in a different location**, find it first:

```bash
# Find your project directory
find / -name "Mentors-commission" -type d 2>/dev/null
# OR
find / -name "deploy.sh" -type f 2>/dev/null
```

---

### Step 3: Verify You're on the Right Branch

Check which branch you're on and ensure it matches your GitHub repository:

```bash
git branch
# Should show: * main (or master)

# If you need to switch branches:
git checkout main
```

---

### Step 4: Pull Latest Changes from GitHub

Pull the latest code from your GitHub repository:

```bash
git pull origin main
# OR if your default branch is master:
git pull origin master
```

**Expected output:**
```
Updating abc1234..def5678
Fast-forward
 ... files changed ...
```

**If you see merge conflicts:**
```bash
# Check what files have conflicts
git status

# If you need to reset and pull fresh (WARNING: This discards local changes)
git fetch origin
git reset --hard origin/main
```

---

### Step 5: Verify Changes Were Pulled

Check that your recent changes are present:

```bash
# See recent commits
git log --oneline -5

# Check if specific files were updated
git diff HEAD~1 HEAD --name-only
```

---

### Step 6: Deploy the Updates

You have **two options** for deploying:

#### Option A: Use the Deployment Script (Recommended)

The deployment script automates everything:

```bash
# Make sure the script is executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

The script will:
- ✅ Stop the existing container
- ✅ Pull latest code (already done, but safe to run)
- ✅ Build a new Docker image with your changes
- ✅ Run database migrations
- ✅ Start a new container
- ✅ Perform health checks

#### Option B: Manual Deployment

If you prefer to do it manually or the script doesn't work:

```bash
# 1. Stop and remove existing container
docker stop edtech-app
docker rm edtech-app

# 2. Build new Docker image
docker build -t edtech-payment-platform:latest .

# 3. Run database migrations (if needed)
docker run --rm \
  -v $(pwd)/prisma:/app/prisma \
  --env-file .env \
  edtech-payment-platform:latest \
  npx prisma migrate deploy

# 4. Start new container
docker run -d \
  --name edtech-app \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/prisma:/app/prisma \
  --restart unless-stopped \
  edtech-payment-platform:latest
```

---

### Step 7: Verify Deployment

Check that everything is working:

```bash
# 1. Check container is running
docker ps

# You should see "edtech-app" in the list with status "Up"

# 2. Check container logs
docker logs edtech-app

# Look for any errors. You should see Next.js startup messages.

# 3. Test health endpoint
curl http://localhost:3000/api/health

# Should return: {"status":"ok"} or similar

# 4. Check if your changes are visible
# Visit your production URL in a browser
```

---

### Step 8: Clear Browser Cache (Important!)

After deployment, you may need to clear your browser cache to see changes:

- **Chrome/Edge**: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Firefox**: Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- **Safari**: Press `Cmd+Option+R`

Or use **Incognito/Private mode** to test without cache.

---

## Troubleshooting

### Problem: Git Pull Fails with "Permission Denied"

**Solution:**
```bash
# Check git remote URL
git remote -v

# If using HTTPS, you may need to enter credentials
# Consider switching to SSH:
git remote set-url origin git@github.com:your-username/your-repo.git

# Or use a personal access token for HTTPS
```

---

### Problem: Docker Build Fails

**Solution:**
```bash
# Check build logs for specific errors
docker build -t edtech-payment-platform:latest . 2>&1 | tee build.log

# Common issues:
# - Missing .env file: Make sure .env exists in project root
# - Network issues: Check internet connection
# - Out of disk space: Check with `df -h`
```

---

### Problem: Container Won't Start

**Solution:**
```bash
# Check logs for errors
docker logs edtech-app

# Check if port 3000 is already in use
netstat -tulpn | grep 3000

# Check container status
docker ps -a

# Try starting manually to see errors
docker run --rm \
  --name edtech-app-test \
  -p 3000:3000 \
  --env-file .env \
  edtech-payment-platform:latest
```

---

### Problem: Changes Not Showing After Deployment

**Possible causes and solutions:**

1. **Browser cache** - Clear cache (see Step 8 above)

2. **Container not restarted** - Verify container was rebuilt:
   ```bash
   # Check when container was created
   docker inspect edtech-app | grep Created
   
   # If it's old, rebuild and restart
   ./deploy.sh
   ```

3. **Wrong branch deployed** - Verify you pulled from the correct branch:
   ```bash
   git branch
   git log -1
   ```

4. **Build cache issues** - Force a clean rebuild:
   ```bash
   docker build --no-cache -t edtech-payment-platform:latest .
   ```

5. **Nginx cache** - If using Nginx, clear its cache:
   ```bash
   sudo systemctl reload nginx
   ```

---

### Problem: "Cannot connect to Docker daemon"

**Solution:**
```bash
# Check if Docker is running
sudo systemctl status docker

# Start Docker if not running
sudo systemctl start docker

# If permission denied, add user to docker group:
sudo usermod -aG docker $USER
# Then log out and back in
```

---

## Quick Reference Commands

```bash
# Full deployment in one go
cd /opt/apps/Mentors-commission && git pull && ./deploy.sh

# Check if updates are needed
cd /opt/apps/Mentors-commission && git fetch && git log HEAD..origin/main

# View container logs in real-time
docker logs -f edtech-app

# Restart container without rebuilding
docker restart edtech-app

# Check container resource usage
docker stats edtech-app

# Access container shell (for debugging)
docker exec -it edtech-app sh
```

---

## Automated Deployment (Future Enhancement)

To avoid manual deployment, consider setting up:

1. **GitHub Actions** - Automatically deploy on push
2. **Webhook** - Trigger deployment from GitHub
3. **Cron job** - Periodically pull and deploy (not recommended for production)

---

## Important Notes

⚠️ **Before deploying:**
- Make sure your changes are committed and pushed to GitHub
- Test changes locally first
- Backup your database if making schema changes

⚠️ **During deployment:**
- The site will be briefly unavailable during container restart
- Database migrations run automatically (safe if using Prisma)

⚠️ **After deployment:**
- Always verify the health endpoint
- Check application logs for errors
- Test critical functionality

---

## Need Help?

If you're still having issues:

1. **Check the logs:**
   ```bash
   docker logs edtech-app --tail 100
   ```

2. **Verify environment variables:**
   ```bash
   cat .env
   ```

3. **Check disk space:**
   ```bash
   df -h
   ```

4. **Check Docker system:**
   ```bash
   docker system df
   docker system prune  # Clean up if needed (be careful!)
   ```

---

## Summary Checklist

- [ ] SSH into production server
- [ ] Navigate to project directory (`/opt/apps/Mentors-commission`)
- [ ] Pull latest code (`git pull origin main`)
- [ ] Verify changes were pulled (`git log`)
- [ ] Run deployment script (`./deploy.sh`)
- [ ] Verify container is running (`docker ps`)
- [ ] Check logs for errors (`docker logs edtech-app`)
- [ ] Test health endpoint (`curl http://localhost:3000/api/health`)
- [ ] Visit production URL and clear browser cache
- [ ] Verify changes are visible

---

**Last Updated:** Based on your current deployment setup with Docker on Hostinger VPS


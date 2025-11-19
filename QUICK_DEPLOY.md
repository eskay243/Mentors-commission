# Quick Deploy Reference

## One-Command Deployment

After pushing to GitHub, run this on your production server:

```bash
cd /opt/apps/Mentors-commission && git pull origin main && chmod +x deploy.sh && ./deploy.sh
```

---

## Step-by-Step (If One-Command Fails)

```bash
# 1. Connect to server
ssh root@your-vps-ip

# 2. Go to project
cd /opt/apps/Mentors-commission

# 3. Pull code
git pull origin main

# 4. Deploy
chmod +x deploy.sh
./deploy.sh
```

---

## Verify It Worked

```bash
# Check container
docker ps | grep edtech-app

# Check logs
docker logs edtech-app --tail 20

# Test health
curl http://localhost:3000/api/health
```

---

## Common Issues

**Changes not showing?**
- Clear browser cache: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- Check container was rebuilt: `docker inspect edtech-app | grep Created`

**Git pull fails?**
- Check you're on the right branch: `git branch`
- Check remote: `git remote -v`

**Container won't start?**
- Check logs: `docker logs edtech-app`
- Check port: `netstat -tulpn | grep 3000`

---

For detailed instructions, see `PRODUCTION_UPDATE_GUIDE.md`


# 🚨 Manual Update & Verification Guide

If the site is still not working, follow these steps to verify the code on your server.

## 1. SSH into your VPS
```bash
ssh root@YOUR_IP
cd /var/www/billing_sys_rkct
```

## 2. Verify the Code
Run this command to check if the fix is present on the server:
```bash
grep "rate as unit_price" src/backend/app/app.js
```
- **If it produces OUTPUT** (shows the line of code): The code is updated. Proceed to step 3.
- **If NO OUTPUT**: The code is OLD. Run these commands:
  ```bash
  git reset --hard origin/main
  git pull origin main
  ```

## 3. Force Rebuild & Restart
If the code is correct but it still fails, the running container is old.
```bash
docker compose down
docker compose up -d --build --force-recreate
```

## 4. Check Logs (If still failing)
If it still fails, check the real error message:
```bash
docker compose logs -f backend --tail=50
```
(Press Ctrl+C to exit logs)

## 🕒 Wait for Startup
After restarting, wait 30 seconds before testing the site.

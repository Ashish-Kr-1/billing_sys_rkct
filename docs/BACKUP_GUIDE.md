# 🕒 Automated Database Backup - Setup Guide

## Overview
Automated daily database backups with 30-day retention using cron jobs.

---

## 📋 Prerequisites
- SSH access to your server
- MySQL client installed
- Cron daemon running

---

## ⚙️ Setup Instructions

### Step 1: Make Backup Script Executable

```bash
cd /Users/ayushk/Desktop/billing_sys_rkct/database
chmod +x backup_db.sh
chmod +x restore_db.sh
```

### Step 2: Test Manual Backup

```bash
cd /Users/ayushk/Desktop/billing_sys_rkct/database
./backup_db.sh
```

Expected output:
```
🗄️  Starting database backup...
Backup directory: ./backups
Database: billing_system
Host: srv687.hstgr.io
----------------------------------------
✅ Database dump created successfully
✅ Backup compressed: billing_system_backup_20260204_163000.sql.gz
Backup size: 2.3M
✅ Old backups (>30 days) removed
Total backups: 1
========================================
✅ Backup completed successfully!
========================================
```

### Step 3: Set Up Cron Job

#### For Local Development (macOS/Linux):

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM):
0 2 * * * cd /Users/ayushk/Desktop/billing_sys_rkct/database && ./backup_db.sh >> ./backups/backup.log 2>&1
```

#### For Production (Hostinger VPS):

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM):
0 2 * * * cd /var/www/billing_sys_rkct/database && ./backup_db.sh >> ./backups/backup.log 2>&1
```

---

## 📅 Cron Schedule Examples

```bash
# Every day at 2 AM
0 2 * * * /path/to/backup_db.sh

# Every 12 hours (2 AM and 2 PM)
0 2,14 * * * /path/to/backup_db.sh

# Every Sunday at 3 AM
0 3 * * 0 /path/to/backup_db.sh

# Every 6 hours
0 */6 * * * /path/to/backup_db.sh

# First day of every month at 1 AM
0 1 1 * * /path/to/backup_db.sh
```

---

## 📂 Backup Storage

### Local Backups
Backups are stored in: `database/backups/`

```
backups/
├── billing_system_backup_20260201_020000.sql.gz
├── billing_system_backup_20260202_020000.sql.gz
├── billing_system_backup_20260203_020000.sql.gz
└── backup.log
```

### Retention Policy
- **Automatic Cleanup**: Backups older than 30 days are auto-deleted
- **Storage**: ~2-5MB per backup (compressed)
- **Monthly Usage**: ~60-150MB for 30 days

---

## ☁️ Cloud Storage Integration (Optional)

### AWS S3 Upload

Uncomment this line in `backup_db.sh`:

```bash
aws s3 cp "${BACKUP_DIR}/${COMPRESSED_FILE}" s3://your-bucket/backups/
```

Then configure AWS CLI:

```bash
# Install AWS CLI
pip3 install awscli

# Configure credentials
aws configure
AWS Access Key ID: YOUR_KEY
AWS Secret Access Key: YOUR_SECRET
Default region name: us-east-1
Default output format: json
```

### Google Cloud Storage

```bash
# Install gsutil
curl https://sdk.cloud.google.com | bash

# Upload backup
gsutil cp "${BACKUP_DIR}/${COMPRESSED_FILE}" gs://your-bucket/backups/
```

---

## 🔄 Restore from Backup

### List Available Backups

```bash
ls -lh database/backups/
```

### Restore Specific Backup

```bash
cd database
./restore_db.sh backups/billing_system_backup_20260204_020000.sql.gz
```

You'll be prompted to confirm:
```
⚠️  WARNING: This will overwrite the current database!
Database: billing_system
Backup file: backups/billing_system_backup_20260204_020000.sql.gz

Are you sure you want to continue? (yes/no): yes
```

---

## 📊 Monitoring Backups

### Check Cron Job Status

```bash
# View cron logs (macOS)
tail -f /var/log/cron.log

# View cron logs (Linux)
tail -f /var/log/syslog | grep CRON

# View backup logs
tail -f database/backups/backup.log
```

### Email Notifications (Optional)

Add to crontab to receive emails:

```bash
MAILTO="your-email@example.com"
0 2 * * * cd /path/to/database && ./backup_db.sh
```

### Slack Notifications (Advanced)

Add to end of `backup_db.sh`:

```bash
# Send success notification to Slack
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d "{\"text\":\"✅ Backup completed: ${COMPRESSED_FILE} (${BACKUP_SIZE})\"}"
```

---

## 🧪 Testing Backup & Restore

### Test Full Cycle

```bash
# 1. Create a backup
cd database
./backup_db.sh

# 2. Make a test change in database
mysql -h HOST -u USER -p DATABASE_NAME

# 3. Restore from backup
./restore_db.sh backups/billing_system_backup_LATEST.sql.gz

# 4. Verify restoration
mysql -h HOST -u USER -p DATABASE_NAME -e "SHOW TABLES;"
```

---

## 🚨 Disaster Recovery Plan

### Scenario 1: Accidental Data Deletion

```bash
# Immediately stop all applications
docker compose down

# Restore from most recent backup
cd database
./restore_db.sh backups/billing_system_backup_LATEST.sql.gz

# Restart applications
docker compose up -d
```

### Scenario 2: Database Corruption

```bash
# 1. Download backup from cloud (if available)
aws s3 cp s3://your-bucket/backups/BACKUP_FILE.sql.gz ./

# 2. Restore
./restore_db.sh BACKUP_FILE.sql.gz
```

### Scenario 3: Complete Server Failure

```bash
# On new server:
# 1. Clone repository
git clone https://github.com/Ashish-Kr-1/billing_sys_rkct.git

# 2. Download latest backup from cloud
aws s3 cp s3://your-bucket/backups/LATEST.sql.gz ./database/backups/

# 3. Import database
cd database
./restore_db.sh backups/LATEST.sql.gz

# 4. Deploy application
docker compose up -d --build
```

---

## ✅ Verification Checklist

After setting up automated backups:

- [ ] Manual backup works successfully
- [ ] Cron job is scheduled and active
- [ ] Backup files are being created daily
- [ ] Old backups are being deleted (>30 days)
- [ ] Restore process tested successfully
- [ ] Cloud backup configured (if applicable)
- [ ] Monitoring/alerts set up
- [ ] Team knows how to restore from backup

---

## 📞 Support

If backups fail:

1. Check database credentials in `.env`
2. Verify network connectivity to database
3. Ensure sufficient disk space
4. Check cron job logs
5. Verify mysqldump is installed

---

Made with 🛡️ for R.K Casting Billing System

# Production Backup & Recovery Strategy

## 1. MongoDB Atlas Automated Backups
**Status:** Enabled (Depending on Atlas Tier).
- **M0 (Free Tier):** Does not support automated cloud backups. Ensure you run manual exports if using M0.
- **M10 and above:** Point-in-time recovery and automated daily snapshots are enabled by default.
- **Action:** Verify your MongoDB Atlas cluster tier. If you are on M0, you must configure a local `mongodump` cron job or upgrade to M10+ for automated backups.

## 2. Database Restore Procedure (Disaster Recovery)
If utilizing Atlas Automated Backups (M10+):
1. Log in to the [MongoDB Atlas Dashboard](https://cloud.mongodb.com).
2. Navigate to your Cluster -> **Collections** -> **Backup** tab.
3. Select a snapshot from before the catastrophic event.
4. Click **Restore**. Choose either to restore to the existing cluster or a new cluster.
5. If restoring to a new cluster, update the `MONGODB_URI` environment variable on your hosting provider to point to the new cluster.

If utilizing manual backups (`mongodump`):
```bash
mongorestore --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>" /path/to/backup/directory
```

## 3. Environment Variables Backup
- **Critical Secrets:** `MONGODB_URI`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `CLOUDINARY_API_KEY`, etc.
- **Backup Location:** These are NOT stored in Git. They must be securely backed up in a Password Manager (e.g., 1Password, Bitwarden) or a Cloud Secret Manager (e.g., AWS Secrets Manager, Render Environment Groups).
- **Action Required:** Ensure a verified copy of your production `.env` configuration is stored in your secure vault.

## 4. Rollback Procedure
If a new deployment introduces a critical regression:
1. **Identify Last Known Good Commit:** Find the Git tag or commit hash of the previous stable release.
   ```bash
   git log --oneline
   ```
2. **Revert the Codebase:**
   ```bash
   git revert <bad_commit_hash>
   # OR checkout previous commit
   git checkout <good_commit_hash>
   ```
3. **Trigger Redeployment:** Push the reverted code to the `main` branch to trigger an automatic CI/CD deployment, or manually redeploy via your hosting provider's dashboard (e.g., Render -> "Manual Deploy" -> "Deploy specific commit").
4. **Restore Archived Files (if applicable):** If files were incorrectly archived to `/backup-unused/`, they will be restored via the Git revert.

## 5. Application Recovery Behavior
The application is designed to recover gracefully from server restarts:
1. **Graceful Shutdown:** On `SIGINT`/`SIGTERM`, the HTTP server stops accepting new connections, and the MongoDB connection is safely closed.
2. **Restart:** The hosting provider (e.g., Render/Heroku) will automatically restart the Node process.
3. **Database Reconnect:** `server.js` will attempt to reconnect to MongoDB Atlas. If it fails due to transient network issues, the application will exit and the hosting provider will retry the deployment loop.
4. **Health Check:** External monitoring tools (UptimeRobot) ping `/health`. It will return `503 Service Unavailable` if the DB is disconnected, alerting administrators, and `200 OK` once fully recovered.

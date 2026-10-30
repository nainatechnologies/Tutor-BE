const cron = require('node-cron');
const backupService = require('../../modules/admin/services/backup.service');
const { expireStaleConnections, sendPendingConnectionReminders } = require('../../modules/connections/services/connectionExpiry.service');

/**
 * Initializes all recurring background cron jobs.
 */
const initScheduledJobs = () => {
    // 1. Everyday at 02:00 AM (0 2 * * *):
    // - Snapshot database schema and data
    // - Upload to Cloudinary database_backups
    // - Auto-purge snapshots older than 7 days
    cron.schedule('0 2 * * *', async () => {
        console.log(`\n======================================================`);
        console.log(`[Cron] Triggering Automated Daily DB Snapshot (${new Date().toISOString()})`);
        console.log(`======================================================`);
        try {
            const result = await backupService.performBackup('daily_auto');
            console.log(`[Cron] ✓ Automated backup successfully stored in Cloudinary!`);
            console.log(`- File:         ${result.filename}`);
            console.log(`- Size:         ${result.sizeFormatted}`);
            console.log(`- Download URL: ${result.downloadUrl}`);
            console.log(`======================================================\n`);
        } catch (err) {
            console.error(`[Cron] ✗ Automated daily backup failed:`, err.message);
            console.log(`======================================================\n`);
        }
    });
    console.log('[Cron] Automated daily database backup scheduled (Runs daily at 02:00 AM with 7-day retention).');

    // 2. Connection Expiry & 50 Coins Auto-Refund:
    // Run once 5s after startup to catch any requests that crossed 7 days while server was down
    setTimeout(async () => {
        try {
            console.log('[Cron] Running startup check for 7-day expired connection requests & reminders...');
            await expireStaleConnections();
            await sendPendingConnectionReminders();
        } catch (bootErr) {
            console.warn('[Cron] Initial connection expiry check note:', bootErr.message);
        }
    }, 5000);

    // Run every hour at minute 0 ('0 * * * *')
    cron.schedule('0 * * * *', async () => {
        console.log('[Cron] Running hourly check for 7-day expired connection requests & reminders...');
        try {
            await expireStaleConnections();
            await sendPendingConnectionReminders();
        } catch (cronErr) {
            console.error('[Cron] Error during connection expiry job:', cronErr.message);
        }
    });
    console.log('[Cron] Automated 7-Day Connection Expiry & Coin Refund scheduled (Runs every hour).');
};

module.exports = {
    initScheduledJobs,
};

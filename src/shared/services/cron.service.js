const cron = require('node-cron');
const backupService = require('../../modules/admin/services/backup.service');

/**
 * Initializes all recurring background cron jobs.
 */
const initScheduledJobs = () => {
    // Everyday at 02:00 AM (0 2 * * *):
    // 1. Snapshot database schema and data
    // 2. Upload to Cloudinary database_backups
    // 3. Auto-purge snapshots older than 7 days
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
};

module.exports = {
    initScheduledJobs,
};

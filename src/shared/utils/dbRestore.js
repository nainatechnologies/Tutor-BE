#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const backupService = require('../../modules/admin/services/backup.service');

async function runCliRestore() {
    console.log('====================================================');
    console.log('       TUTOR PLATFORM - DATABASE RESTORE            ');
    console.log('====================================================');

    const targetArg = process.argv[2];
    let restoreTarget = targetArg;

    if (!restoreTarget) {
        // 1. Check local backups folder first
        const localFiles = fs.existsSync(backupService.BACKUP_DIR)
            ? fs.readdirSync(backupService.BACKUP_DIR).filter(f => f.endsWith('.sql'))
            : [];

        if (localFiles.length > 0) {
            console.log('\nAvailable local backups in backups/ folder:');
            localFiles.forEach((f, idx) => console.log(`  [${idx + 1}] ${f}`));
            restoreTarget = path.join(backupService.BACKUP_DIR, localFiles[0]);
            console.log(`Defaulting to latest local backup: ${localFiles[0]}`);
        } else {
            // 2. Fetch from Cloudinary
            console.log('\nChecking Cloudinary database_backups folder...');
            const cloudBackups = await backupService.listCloudinaryBackups();
            if (cloudBackups.length === 0) {
                console.error('[ERROR] No backup snapshots found locally or in Cloudinary.');
                console.log('Please run `npm run db:backup` first to create a snapshot.');
                console.log('====================================================\n');
                process.exit(1);
            }

            console.log('\nAvailable snapshots in Cloudinary:');
            cloudBackups.forEach((b, idx) => {
                console.log(`  [${idx + 1}] ${b.filename} (${b.sizeFormatted}) - ${b.createdAt}`);
            });
            restoreTarget = cloudBackups[0].downloadUrl;
            console.log(`\nDefaulting to latest Cloudinary backup: ${cloudBackups[0].filename}`);
        }
    }

    console.log(`\nStarting restore from: ${restoreTarget}`);
    console.log(`Target Database: ${process.env.DB_NAME || 'tutor_db'} on ${process.env.DB_HOST || 'localhost'}`);

    const startTime = Date.now();
    try {
        const result = await backupService.restoreBackup(restoreTarget);
        const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n[SUCCESS] Database restore completed successfully!');
        console.log(`- Restored:   ${result.restoredFile}`);
        console.log(`- Database:   ${result.database}`);
        console.log(`- Duration:   ${durationSec}s`);
        console.log('====================================================\n');
        process.exit(0);
    } catch (err) {
        console.error('\n[ERROR] Database restore failed:');
        console.error(err.message || err);
        console.log('====================================================\n');
        process.exit(1);
    }
}

runCliRestore();

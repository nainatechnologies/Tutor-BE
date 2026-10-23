#!/usr/bin/env node
require('dotenv').config();
const backupService = require('../../modules/admin/services/backup.service');

async function runCliBackup() {
    console.log('====================================================');
    console.log('   TUTOR PLATFORM - DATABASE CLOUDINARY BACKUP      ');
    console.log('====================================================');
    console.log(`Database:   ${process.env.DB_NAME || 'tutor_db'}`);
    console.log(`Host:       ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}`);
    console.log(`User:       ${process.env.DB_USER || 'root'}`);
    console.log(`Retention:  Rolling ${backupService.MAX_BACKUP_RETENTION_DAYS} Days (Auto-purges older)`);
    console.log('----------------------------------------------------');
    console.log('Creating snapshot and uploading to Cloudinary...');

    try {
        const label = process.argv[2] || '';
        const result = await backupService.performBackup(label);

        console.log('\n[SUCCESS] Backup completed and saved to Cloudinary!');
        console.log(`- File Name:    ${result.filename}`);
        console.log(`- File Size:    ${result.sizeFormatted}`);
        console.log(`- Upload Time:  ${result.durationSeconds}s`);
        console.log(`- Download URL: ${result.downloadUrl}`);
        console.log('====================================================\n');
        process.exit(0);
    } catch (err) {
        console.error('\n[ERROR] Database backup failed:');
        console.error(err.message || err);
        console.log('====================================================\n');
        process.exit(1);
    }
}

runCliBackup();

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');
const { cloudinary } = require('../../../config/cloudinary');
const AppError = require('../../../shared/utils/AppError');

// Ensure backups directory exists at root of backend project for temporary dumps
const BACKUP_DIR = path.resolve(__dirname, '../../../../backups');
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 7 days rolling retention
const MAX_BACKUP_RETENTION_DAYS = 7;
const MAX_BACKUP_COUNT = 7;
const CLOUDINARY_BACKUP_FOLDER = 'database_backups';

/**
 * Helper to locate the mysqldump / mysql binary cross-platform.
 */
const resolveBinary = (binaryName) => {
    const ext = process.platform === 'win32' ? '.exe' : '';
    const executable = `${binaryName}${ext}`;

    if (process.platform === 'win32') {
        const commonWindowsPaths = [
            `C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\${executable}`,
            `C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\${executable}`,
            `C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\${executable}`,
            `C:\\xampp\\mysql\\bin\\${executable}`,
            `C:\\wamp64\\bin\\mysql\\mysql8.0.31\\bin\\${executable}`,
        ];
        for (const p of commonWindowsPaths) {
            if (fs.existsSync(p)) return p;
        }
    }

    return executable;
};

/**
 * Format raw byte size into human-readable string (KB, MB, GB).
 */
const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generates a local .sql snapshot using mysqldump.
 */
const createLocalDump = async (label = '') => {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '3306';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASS || '';
    const database = process.env.DB_NAME || 'tutor_db';

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    const safeLabel = label ? `_${label.replace(/[^a-zA-Z0-9_-]/g, '')}` : '';
    const filename = `${database}_${timestamp}${safeLabel}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    const mysqldumpBin = resolveBinary('mysqldump');

    const args = [
        `--host=${host}`,
        `--port=${port}`,
        `--user=${user}`,
        '--single-transaction',
        '--quick',
        '--skip-lock-tables',
        '--routines',
        '--triggers',
        database,
    ];

    return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(filepath);
        const child = spawn(mysqldumpBin, args, {
            env: {
                ...process.env,
                MYSQL_PWD: password,
            },
        });

        child.stdout.pipe(writeStream);

        let errorOutput = '';
        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        child.on('error', (err) => {
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            reject(new AppError(`mysqldump execution failed: ${err.message}`, 500));
        });

        child.on('close', (code) => {
            if (code !== 0) {
                if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
                return reject(new AppError(`mysqldump failed (code ${code}): ${errorOutput || 'Unknown error'}`, 500));
            }

            const stats = fs.statSync(filepath);
            resolve({
                filename,
                filepath,
                sizeBytes: stats.size,
                sizeFormatted: formatBytes(stats.size),
                database,
                createdAt: stats.mtime,
            });
        });
    });
};

/**
 * Rotates Cloudinary database backups: deletes any snapshot older than 7 days
 * or beyond the 7 most recent backups to maintain a rolling 7-day retention.
 */
const rotateCloudinaryBackups = async () => {
    try {
        const result = await cloudinary.api.resources({
            type: 'upload',
            resource_type: 'raw',
            prefix: `${CLOUDINARY_BACKUP_FOLDER}/`,
            max_results: 100,
        });

        const resources = (result.resources || []).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        const now = Date.now();
        const SEVEN_DAYS_MS = MAX_BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

        for (let i = 0; i < resources.length; i++) {
            const r = resources[i];
            const ageMs = now - new Date(r.created_at).getTime();
            const isOlderThan7Days = ageMs > SEVEN_DAYS_MS;
            const isBeyondMaxRetentionCount = i >= MAX_BACKUP_COUNT;

            if (isOlderThan7Days || isBeyondMaxRetentionCount) {
                console.log(`[Backup Service] Purging old snapshot from Cloudinary: ${r.public_id} (Age: ${(ageMs / (24 * 3600 * 1000)).toFixed(1)} days)`);
                await cloudinary.uploader.destroy(r.public_id, { resource_type: 'raw' });
            }
        }
    } catch (err) {
        console.warn('[Backup Service] Note on Cloudinary backup rotation:', err.message);
    }
};

/**
 * Uploads a local .sql snapshot to Cloudinary, rotates old backups (>7 days),
 * and removes the temporary local file to keep the server disk clean.
 */
const uploadToCloudinary = async (filepath, filename) => {
    try {
        console.log(`[Backup Service] Uploading '${filename}' to Cloudinary folder '${CLOUDINARY_BACKUP_FOLDER}'...`);
        const uploadRes = await cloudinary.uploader.upload(filepath, {
            resource_type: 'raw',
            folder: CLOUDINARY_BACKUP_FOLDER,
            use_filename: true,
            unique_filename: false,
        });

        // Auto-purge any snapshots older than 7 days
        await rotateCloudinaryBackups();

        // Clean up temporary local file
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        return {
            filename,
            downloadUrl: uploadRes.secure_url,
            publicId: uploadRes.public_id,
            bytes: uploadRes.bytes,
            sizeFormatted: formatBytes(uploadRes.bytes),
            createdAt: uploadRes.created_at,
        };
    } catch (err) {
        // Ensure local file cleaned up even on upload error
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
        throw new AppError(`Failed to upload snapshot to Cloudinary: ${err.message}`, 500);
    }
};

/**
 * Full automated backup pipeline:
 * 1. Dumps database to .sql
 * 2. Uploads to Cloudinary
 * 3. Rotates snapshots older than 7 days
 * 4. Cleans up server disk
 */
const performBackup = async (label = '') => {
    const startTime = Date.now();
    console.log(`[Backup Service] === Starting Database Snapshot (${new Date().toISOString()}) ===`);

    const localDump = await createLocalDump(label);
    console.log(`[Backup Service] Local dump complete: ${localDump.filename} (${localDump.sizeFormatted})`);

    const cloudinaryResult = await uploadToCloudinary(localDump.filepath, localDump.filename);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[Backup Service] ✓ Snapshot successfully stored in Cloudinary in ${duration}s!`);
    console.log(`[Backup Service] 🔗 Direct Download URL: ${cloudinaryResult.downloadUrl}`);

    return {
        ...cloudinaryResult,
        durationSeconds: duration,
    };
};

/**
 * Lists all active backup snapshots stored in Cloudinary.
 */
const listCloudinaryBackups = async () => {
    try {
        const result = await cloudinary.api.resources({
            type: 'upload',
            resource_type: 'raw',
            prefix: `${CLOUDINARY_BACKUP_FOLDER}/`,
            max_results: 50,
        });

        return (result.resources || [])
            .map(r => ({
                filename: path.basename(r.public_id),
                publicId: r.public_id,
                downloadUrl: r.secure_url,
                sizeBytes: r.bytes,
                sizeFormatted: formatBytes(r.bytes),
                createdAt: r.created_at,
            }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
        console.warn('[Backup Service] Failed to list Cloudinary backups:', err.message);
        return [];
    }
};

/**
 * Restores a MySQL database from either a local .sql file or a downloaded Cloudinary .sql file.
 */
const restoreBackup = async (filepathOrUrl) => {
    let localFilePath = filepathOrUrl;
    let isTempDownload = false;

    // If a full Cloudinary HTTPS URL is provided, download to a temporary file first
    if (typeof filepathOrUrl === 'string' && filepathOrUrl.startsWith('http')) {
        const tempName = `restore_${Date.now()}.sql`;
        localFilePath = path.join(BACKUP_DIR, tempName);
        isTempDownload = true;

        console.log(`[Backup Service] Downloading remote snapshot from '${filepathOrUrl}'...`);
        await new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(localFilePath);
            https.get(filepathOrUrl, (response) => {
                if (response.statusCode !== 200) {
                    return reject(new Error(`Failed to download file: HTTP ${response.statusCode}`));
                }
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close(resolve);
                });
            }).on('error', (err) => {
                if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
                reject(err);
            });
        });
    }

    if (!fs.existsSync(localFilePath)) {
        throw new AppError(`Backup file '${localFilePath}' not found`, 404);
    }

    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '3306';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASS || '';
    const database = process.env.DB_NAME || 'tutor_db';

    const mysqlBin = resolveBinary('mysql');

    const args = [
        `--host=${host}`,
        `--port=${port}`,
        `--user=${user}`,
        database,
    ];

    try {
        return await new Promise((resolve, reject) => {
            const readStream = fs.createReadStream(localFilePath);
            const child = spawn(mysqlBin, args, {
                env: {
                    ...process.env,
                    MYSQL_PWD: password,
                },
            });

            readStream.pipe(child.stdin);

            let errorOutput = '';
            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            child.on('error', (err) => {
                reject(new AppError(`mysql restore failed: ${err.message}`, 500));
            });

            child.on('close', (code) => {
                if (code !== 0) {
                    return reject(new AppError(`mysql restore failed (code ${code}): ${errorOutput || 'Unknown error'}`, 500));
                }

                resolve({
                    success: true,
                    restoredFile: path.basename(localFilePath),
                    database,
                    restoredAt: new Date(),
                });
            });
        });
    } finally {
        if (isTempDownload && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
    }
};

module.exports = {
    BACKUP_DIR,
    MAX_BACKUP_RETENTION_DAYS,
    createLocalDump,
    uploadToCloudinary,
    performBackup,
    listCloudinaryBackups,
    restoreBackup,
};

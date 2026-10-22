require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');
const http = require('http');

const PORT = process.env.PORT || 5001;

// Create the raw HTTP server
const server = http.createServer(app);


// Import models to ensure associations are registered
require('./src/modules/users/models');

// Schema update migration check for existing tables
const ensureSchemaUpdates = async (sequelize) => {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tables = await queryInterface.showAllTables();
        const hasReviews = tables.some(t => (typeof t === 'string' ? t : t.tableName || '').toLowerCase() === 'reviews');
        if (hasReviews) {
            const table = await queryInterface.describeTable('reviews');
            if (!table.status) {
                await sequelize.query("ALTER TABLE `reviews` ADD COLUMN `status` ENUM('published', 'hidden') NOT NULL DEFAULT 'published';");
            }
            if (!table.parentId) {
                await sequelize.query("ALTER TABLE `reviews` ADD COLUMN `parentId` CHAR(36) NULL;");
            }
            if (!table.appointmentId) {
                await sequelize.query("ALTER TABLE `reviews` ADD COLUMN `appointmentId` CHAR(36) NULL;");
            }
            if (!table.subject) {
                await sequelize.query("ALTER TABLE `reviews` ADD COLUMN `subject` VARCHAR(100) NULL;");
            }
            if (!table.tutorReply) {
                await sequelize.query("ALTER TABLE `reviews` ADD COLUMN `tutorReply` TEXT NULL;");
            }
            if (!table.tutorRepliedAt) {
                await sequelize.query("ALTER TABLE `reviews` ADD COLUMN `tutorRepliedAt` DATETIME NULL;");
            }
            // Safely alter targetType ENUM to include 'PARENT'
            try {
                await sequelize.query("ALTER TABLE `reviews` MODIFY COLUMN `targetType` ENUM('TUTOR', 'PARENT', 'PLATFORM') NOT NULL;");
            } catch (enumErr) {
                console.warn('targetType ENUM migration note:', enumErr.message);
            }

            // Safely drop any legacy foreign key constraint linking reviewerId to parent_profiles
            try {
                const [fkRows] = await sequelize.query(`
                    SELECT CONSTRAINT_NAME 
                    FROM information_schema.KEY_COLUMN_USAGE 
                    WHERE TABLE_SCHEMA = DATABASE() 
                      AND TABLE_NAME = 'reviews' 
                      AND COLUMN_NAME = 'reviewerId' 
                      AND REFERENCED_TABLE_NAME = 'parent_profiles';
                `);
                for (const row of fkRows) {
                    await sequelize.query(`ALTER TABLE \`reviews\` DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\`;`);
                }
            } catch (fkErr) {
                try {
                    await sequelize.query("ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_ibfk_1`;");
                } catch {}
            }
        }

        const hasParentProfiles = tables.some(t => (typeof t === 'string' ? t : t.tableName || '').toLowerCase() === 'parent_profiles');
        if (hasParentProfiles) {
            const parentTable = await queryInterface.describeTable('parent_profiles');
            if (!parentTable.rating) {
                await sequelize.query("ALTER TABLE `parent_profiles` ADD COLUMN `rating` DECIMAL(3, 2) NOT NULL DEFAULT 0.00;");
            }
            if (!parentTable.reviewCount) {
                await sequelize.query("ALTER TABLE `parent_profiles` ADD COLUMN `reviewCount` INT NOT NULL DEFAULT 0;");
            }
        }

        const hasTutorProfiles = tables.some(t => (typeof t === 'string' ? t : t.tableName || '').toLowerCase() === 'tutor_profiles');
        if (hasTutorProfiles) {
            const tutorTable = await queryInterface.describeTable('tutor_profiles');
            if (!tutorTable.viewsCount) {
                await sequelize.query("ALTER TABLE `tutor_profiles` ADD COLUMN `viewsCount` INT NOT NULL DEFAULT 0;");
            }
        }

        const hasComplaints = tables.some(t => (typeof t === 'string' ? t : t.tableName || '').toLowerCase() === 'complaints');
        if (hasComplaints) {
            const complaintTable = await queryInterface.describeTable('complaints');
            if (!complaintTable.category) {
                await sequelize.query("ALTER TABLE `complaints` ADD COLUMN `category` ENUM('TUTOR_BEHAVIOR', 'PAYMENT_COINS', 'TECHNICAL_ISSUE', 'SAFETY_CONCERN', 'OTHER') NOT NULL DEFAULT 'OTHER';");
            }
            if (!complaintTable.priority) {
                await sequelize.query("ALTER TABLE `complaints` ADD COLUMN `priority` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM';");
            }
            if (!complaintTable.appointmentId) {
                await sequelize.query("ALTER TABLE `complaints` ADD COLUMN `appointmentId` CHAR(36) NULL;");
            }
            try {
                await sequelize.query("CREATE INDEX `idx_complaints_reporter` ON `complaints` (`reporterId`);");
            } catch {}
            try {
                await sequelize.query("CREATE INDEX `idx_complaints_reported` ON `complaints` (`reportedId`);");
            } catch {}
            try {
                await sequelize.query("CREATE INDEX `idx_complaints_status` ON `complaints` (`status`);");
            } catch {}
        }

        const hasAdminProfiles = tables.some(t => (typeof t === 'string' ? t : t.tableName || '').toLowerCase() === 'admin_profiles');
        if (!hasAdminProfiles) {
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS \`admin_profiles\` (
                    \`id\` CHAR(36) NOT NULL PRIMARY KEY,
                    \`userId\` CHAR(36) NULL,
                    \`businessName\` VARCHAR(255) NOT NULL DEFAULT 'TutorApp India',
                    \`registrationNo\` VARCHAR(100) NOT NULL DEFAULT 'REG-2023-9912',
                    \`address\` TEXT NOT NULL,
                    \`businessDescription\` TEXT NOT NULL,
                    \`name\` VARCHAR(255) NOT NULL DEFAULT 'Super Admin',
                    \`email\` VARCHAR(255) NOT NULL DEFAULT 'contact@tutorapp.in',
                    \`phone\` VARCHAR(50) NOT NULL DEFAULT '+91 98765 43210',
                    \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
        }

        const hasNotifications = tables.some(t => (typeof t === 'string' ? t : t.tableName || '').toLowerCase() === 'notifications');
        if (!hasNotifications) {
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS \`notifications\` (
                    \`id\` CHAR(36) NOT NULL PRIMARY KEY,
                    \`userId\` CHAR(36) NULL,
                    \`targetRole\` ENUM('PARENT', 'TUTOR', 'ADMIN', 'ALL') NOT NULL DEFAULT 'ALL',
                    \`type\` ENUM('CONNECTION', 'APPOINTMENT', 'PAYMENT', 'REVIEW', 'COMPLAINT', 'REGISTRATION', 'SYSTEM') NOT NULL,
                    \`title\` VARCHAR(255) NOT NULL,
                    \`message\` TEXT NOT NULL,
                    \`data\` JSON NULL,
                    \`isRead\` TINYINT(1) NOT NULL DEFAULT 0,
                    \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX \`idx_notif_userId\` (\`userId\`),
                    INDEX \`idx_notif_targetRole\` (\`targetRole\`),
                    INDEX \`idx_notif_isRead\` (\`isRead\`),
                    INDEX \`idx_notif_createdAt\` (\`createdAt\`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
        }
    } catch (err) {
        console.warn('Schema migration check:', err.message);
    }
};

// Start the server
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Safely check and add any missing columns to existing database tables
        await ensureSchemaUpdates(sequelize);

        // Automatically create tables based on models (disabled alter to prevent ER_TOO_MANY_KEYS)
        await sequelize.sync();
        console.log('Database tables synchronized successfully.');
        // Listen using the server, not the Express app
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer();

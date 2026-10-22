/**
 * Server-Sent Events (SSE) Service
 * Manages real-time client connections and broadcasts notifications
 */
const { NOTIFICATION_TARGET_ROLES } = require('../../../shared/constants/notificationConstants');

class SSEService {
    constructor() {
        // Map<userId (string), Set<{ res: Response, role: string, userId: string }>>
        this.clients = new Map();

        // 25-second keep-alive heartbeat to prevent intermediate proxy / browser timeouts
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, 25000);

        if (this.heartbeatInterval.unref) {
            this.heartbeatInterval.unref();
        }
    }

    /**
     * Register a new client SSE response stream
     */
    addClient(userId, role, res) {
        if (!userId || !res) return;

        const uid = String(userId);
        const roleUpper = (role || '').toUpperCase();

        if (!this.clients.has(uid)) {
            this.clients.set(uid, new Set());
        }

        const clientObj = { res, role: roleUpper, userId: uid };
        this.clients.get(uid).add(clientObj);

        // Send handshake confirmation
        try {
            res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Real-time notification stream active' })}\n\n`);
        } catch (err) {
            this.removeClient(uid, res);
        }
    }

    /**
     * Remove a disconnected client stream
     */
    removeClient(userId, res) {
        if (!userId) return;
        const uid = String(userId);

        if (this.clients.has(uid)) {
            const set = this.clients.get(uid);
            for (const client of set) {
                if (client.res === res) {
                    set.delete(client);
                    break;
                }
            }
            if (set.size === 0) {
                this.clients.delete(uid);
            }
        }
    }

    /**
     * Send heartbeat comment line to all active connections
     */
    sendHeartbeat() {
        for (const [uid, clientSet] of this.clients.entries()) {
            for (const client of clientSet) {
                try {
                    client.res.write(': keepalive\n\n');
                } catch {
                    clientSet.delete(client);
                }
            }
            if (clientSet.size === 0) {
                this.clients.delete(uid);
            }
        }
    }

    /**
     * Broadcast notification to specific user and/or role
     */
    sendNotification(notification) {
        if (!notification) return;

        const payload = typeof notification.toJSON === 'function' ? notification.toJSON() : notification;
        const messageStr = `data: ${JSON.stringify(payload)}\n\n`;

        // Direct user recipient
        if (payload.userId) {
            const uid = String(payload.userId);
            if (this.clients.has(uid)) {
                const clientSet = this.clients.get(uid);
                for (const client of clientSet) {
                    try {
                        client.res.write(messageStr);
                    } catch {
                        clientSet.delete(client);
                    }
                }
            }
            return;
        }

        // Role-based or broadcast notification
        const target = (payload.targetRole || NOTIFICATION_TARGET_ROLES.ALL).toUpperCase();
        for (const [uid, clientSet] of this.clients.entries()) {
            for (const client of clientSet) {
                try {
                    if (target === NOTIFICATION_TARGET_ROLES.ALL || client.role === target) {
                        client.res.write(messageStr);
                    }
                } catch {
                    clientSet.delete(client);
                }
            }
        }
    }

    /**
     * Get active connections count (useful for diagnostics)
     */
    getActiveConnectionsCount() {
        let count = 0;
        for (const set of this.clients.values()) {
            count += set.size;
        }
        return count;
    }
}

// Singleton instance across backend
const sseService = new SSEService();

module.exports = sseService;

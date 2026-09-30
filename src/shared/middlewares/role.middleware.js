const AppError = require('../utils/AppError');

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles (e.g. 'parent', 'tutor', 'admin')
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('User not authenticated.', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(`Access denied. This action requires one of the following roles: [${roles.join(', ')}].`, 403)
            );
        }

        next();
    };
};

module.exports = {
    requireRole,
};

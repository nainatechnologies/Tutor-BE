const { ZodError } = require('zod');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || null;

    // 1. Handle Zod validation errors with clear, specific error messages
    if (err instanceof ZodError) {
        statusCode = 400;
        const firstIssue = err.issues && err.issues.length > 0 ? err.issues[0] : null;
        message = firstIssue ? (firstIssue.message || `Invalid ${firstIssue.path.join('.')}`) : 'Validation failed';
        errors = err.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
        }));
    }

    // 2. Handle Sequelize Unique Constraint Error (e.g. duplicate email/phone)
    if (err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        const firstField = err.errors && err.errors[0] ? err.errors[0].path : 'record';
        message = `A ${firstField} with this value already exists.`;
        errors = err.errors ? err.errors.map(e => ({ field: e.path, message: e.message })) : null;
    }

    // 3. Handle Sequelize Validation Error
    if (err.name === 'SequelizeValidationError') {
        statusCode = 400;
        message = err.errors && err.errors[0] ? err.errors[0].message : 'Invalid data provided.';
        errors = err.errors ? err.errors.map(e => ({ field: e.path, message: e.message })) : null;
    }

    // 4. Handle JWT Invalid Signature Error
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Authentication failed.';
    }

    // 5. Handle JWT Token Expired Error
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication failed.';
    }

    // In development, log full stack trace to console
    if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
        console.error('Unhandled Server Error:', err);
    }

    return res.status(statusCode).json({
        success: false,
        message,
        errors,
        ...(process.env.NODE_ENV === 'development' && statusCode === 500 ? { stack: err.stack } : {}),
    });
};

module.exports = errorHandler;

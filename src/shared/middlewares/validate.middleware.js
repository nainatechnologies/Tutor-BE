const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            const dataToValidate = req[source];
            const parsed = schema.parse(dataToValidate);
            // Replace request data with parsed/sanitized data from Zod
            req[source] = parsed;
            next();
        } catch (error) {
            next(error); // Passes to error.middleware.js which handles ZodError automatically
        }
    };
};

module.exports = validate;

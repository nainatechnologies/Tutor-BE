const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { User, ParentProfile, TutorProfile } = require('../../modules/users/models');

const protect = async (req, res, next) => {
    try {
        let token;

        // 1. Extract Bearer token from Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('Authentication failed.', 401));
        }

        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Check if user still exists
        const currentUser = await User.findByPk(decoded.id, {
            include: [
                { model: ParentProfile, as: 'parentProfile' },
                { model: TutorProfile, as: 'tutorProfile' },
            ],
        });

        if (!currentUser) {
            return next(new AppError('Authentication failed.', 401));
        }

        // 4. Check if user is active
        if (currentUser.status === 'suspended') {
            return next(new AppError('Access denied.', 403));
        }

        if (currentUser.status === 'inactive') {
            return next(new AppError('Access denied.', 403));
        }

        // 5. Grant access to protected route
        req.user = currentUser;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    protect,
};

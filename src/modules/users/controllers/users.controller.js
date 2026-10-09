const usersService = require('../services/users.service');
const AppError = require('../../../shared/utils/AppError');

// 1. Get Profile
const getProfile = async (req, res, next) => {
    try {
        const profile = await usersService.getUserProfile(req.user.id, req.user.role);
        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        next(error);
    }
};

// 2. Update Profile (Handles both Parent+Children and Tutor)
const updateProfile = async (req, res, next) => {
    try {
        const updatedProfile = await usersService.updateProfile(req.user.id, req.user.role, req.body);
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedProfile
        });
    } catch (error) {
        next(error);
    }
};

// 3. Upload File (Returns Cloudinary URL)
const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('No file provided or invalid file format.', 400));
        }
        
        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                url: req.file.path // Cloudinary stores the full secure URL in req.file.path
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadFile
};

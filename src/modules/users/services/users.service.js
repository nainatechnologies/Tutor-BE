const { ParentProfile, ChildProfile, TutorProfile, Subject, Category, User } = require('../models');
const AppError = require('../../../shared/utils/AppError');

// 1. Get Logged-In User Profile
const getUserProfile = async (userId, role) => {
    let profile = null;

    if (role === 'PARENT') {
        profile = await ParentProfile.findOne({
            where: { userId },
            include: [
                {
                    model: ChildProfile,
                    as: 'children',
                    include: [
                        {
                            model: Subject,
                            as: 'subjects',
                            attributes: ['id', 'name'],
                            through: { attributes: [] }
                        }
                    ]
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['email', 'phone']
                }
            ]
        });
    } else if (role === 'TUTOR') {
        profile = await TutorProfile.findOne({
            where: { userId },
            include: [
                {
                    model: Subject,
                    as: 'subjects',
                    attributes: ['id', 'name'],
                    through: { attributes: [] }
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['email', 'phone']
                }
            ]
        });
    }

    if (!profile) {
        throw new AppError('Profile not found', 404);
    }

    return profile;
};

// 2. Update Profile (Handles both PARENT with children, and TUTOR)
const updateProfile = async (userId, role, updateData) => {
    if (role === 'PARENT') {
        const profile = await ParentProfile.findOne({ where: { userId } });
        if (!profile) throw new AppError('Parent profile not found', 404);

        const { children, ...parentData } = updateData;
        await profile.update(parentData);

        // Simple sync for children if provided in the payload
        if (children && Array.isArray(children)) {
            // For true sync, we'd delete missing and update/create existing.
            // A simple implementation: destroy existing and recreate to ensure exact match.
            await ChildProfile.destroy({ where: { parentId: profile.id } });
            
            for (const childData of children) {
                const { subjectIds, ...childDetails } = childData;
                const child = await ChildProfile.create({ parentId: profile.id, ...childDetails });
                if (subjectIds && subjectIds.length > 0) {
                    await child.setSubjects(subjectIds);
                }
            }
        }
        return profile;
    } else if (role === 'TUTOR') {
        const profile = await TutorProfile.findOne({ where: { userId } });
        if (!profile) throw new AppError('Tutor profile not found', 404);
        
        const { subjectIds, ...tutorData } = updateData;
        await profile.update(tutorData);

        if (subjectIds && subjectIds.length > 0) {
            await profile.setSubjects(subjectIds);
        }
        
        // Reload the profile to grab the newly attached subjects so they show up in the API response!
        await profile.reload({ include: ['subjects'] });
        return profile;
    }
};

module.exports = {
    getUserProfile,
    updateProfile
};

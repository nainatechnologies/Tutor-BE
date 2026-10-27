const { ParentProfile, ChildProfile, TutorProfile, Subject, Category, User } = require('../models');
const AppError = require('../../../shared/utils/AppError');

// 1. Get Logged-In User Profile
const getUserProfile = async (userId, role) => {
    let profile = null;
    const normalizedRole = (role || '').toUpperCase();

    if (normalizedRole === 'PARENT') {
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
    } else if (normalizedRole === 'TUTOR') {
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
    const normalizedRole = (role || '').toUpperCase();
    if (normalizedRole === 'PARENT') {
        const profile = await ParentProfile.findOne({ where: { userId } });
        if (!profile) throw new AppError('Parent profile not found', 404);

        const { children, ...parentData } = updateData;
        Object.keys(parentData).forEach(key => {
            if (parentData[key] === '' || parentData[key] === null || parentData[key] === undefined) {
                delete parentData[key];
            }
        });
        await profile.update(parentData);

        // Simple sync for children if provided in the payload
        if (children && Array.isArray(children)) {
            if (children.length > 2) {
                throw new AppError('A parent can register a maximum of 2 children.', 400);
            }
            const existingChildren = await ChildProfile.findAll({ where: { parentId: profile.id } });
            for (const existing of existingChildren) {
                await existing.setSubjects([]);
                await existing.destroy();
            }
            
            for (const childData of children) {
                const { subjectIds, subjects, ...childDetails } = childData;
                const child = await ChildProfile.create({ parentId: profile.id, ...childDetails });
                
                let targetIds = Array.isArray(subjectIds) && subjectIds.length > 0 ? subjectIds : [];
                if (targetIds.length === 0 && Array.isArray(subjects) && subjects.length > 0) {
                    const matched = await Subject.findAll({ where: { name: subjects } });
                    targetIds = matched.map(s => s.id);
                }

                if (targetIds.length > 0) {
                    await child.setSubjects(targetIds);
                }
            }
        }
        return profile;
    } else if (normalizedRole === 'TUTOR') {
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

// 3. Get Tutor Analytics (Dynamic data from database)
const getTutorAnalytics = async (userId, timeRange = '30d') => {
    const { Op } = require('sequelize');
    const { Connection } = require('../models');

    const tutor = await TutorProfile.findOne({
        where: { userId },
        include: [
            {
                model: Subject,
                as: 'subjects',
                attributes: ['id', 'name'],
                through: { attributes: [] }
            }
        ]
    });

    if (!tutor) {
        throw new AppError('Tutor profile not found', 404);
    }

    const now = new Date();
    let startDate;
    let monthCount = 6;

    switch (timeRange) {
        case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            monthCount = 6;
            break;
        case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            monthCount = 6;
            break;
        case '3m':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            monthCount = 6;
            break;
        case '12m':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            monthCount = 12;
            break;
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            monthCount = 6;
            break;
    }

    const connections = await Connection.findAll({
        where: {
            tutorId: tutor.id,
            createdAt: {
                [Op.gte]: startDate
            }
        },
        order: [['createdAt', 'ASC']]
    });

    const totalLeads = connections.length;
    const totalMessages = connections.filter(c => c.message && c.message.trim().length > 0).length;
    const profileViews = tutor.viewsCount || 0;
    const avgRating = parseFloat(tutor.rating || 0);

    // Compute monthly data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyBuckets = [];

    for (let i = monthCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
        monthlyBuckets.push({
            year: d.getFullYear(),
            monthIndex: d.getMonth(),
            month: monthNames[d.getMonth()],
            leads: 0,
            key: monthKey
        });
    }

    connections.forEach(conn => {
        const connDate = new Date(conn.createdAt);
        const key = `${connDate.getFullYear()}-${connDate.getMonth()}`;
        const bucket = monthlyBuckets.find(b => b.key === key);
        if (bucket) {
            bucket.leads += 1;
        }
    });

    const monthlyData = monthlyBuckets.map(b => ({
        month: b.month,
        leads: b.leads
    }));

    // Compute leads by subject
    const tutorSubjects = (tutor.subjects || []).map(s => s.name);
    const subjectMap = new Map();

    tutorSubjects.forEach(name => {
        subjectMap.set(name, 0);
    });

    connections.forEach(conn => {
        let subjectName = null;
        if (conn.message && typeof conn.message === 'string') {
            const trimmed = conn.message.trim();
            if (trimmed.startsWith('{')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (parsed.subject) {
                        subjectName = parsed.subject;
                    }
                } catch {
                    // ignore JSON parse error
                }
            }
        }

        if (!subjectName && tutorSubjects.length > 0) {
            subjectName = tutorSubjects[0];
        } else if (!subjectName) {
            subjectName = 'Special Education / Tuition';
        }

        subjectMap.set(subjectName, (subjectMap.get(subjectName) || 0) + 1);
    });

    let leadsBySubject = Array.from(subjectMap.entries())
        .map(([course, leads]) => ({
            course,
            leads
        }))
        .sort((a, b) => b.leads - a.leads);

    if (leadsBySubject.length === 0) {
        leadsBySubject = [
            { course: 'Special Education / Tuition', leads: 0 }
        ];
    }

    return {
        profileViews,
        totalLeads,
        totalMessages,
        avgRating,
        monthlyData,
        leadsBySubject
    };
};

module.exports = {
    getUserProfile,
    updateProfile,
    getTutorAnalytics
};

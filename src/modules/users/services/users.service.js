const { ParentProfile, ChildProfile, TutorProfile, Subject, Category, User, Connection, Notification } = require('../models');
const sequelize = require('../../../config/database');
const { NOTIFICATION_TYPES, NOTIFICATION_TARGET_ROLES } = require('../../../shared/constants/notificationConstants');

/**
 * Sync Admin registration notification with newly saved profile location and name
 */
const syncAdminRegistrationNotification = async (userId, role, profile) => {
    try {
        const city = profile?.city || null;
        const pincode = profile?.pincode || null;
        const name = profile?.fullName || null;

        const locStr = city ? `${city}${pincode ? ` (${pincode})` : ''}` : (pincode ? `pincode ${pincode}` : null);
        const normalizedRole = (role || '').toUpperCase();

        let updatedMessage = '';
        if (normalizedRole === 'TUTOR') {
            updatedMessage = locStr
                ? `New tutor "${name || 'Tutor'}" has registered from ${locStr} and is awaiting review & approval.`
                : `New tutor "${name || 'Tutor'}" has registered and is awaiting review & approval.`;
        } else {
            updatedMessage = locStr
                ? `New parent "${name || 'Parent'}" has registered from ${locStr}.`
                : `New parent "${name || 'Parent'}" has registered.`;
        }

        const existingNotif = await Notification.findOne({
            where: {
                targetRole: NOTIFICATION_TARGET_ROLES.ADMIN,
                type: NOTIFICATION_TYPES.REGISTRATION,
                [sequelize.Sequelize.Op.and]: [
                    sequelize.literal(`JSON_UNQUOTE(JSON_EXTRACT(data, '$.userId')) = '${userId}'`)
                ]
            }
        });

        if (existingNotif) {
            const mergedData = {
                ...(existingNotif.data || {}),
                name: name || existingNotif.data?.name,
                city: city || existingNotif.data?.city,
                pincode: pincode || existingNotif.data?.pincode,
            };
            await existingNotif.update({
                message: updatedMessage,
                data: mergedData,
            });
        }
    } catch (err) {
        console.warn('[Users Service] Admin registration notification sync note:', err?.message);
    }
};
const AppError = require('../../../shared/utils/AppError');
const { validateTutorSubjects } = require('../../../shared/utils/subjectValidator');

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
                    where: { status: 'active' },
                    required: false,
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

        // Smart in-place sync for children (Soft-archive on removal, guard active connections)
        if (children && Array.isArray(children)) {
            if (children.length > 2) {
                throw new AppError('A parent can register a maximum of 2 children.', 400);
            }

            // 1. Fetch currently active children for this parent
            const activeExistingChildren = await ChildProfile.findAll({
                where: { parentId: profile.id, status: 'active' },
                include: [{ model: Subject, as: 'subjects', attributes: ['id', 'name'] }]
            });

            // 2. Identify which active children are being removed
            // An active child is kept if its ID or name matches an incoming child entry
            const retainedExistingIds = new Set();
            for (const childData of children) {
                if (childData.id) {
                    const matchById = activeExistingChildren.find(ex => ex.id === childData.id);
                    if (matchById) retainedExistingIds.add(matchById.id);
                } else if (childData.name) {
                    const matchByName = activeExistingChildren.find(
                        ex => ex.name.trim().toLowerCase() === childData.name.trim().toLowerCase()
                    );
                    if (matchByName && !retainedExistingIds.has(matchByName.id)) {
                        retainedExistingIds.add(matchByName.id);
                    }
                }
            }

            const childrenToRemove = activeExistingChildren.filter(ex => !retainedExistingIds.has(ex.id));

            // 3. Guard: If any child is being removed, ensure they have NO active tutor connections
            if (childrenToRemove.length > 0) {
                const activeConnections = await Connection.findAll({
                    where: {
                        parentId: profile.id,
                        status: [Connection.STATUS.PENDING, Connection.STATUS.ACCEPTED]
                    }
                });

                for (const exChild of childrenToRemove) {
                    const hasActiveConn = activeConnections.some(conn => {
                        try {
                            if (conn.message && typeof conn.message === 'string' && conn.message.trim().startsWith('{')) {
                                const meta = JSON.parse(conn.message);
                                if (meta.childId && meta.childId === exChild.id) return true;
                                if (meta.childName && meta.childName.trim().toLowerCase() === exChild.name.trim().toLowerCase()) return true;
                            }
                        } catch {
                            // parse error, fallback to count check if ambiguous
                        }
                        return activeExistingChildren.length === 1;
                    });

                    if (hasActiveConn) {
                        throw new AppError(
                            `Cannot remove child profile "${exChild.name}" while you have active connections with tutors. Please conclude or cancel your active tutor requests first.`,
                            400
                        );
                    }
                }

                // 4. Soft-archive removed children (do NOT destroy rows, preserve audit & history)
                for (const exChild of childrenToRemove) {
                    await exChild.update({ status: 'archived' });
                }
            }

            // 5. In-place update for existing children, or create for new children
            for (const childData of children) {
                const { subjectIds, subjects, id, ...childDetails } = childData;
                let existingRecord = null;
                if (id) {
                    existingRecord = activeExistingChildren.find(ex => ex.id === id);
                }
                if (!existingRecord && childDetails.name) {
                    existingRecord = activeExistingChildren.find(
                        ex => ex.name.trim().toLowerCase() === childDetails.name.trim().toLowerCase()
                    );
                }

                // Resolve subjects
                let targetIds = Array.isArray(subjectIds) && subjectIds.length > 0 ? subjectIds : [];
                if (targetIds.length === 0 && Array.isArray(subjects) && subjects.length > 0) {
                    const matched = await Subject.findAll({ where: { name: subjects } });
                    targetIds = matched.map(s => s.id);
                }

                if (existingRecord) {
                    // Update in-place to preserve primary key UUID and all relation integrity
                    await existingRecord.update({
                        name: childDetails.name,
                        grade: childDetails.grade !== undefined ? childDetails.grade : existingRecord.grade,
                        dateOfBirth: childDetails.dateOfBirth !== undefined ? childDetails.dateOfBirth : existingRecord.dateOfBirth,
                        gender: childDetails.gender !== undefined ? childDetails.gender : existingRecord.gender,
                        preferredTutorGender: childDetails.preferredTutorGender !== undefined ? childDetails.preferredTutorGender : existingRecord.preferredTutorGender,
                        medicalInformation: childDetails.medicalInformation !== undefined ? childDetails.medicalInformation : existingRecord.medicalInformation,
                        learningGoals: childDetails.learningGoals !== undefined ? childDetails.learningGoals : existingRecord.learningGoals,
                        preferredMode: childDetails.preferredMode !== undefined ? childDetails.preferredMode : existingRecord.preferredMode,
                        preferredSchedule: childDetails.preferredSchedule !== undefined ? childDetails.preferredSchedule : existingRecord.preferredSchedule,
                        schoolName: childDetails.schoolName !== undefined ? childDetails.schoolName : existingRecord.schoolName,
                        emergencyContactName: childDetails.emergencyContactName !== undefined ? childDetails.emergencyContactName : existingRecord.emergencyContactName,
                        emergencyContactPhone: childDetails.emergencyContactPhone !== undefined ? childDetails.emergencyContactPhone : existingRecord.emergencyContactPhone,
                        relationship: childDetails.relationship !== undefined ? childDetails.relationship : existingRecord.relationship,
                        status: 'active'
                    });

                    if (Array.isArray(subjectIds) || Array.isArray(subjects)) {
                        await existingRecord.setSubjects(targetIds);
                    }
                } else {
                    // Create new active child profile
                    const newChild = await ChildProfile.create({
                        parentId: profile.id,
                        status: 'active',
                        ...childDetails
                    });
                    if (targetIds.length > 0) {
                        await newChild.setSubjects(targetIds);
                    }
                }
            }
        }

        // Reload parent profile with active children and their subjects so caller gets fresh state with IDs
        await profile.reload({
            include: [
                {
                    model: ChildProfile,
                    as: 'children',
                    where: { status: 'active' },
                    required: false,
                    include: [
                        {
                            model: Subject,
                            as: 'subjects',
                            attributes: ['id', 'name'],
                            through: { attributes: [] }
                        }
                    ]
                }
            ]
        });

        // Sync admin notification with freshly updated parent details
        await syncAdminRegistrationNotification(userId, 'PARENT', profile);

        return profile;
    } else if (normalizedRole === 'TUTOR') {
        const profile = await TutorProfile.findOne({ where: { userId } });
        if (!profile) throw new AppError('Tutor profile not found', 404);
        
        const { subjectIds, ...tutorData } = updateData;

        // Determine effective professional type
        const effectiveProfessionalType = tutorData.professionalType || profile.professionalType || 'Teacher';

        // Auto-harmonize rates based on professionalType
        if (effectiveProfessionalType === 'Teacher') {
            if (tutorData.perHourFee !== undefined) {
                tutorData.perHourFee = parseFloat(tutorData.perHourFee) || 0;
                tutorData.perSessionFee = tutorData.perHourFee;
            } else if (tutorData.perSessionFee !== undefined) {
                tutorData.perSessionFee = parseFloat(tutorData.perSessionFee) || 0;
                tutorData.perHourFee = tutorData.perSessionFee;
            }
        } else if (effectiveProfessionalType === 'Therapist') {
            if (tutorData.perSessionFee !== undefined) {
                tutorData.perSessionFee = parseFloat(tutorData.perSessionFee) || 0;
            }
        }
        if (tutorData.monthlyEstimateFee !== undefined) {
            tutorData.monthlyEstimateFee = parseFloat(tutorData.monthlyEstimateFee) || 0;
        } else if ((tutorData.perSessionFee || tutorData.perHourFee) && !profile.monthlyEstimateFee) {
            const baseRate = tutorData.perSessionFee || tutorData.perHourFee || 0;
            if (baseRate > 0) tutorData.monthlyEstimateFee = baseRate * 8;
        }

        // Enforce SSOT: Teacher -> ACADEMIC subjects, Therapist -> SERVICE subjects
        if (Array.isArray(subjectIds) && subjectIds.length > 0) {
            const validatedSubjects = await validateTutorSubjects(effectiveProfessionalType, subjectIds);
            // Sync areasOfPractice with subject names for data consistency
            tutorData.areasOfPractice = validatedSubjects.map(s => s.name);
        } else if (tutorData.professionalType && tutorData.professionalType !== profile.professionalType) {
            // Tutor changed their professional type without passing new subjects:
            // Check if existing subjects are compatible
            const existingSubjects = await profile.getSubjects({ include: [{ model: Category, as: 'category' }] });
            if (existingSubjects.length > 0) {
                await validateTutorSubjects(effectiveProfessionalType, existingSubjects.map(s => s.id));
            }
        }

        await profile.update(tutorData);

        if (Array.isArray(subjectIds)) {
            await profile.setSubjects(subjectIds);
        }
        
        // Reload the profile to grab the newly attached subjects so they show up in the API response!
        await profile.reload({
            include: [
                {
                    model: Subject,
                    as: 'subjects',
                    attributes: ['id', 'name'],
                    through: { attributes: [] }
                }
            ]
        });

        // Sync admin notification with freshly updated tutor details
        await syncAdminRegistrationNotification(userId, 'TUTOR', profile);

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

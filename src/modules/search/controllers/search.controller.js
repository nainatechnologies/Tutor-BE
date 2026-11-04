const searchService = require('../services/search.service');

exports.searchTutors = async (req, res, next) => {
    try {
        const filters = {
            q: req.query.q || req.query.query,
            city: req.query.city,
            pincode: req.query.pincode,
            subjectId: req.query.subjectId,
            childId: req.query.childId,
            parentId: req.query.parentId,
            childIds: req.query.childIds,
            explore: req.query.explore,
            tutorType: req.query.tutorType,
            professionalType: req.query.professionalType,
            gender: req.query.gender,
            minFee: req.query.minFee ? parseFloat(req.query.minFee) : undefined,
            maxFee: req.query.maxFee ? parseFloat(req.query.maxFee) : undefined,
            minSessionFee: req.query.minSessionFee ? parseFloat(req.query.minSessionFee) : undefined,
            maxSessionFee: req.query.maxSessionFee ? parseFloat(req.query.maxSessionFee) : undefined,
            minMonthlyFee: req.query.minMonthlyFee ? parseFloat(req.query.minMonthlyFee) : undefined,
            maxMonthlyFee: req.query.maxMonthlyFee ? parseFloat(req.query.maxMonthlyFee) : undefined,
            minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
            minExperience: req.query.minExperience ? parseInt(req.query.minExperience, 10) : undefined,
            teachingMode: req.query.teachingMode,
            sortBy: req.query.sortBy || 'relevance',
            page: req.query.page ? parseInt(req.query.page, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 12,
        };

        const results = await searchService.searchTutors(filters);
        
        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        next(error);
    }
};

exports.getTutorById = async (req, res, next) => {
    try {
        const tutor = await searchService.getTutorById(req.params.id);
        if (!tutor) {
            return res.status(404).json({ success: false, message: 'Tutor not found' });
        }
        res.status(200).json({ success: true, data: tutor });
    } catch (error) {
        next(error);
    }
};

exports.autocomplete = async (req, res, next) => {
    try {
        const q = (req.query.q || req.query.query || '').trim();
        if (!q || q.length < 2) {
            return res.status(200).json({
                success: true,
                data: { subjects: [], tutors: [], locations: [] }
            });
        }
        const data = await searchService.getAutocompleteSuggestions(q);
        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
};

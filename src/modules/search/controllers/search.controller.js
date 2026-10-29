const searchService = require('../services/search.service');

exports.searchTutors = async (req, res, next) => {
    try {
        const filters = {
            q: req.query.q || req.query.query,
            city: req.query.city,
            pincode: req.query.pincode,
            subjectId: req.query.subjectId,
            tutorType: req.query.tutorType,
            professionalType: req.query.professionalType,
            maxFee: req.query.maxFee ? parseFloat(req.query.maxFee) : undefined,
            page: req.query.page ? parseInt(req.query.page, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
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

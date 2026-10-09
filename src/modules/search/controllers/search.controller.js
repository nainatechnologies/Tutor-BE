const searchService = require('../services/search.service');

exports.searchTutors = async (req, res, next) => {
    try {
        const filters = {
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

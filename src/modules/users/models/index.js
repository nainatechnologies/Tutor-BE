const User = require('./User');
const ParentProfile = require('./ParentProfile');
const ChildProfile = require('./ChildProfile');
const TutorProfile = require('./TutorProfile');
const Category = require('../../master/models/Category');
const Subject = require('../../master/models/Subject');
const OtpCode = require('./OtpCode');
const Connection = require('../../connections/models/Connection');
const Appointment = require('../../appointments/models/Appointment');
const Payment = require('../../payments/models/Payment');
const Complaint = require('../../support/models/Complaint');
const Review = require('../../reviews/models/Review');

// ==========================================
// User <-> ParentProfile (1:1)
// ==========================================
User.hasOne(ParentProfile, {
    foreignKey: 'userId',
    as: 'parentProfile',
    onDelete: 'CASCADE',
});
ParentProfile.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

// ==========================================
// User <-> TutorProfile (1:1)
// ==========================================
User.hasOne(TutorProfile, {
    foreignKey: 'userId',
    as: 'tutorProfile',
    onDelete: 'CASCADE',
});
TutorProfile.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

// ==========================================
// ParentProfile <-> ChildProfile (1:N)
// ==========================================
ParentProfile.hasMany(ChildProfile, {
    foreignKey: 'parentId',
    as: 'children',
    onDelete: 'CASCADE',
});
ChildProfile.belongsTo(ParentProfile, {
    foreignKey: 'parentId',
    as: 'parent',
});

// ==========================================
// Category <-> Subject (1:N)
// ==========================================
Category.hasMany(Subject, {
    foreignKey: 'categoryId',
    as: 'subjects',
});
Subject.belongsTo(Category, {
    foreignKey: 'categoryId',
    as: 'category',
});

// ==========================================
// TutorProfile <-> Subject (M:N)
// ==========================================
TutorProfile.belongsToMany(Subject, {
    through: 'tutor_subjects',
    foreignKey: 'tutorProfileId',
    otherKey: 'subjectId',
    as: 'subjects',
});
Subject.belongsToMany(TutorProfile, {
    through: 'tutor_subjects',
    foreignKey: 'subjectId',
    otherKey: 'tutorProfileId',
    as: 'tutors',
});

// ==========================================
// ChildProfile <-> Subject (M:N)
// ==========================================
ChildProfile.belongsToMany(Subject, {
    through: 'child_subjects',
    foreignKey: 'childProfileId',
    otherKey: 'subjectId',
    as: 'subjects',
});
Subject.belongsToMany(ChildProfile, {
    through: 'child_subjects',
    foreignKey: 'subjectId',
    otherKey: 'childProfileId',
    as: 'children',
});

// ==========================================
// Connection Associations
// ==========================================
ParentProfile.hasMany(Connection, { foreignKey: 'parentId', as: 'connections' });
Connection.belongsTo(ParentProfile, { foreignKey: 'parentId', as: 'parent' });
TutorProfile.hasMany(Connection, { foreignKey: 'tutorId', as: 'connections' });
Connection.belongsTo(TutorProfile, { foreignKey: 'tutorId', as: 'tutor' });

// ==========================================
// Appointment Associations
// ==========================================
ParentProfile.hasMany(Appointment, { foreignKey: 'parentId', as: 'appointments' });
Appointment.belongsTo(ParentProfile, { foreignKey: 'parentId', as: 'parent' });
TutorProfile.hasMany(Appointment, { foreignKey: 'tutorId', as: 'appointments' });
Appointment.belongsTo(TutorProfile, { foreignKey: 'tutorId', as: 'tutor' });
ChildProfile.hasMany(Appointment, { foreignKey: 'childId', as: 'appointments' });
Appointment.belongsTo(ChildProfile, { foreignKey: 'childId', as: 'child' });

// ==========================================
// Payment Associations
// ==========================================
User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ==========================================
// Complaint Associations
// ==========================================
User.hasMany(Complaint, { foreignKey: 'reporterId', as: 'complaintsFiled' });
Complaint.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
User.hasMany(Complaint, { foreignKey: 'reportedId', as: 'complaintsReceived' });
Complaint.belongsTo(User, { foreignKey: 'reportedId', as: 'reportedUser' });

// ==========================================
// Review Associations
// ==========================================
ParentProfile.hasMany(Review, { foreignKey: 'reviewerId', as: 'reviewsGiven' });
Review.belongsTo(ParentProfile, { foreignKey: 'reviewerId', as: 'reviewer' });

TutorProfile.hasMany(Review, { foreignKey: 'tutorId', as: 'reviewsReceived' });
Review.belongsTo(TutorProfile, { foreignKey: 'tutorId', as: 'tutor' });

module.exports = {
    User,
    ParentProfile,
    ChildProfile,
    TutorProfile,
    Category,
    Subject,
    OtpCode,
    Connection,
    Appointment,
    Payment,
    Complaint,
    Review,
};

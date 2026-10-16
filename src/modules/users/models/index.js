const User = require('./User');
const ParentProfile = require('./ParentProfile');
const ChildProfile = require('./ChildProfile');
const TutorProfile = require('./TutorProfile');
const AdminProfile = require('./AdminProfile');
const Category = require('../../master/models/Category');
const Subject = require('../../master/models/Subject');
const OtpCode = require('./OtpCode');
const Connection = require('../../connections/models/Connection');
const Appointment = require('../../appointments/models/Appointment');
const Payment = require('../../payments/models/Payment');
const Complaint = require('../../support/models/Complaint');
const Review = require('../../reviews/models/Review');
const { Wallet, WalletTransaction } = require('../../wallet/models');

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
// User <-> AdminProfile (1:1)
// ==========================================
User.hasOne(AdminProfile, {
    foreignKey: 'userId',
    as: 'adminProfile',
    onDelete: 'CASCADE',
});
AdminProfile.belongsTo(User, {
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
Subject.hasMany(Appointment, { foreignKey: 'subjectId', as: 'appointments' });
Appointment.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });

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
Appointment.hasMany(Complaint, { foreignKey: 'appointmentId', as: 'complaints' });
Complaint.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

// ==========================================
// Review Associations
// ==========================================
User.hasMany(Review, { foreignKey: 'reviewerId', as: 'reviewsGiven' });
Review.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewerUser' });

ParentProfile.hasMany(Review, { foreignKey: 'reviewerId', sourceKey: 'userId', as: 'reviewsGiven', constraints: false });
Review.belongsTo(ParentProfile, { foreignKey: 'reviewerId', targetKey: 'userId', as: 'reviewer', constraints: false });

TutorProfile.hasMany(Review, { foreignKey: 'reviewerId', sourceKey: 'userId', as: 'tutorReviewsGiven', constraints: false });
Review.belongsTo(TutorProfile, { foreignKey: 'reviewerId', targetKey: 'userId', as: 'reviewerTutor', constraints: false });

TutorProfile.hasMany(Review, { foreignKey: 'tutorId', as: 'reviewsReceived' });
Review.belongsTo(TutorProfile, { foreignKey: 'tutorId', as: 'tutor' });

ParentProfile.hasMany(Review, { foreignKey: 'parentId', as: 'parentReviewsReceived' });
Review.belongsTo(ParentProfile, { foreignKey: 'parentId', as: 'reviewedParent' });

Appointment.hasOne(Review, { foreignKey: 'appointmentId', as: 'review' });
Review.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

// ==========================================
// Wallet Associations
// ==========================================
User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet', onDelete: 'CASCADE' });
Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(WalletTransaction, { foreignKey: 'userId', as: 'walletTransactions', onDelete: 'CASCADE' });
WalletTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
    User,
    ParentProfile,
    ChildProfile,
    TutorProfile,
    AdminProfile,
    Category,
    Subject,
    OtpCode,
    Connection,
    Appointment,
    Payment,
    Complaint,
    Review,
    Wallet,
    WalletTransaction,
};


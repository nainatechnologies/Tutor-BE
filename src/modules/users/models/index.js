const User = require('./User');
const ParentProfile = require('./ParentProfile');
const ChildProfile = require('./ChildProfile');
const TutorProfile = require('./TutorProfile');
const Category = require('../../master/models/Category');
const Subject = require('../../master/models/Subject');

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

module.exports = {
    User,
    ParentProfile,
    ChildProfile,
    TutorProfile,
    Category,
    Subject,
};

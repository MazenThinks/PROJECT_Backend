const slugify = require('slugify');
const bcrypt = require('bcryptjs');
const { body,check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const User = require('../../models/userModel');

exports.createUserValidator = [
    check('name')
    .notEmpty()
    .withMessage('User required')
    .isLength({ min: 3 })
    .withMessage('Too short User name')
    .custom((val, { req }) => {
        req.body.slug = slugify (val); 
        return true;
    }),
    check('email')
    .notEmpty()
    .withMessage('Email required')
    .isEmail()
    .withMessage('Invalid email address')
    .custom((val) => 
        User.findOne({ email: val}).then((user) => {
        if (user) {
            return Promise.reject(new Error('Email already exists'));
        }
        return true;
    })
),
    check('password')
    .notEmpty()
    .withMessage('Password required')
    .isLength({ min: 6})
    .withMessage('Password must be at least 6 characters long')
    .custom((password, { req }) => {
        if (password !== req.body.passwordConfirm) {
            throw new Error('Password Confirmation incorrect');
        }
        return true;
    }),

    check('passwordConfirm').notEmpty().withMessage('password confirmation required'),

check('phone').optional().isMobilePhone(['ar-EG', 'ar-SA'])
.withMessage('invalid phone number only accepts EGY and SA numbers'),

check('profileImg').optional(),
check('role').optional(),

    validatorMiddleware,
];

exports.getUserValidator = [
    check('id').isMongoId().withMessage('Invalid User id format'),
    validatorMiddleware,
];

exports.updateUserValidator = [
    check('id').isMongoId().withMessage('Invalid User id format'),
    body('name').optional().custom((val, { req }) => {
    req.body.slug = slugify (val); 
    return true;
    }),

    check('email')
    .notEmpty()
    .withMessage('Email required')
    .isEmail()
    .withMessage('Invalid email address')
    .custom((val) => 
        User.findOne({ email: val}).then((user) => {
        if (user) {
            return Promise.reject(new Error('Email already exists'));
        }
        return true;
    })
),
check('phone').optional().isMobilePhone(['ar-EG', 'ar-SA'])
.withMessage('invalid phone number only accepts EGY and SA numbers'),

check('profileImg').optional(),
check('role').optional(),

    validatorMiddleware,
];


exports.changeUserPasswordValidator = [
check('id').isMongoId().withMessage('Invalid User id format'),
body('currentPassword')
.notEmpty()
.withMessage('You must enter your current password'),
body('passwordConfirm')
.notEmpty()
.withMessage('You must enter the password confirm'),
body('password')
.notEmpty()
.withMessage('You must enter new password')
.custom(async( val, { req }) => {
// 1- verfiy current password
const user = await User.findById(req.params.id);
if (!user) {
    throw new Error('There is no user for this id');
}
const isCorrectPassword = await bcrypt.compare(
    req.body.currentPassword,
    user.password
);
if (!isCorrectPassword) {
    throw new Error('Your current password is incorrect');
}
// 2- verfiy password confirm
if (val !== req.body.passwordConfirm) {
    throw new Error('Password Confirmation incorrect');
}
return true;
}),
validatorMiddleware
]; 

exports.deleteUserValidator = [
    check('id').isMongoId().withMessage('Invalid User id format'),
    validatorMiddleware,
];


exports.updateLoggedUserValidator = [
    body('name').optional().custom((val, { req }) => {
    req.body.slug = slugify (val); 
    return true;
    }),

    check('email')
    .notEmpty()
    .withMessage('Email required')
    .isEmail()
    .withMessage('Invalid email address')
    .custom((val) => 
        User.findOne({ email: val}).then((user) => {
        if (user) {
            return Promise.reject(new Error('Email already exists'));
        }
        return true;
    })
),
check('phone').optional().isMobilePhone(['ar-EG', 'ar-SA'])
.withMessage('invalid phone number only accepts EGY and SA numbers'),

    validatorMiddleware,
];
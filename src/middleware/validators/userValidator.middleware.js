const { body } = require('express-validator');
const Role = require('../../utils/userRoles.utils');
const Account = require('../../utils/userEnable.utils');


exports.createUserSchema = [
    body('id')
        .exists()
        .withMessage('id is required')
        .isLength({ min: 3 })
        .withMessage('Must be at least 3 chars long'),
    body('name')
        .exists()
        .withMessage('name is required')
        .isLength({ min: 3 })
        .withMessage('Must be at least 3 chars long'),
    body('password')
        .exists()
        .withMessage('Password is required')
        .notEmpty()
        .isLength({ min: 6 })
        .withMessage('Password must contain at least 6 characters')
        .isLength({ max: 18 })
        .withMessage('Password can contain max 10 characters'),
    body('confirm_password')
        .exists()
        .custom((value, { req }) => value === req.body.password)
        .withMessage('confirm_password field must have the same value as the password field'),
    body('email')
        .exists()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Must be a valid email')
        .normalizeEmail(),
    body('contact')
        .exists()
        .withMessage('contact is required')
        .isLength({ min: 3 })
        .withMessage('Must be at least 3 chars long'),
    body('enabled')
        .optional()
        .isNumeric()
        .isIn([Account.Enabled, Account.Disabled])
        .withMessage('Invalid Account Status type'),
    body('role')
        .optional()
        .isNumeric()
        .isIn([Role.Admin, Role.User])
        .withMessage('Invalid Role type')
];

exports.updateUserSchema = [
    body('name')
        .optional()
        .isLength({ min: 3 })
        .withMessage('Must be at least 3 chars long'),
    body('password')
        .optional()
        .notEmpty()
        .isLength({ min: 6 })
        .withMessage('Password must contain at least 6 characters')
        .isLength({ max: 18 })
        .withMessage('Password can contain max 10 characters')
        .custom((value, { req }) => !!req.body.confirm_password)
        .withMessage('Please confirm your password'),
    body('confirm_password')
        .optional()
        .custom((value, { req }) => value === req.body.password)
        .withMessage('confirm_password field must have the same value as the password field'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Must be a valid email')
        .normalizeEmail(),
    body('contact')
        .optional()
        .isLength({ min: 3 })
        .withMessage('Must be at least 3 chars long'),
    body('refer')
        .optional()
        .isAlpha()
        .withMessage('Must be only alphabetical chars')
        .isLength({ min: 3 })
        .withMessage('Must be at least 3 chars long'),
    body('enabled')
        .optional()
        .isNumeric()
        .isIn([Account.Enabled, Account.Disabled])
        .withMessage('Invalid Account Status type'),
    body('role')
        .optional()
        .isNumeric()
        .isIn([Role.Admin, Role.User])
        .withMessage('Invalid Role type'),
    body()
        .custom(value => {
            return !!Object.keys(value).length;
        })
        .withMessage('Please provide required field to update')
        .custom(value => {
            const updates = Object.keys(value);
            const allowUpdates = ['name', 'password', 'confirm_password', 'email', 'contact', 'refer', 'enabled', 'role'];
            return updates.every(update => allowUpdates.includes(update));
        })
        .withMessage('Invalid updates!')
];

exports.validateLogin = [
    body('email')
        .exists()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Must be a valid email')
        .normalizeEmail(),
    body('password')
        .exists()
        .withMessage('Password is required')
        .notEmpty()
        .withMessage('Password must be filled')
];
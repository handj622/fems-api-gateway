const { body } = require('express-validator');

exports.createClusterSchema = [
    body('clusterName')
        .exists()
        .withMessage('name is required'),
    body('ip')
        .exists()
        .withMessage('ip is required'),
    body('port')
        .exists()
        .withMessage('port is required'),
    body('status')
        .exists()
        .withMessage('status is required'), 
    body('clusterType')
        .exists()
        .withMessage('clusterType is required'),
    body('clusterCode')
        .exists()
        .withMessage('clusterCode is required')
        .isLength({ min: 11 })
        .withMessage('Must be at least 11 chars long')
];
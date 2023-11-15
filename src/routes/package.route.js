const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package.controller');
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

router.get('/', auth(), awaitHandlerFactory(packageController.getAllData)); // localhost:3000/fcsapi/v1/packages
router.get('/value', auth(), awaitHandlerFactory(packageController.getPackageValue)); // localhost:3000/fcsapi/v1/packages/value
router.post('/', auth(), awaitHandlerFactory(packageController.deployPackage)); // localhost:3000/fcsapi/v1/packages

module.exports = router;

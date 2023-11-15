const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

router.get('/', auth(), awaitHandlerFactory(serviceController.getAllData)); // localhost:3000/fcsapi/v1/services
router.get('/service_id/:service_id', auth(), awaitHandlerFactory(serviceController.getDataById)); // localhost:3000/fcsapi/v1/services/{service_id}
router.get('/monitoring', auth(), awaitHandlerFactory(serviceController.getMonitoringData)); // localhost:3000/fcsapi/v1/services/monitoring

module.exports = router;

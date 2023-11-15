const express = require('express');
const router = express.Router();
const clusterController = require('../controllers/cluster.controller');
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const { createClusterSchema } = require('../middleware/validators/clusterValidator.middleware');

router.get('/', auth(), awaitHandlerFactory(clusterController.getAllData)); // localhost:3000/fcsapi/v1/cluster/
router.get('/clusterCode/:clusterCode', auth(), awaitHandlerFactory(clusterController.getDataById)); // localhost:3000/fcsapi/v1/cluster
router.get('/monitoring', auth(), awaitHandlerFactory(clusterController.getMonitoringData)); // localhost:3000/fcsapi/v1/cluster/monitoring?start={startTime}&end={endTime}(&Timeinterval={duration})&step={duration}&clusterCode={clusterCode}&podname={podname}&metric_filter={metric}|{metric}|{metric}...

router.post('/', auth(), createClusterSchema, awaitHandlerFactory(clusterController.createCluster));// localhost:3000/fcsapi/v1/cluster

router.patch('/:clusterCode', auth(), awaitHandlerFactory(clusterController.updateCluster));// localhost:3000/fcsapi/v1/cluster
router.delete('/:clusterCode', auth(), awaitHandlerFactory(clusterController.deleteCluster));// localhost:3000/fcsapi/v1/cluster

module.exports = router;
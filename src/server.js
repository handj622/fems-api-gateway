const express = require("express");
const dotenv = require('dotenv');
const cors = require("cors");
const HttpException = require('./utils/HttpException.utils');
const errorMiddleware = require('./middleware/error.middleware');
const userRouter = require('./routes/user.route');
const autoDB = require('./autoUpdate.DB');
const automodel = require('./models/autoUpdate.model');
const clusterRouter = require('./routes/cluster.route');
const serviceRouter = require('./routes/service.route');
const packageRouter = require('./routes/package.route');
const auto = require("node-schedule");

// Init express
const app = express();
// Init environment
dotenv.config();
// console.log(process.env);
// parse requests of content-type: application/json
// parses incoming requests with JSON payloads
app.use(express.json());
// enabling cors for all requests by using cors middleware
app.use(cors());
// Enable pre-flight
app.options("*", cors());

const port = Number(process.env.PORT || 18000);

app.use(`/api/v1/users`, userRouter);
app.use(`/fcsapi/v1/cluster`, clusterRouter);
app.use(`/fcsapi/v1/services`, serviceRouter);
app.use(`/fcsapi/v1/packages`, packageRouter);

// 404 error
app.all('*', (req, res, next) => {
    const err = new HttpException(404, 'Endpoint Not Found');
    next(err);
});

// Error middleware
app.use(errorMiddleware);

// starting the server
app.listen(port, () =>
    console.log(`🚀 Server running on port ${port}!`));

auto.scheduleJob({second: 0}, function() {
    autoDB.getAllData(automodel);
});

module.exports = app;

const ClusterModel = require('../models/cluster.model');
const HttpException = require('../utils/HttpException.utils');
const { podMetric, nodeMetric } = require('../metricList');
const { validationResult } = require('express-validator');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

/******************************************************************************
 *                              Cluster Controller
 ******************************************************************************/
class ClusterController {
    getAllData = async (req, res, next) => {
        let dataList;
        if(req.query.clusterType !== undefined) dataList = await ClusterModel.findOne(req.query)
        else dataList = await ClusterModel.find();

        if (!dataList.length) {
          throw new HttpException(404, "Data not found");
        }
    
        var clusterName = [];
        var clusterType = [];
        var clusterCode = [];
        var status = [];

        for (var i = 0; i < dataList.length; i++) {
          clusterName[i] = dataList[i]["clusterName"];
          clusterType[i] = dataList[i]["clusterType"];
          clusterCode[i] = dataList[i]["clusterCode"];
          status[i] = (dataList[i]["status"] ? "running" : "Notrunning");
        }
      
        //results remove 'version' and 'kind' keys and add 'ip' keys
        //and remove managedFields in metadata in items in results
        for (var i = 0; i < dataList.length; i++) {
          delete dataList[i]["id"];
          delete dataList[i]["port"];

          if(dataList[i]["status"] === 1){
            dataList[i]["status"] = "running";
          }
          else {
            dataList[i]["status"] = "Notrunning";
          }
        }
    
        res.status(200).json(
          dataList
        );
    };

    getDataById = async (req, res, next) => {
        let dataList = await ClusterModel.findOne(req.params);
        if (!dataList.length) {
         throw new HttpException(404, "Data not found");
        }

        var http = require("http");
        var urls = [];
        var status = [];
        
        var data = new Object();

        for (var i = 0; i < dataList.length; i++) {
          urls[i] = "http://" + dataList[i]["ip"] + ":" + dataList[i]["port"] + "/kube/api/v1/nodes";
          delete dataList[i]["id"];
          delete dataList[i]["port"];
          status[i] = ((dataList[i]["status"] === 1) ? "running" : "Notrunning");
        }
       
        // multiple requests usings urls array with async-await
        var results = await Promise.all(
          urls.map((url) => {
            return new Promise((resolve, reject) => {
              http
                .get(url, (res) => {
                  res.setEncoding("utf8");
                  let body = "";
    
                  res.on("data", (data) => (body += data));
                  res.on("end", () => resolve(JSON.parse(body)));
                })
                .on("error", (err) => reject(err));
            });
          })
        );

        //results remove 'version' and 'kind' keys and add 'ip' keys
        //and remove managedFields in metadata in items in results
        for (var i = 0; i < results.length; i++) {

          data = dataList;
          delete data[i]["status"]
          data[i]["status"] = status[i];
          data[i]["nodes"] = results[i]["items"];
          
          for (var j = 0; j < results[i]["items"].length; j++) {

            delete results[i]["items"][j]["spec"];

            data[i]["nodes"][j]["nodeName"] = results[i]["items"][j]["metadata"]["name"];
            // Must complete command "kubectl label nodes <nodename> node-role.kubernetes.io/master="" " on kubernetes master nodes
            ((results[i]["items"][j]["metadata"]["labels"]["node-role.kubernetes.io/master"]) === "" ? data[i]["nodes"][j]["type"] = "master" : data[i]["nodes"][j]["type"] = "worker");

            data[i]["nodes"][j]["spec"] = results[i]["items"][j]["status"]["capacity"];
            delete results[i]["items"][j]["metadata"];
            delete results[i]["items"][j]["status"];
            delete data[i]["nodes"][j]["spec"]["ephemeral-storage"];
            delete data[i]["nodes"][j]["spec"]["hugepages-1Gi"];
            delete data[i]["nodes"][j]["spec"]["hugepages-2Mi"];
          }
        }

        res.status(200).json(
          data
        );
    };

    getMonitoringData = async (req, res, next) => {
        let time = "";
        const MetricArray = this.metricParsing(req.query.metric_filter);

        if(req.query.end === undefined && req.query.Timeinterval !== undefined){
          var Timearray = this.createTime(req.query.Timeinterval);
          time = "&start="+ Timearray[0] + "&end=" + Timearray[1];
        } else{
          time = "&start="+ new Date(req.query.start).toISOString() + "&end=" + new Date(req.query.end).toISOString();
        }
        
        let dataList = await ClusterModel.findOne(JSON.parse('{ "clusterCode" : "' + req.query.clusterCode + '" }'));
        if (!dataList.length) {
         throw new HttpException(404, "Data not found");
        }

        var http = require("http");
        var urls = [];
        var data = new Object();

        for (var i = 0; i < dataList.length; i++) {
          for(var j = 0; j < MetricArray.length; j++){
            urls[j] = "http://" + dataList[i]["ip"] + ":" + dataList[i]["port"] + "/monitoring/api/v1/query_range?query="+ nodeMetric["node_"+MetricArray[j]]  + time + "&step=" + req.query.step;
          }
        }
        
        // multiple requests usings urls array with async-await
        var results = await Promise.all(
          urls.map((url) => {
            return new Promise((resolve, reject) => {
              http
                .get(url, (res) => {
                  res.setEncoding("utf8");
                  let body = "";
    
                  res.on("data", (data) => (body += data));
                  res.on("end", () => resolve(JSON.parse(body)));
                })
                .on("error", (err) => reject(err));
            });
          })
        );

        //results remove 'version' and 'kind' keys and add 'ip' keys
        //and remove managedFields in metadata in items in results
        for (var i = 0; i < results.length; i++) {
          
          data = results
          delete data[i]["status"];
          data[i]["data"]["clusterName"] = dataList[0]["clusterName"];
          data[i]["data"]["clusterCode"] = dataList[0]["clusterCode"];
          data[i]["data"]["metricName"] = "node_" + MetricArray[i];
          data[i]["data"]["results"] = results[i]["data"]["result"];
          delete data[i]["data"]["resultType"];
          delete data[i]["data"]["result"];
          
          for (var j = 0; j < data[i]["data"]["results"].length; j++) {
            data[i]["data"]["results"][j]["nodeName"] = data[i]["data"]["results"][j]["metric"]["nodename"];
            if(data[i]["data"]["results"][j]["metric"]["nodename"] === undefined)
            {
              data[i]["data"]["results"][j]["nodeName"] = data[i]["data"]["results"][j]["metric"]["node"];
            }
            data[i]["data"]["results"][j]["Values"] = results[i]["data"]["results"][j]["values"];
            delete results[i]["data"]["results"][j]["values"];
            data[i]["data"]["results"][j]["values"] = data[i]["data"]["results"][j]["Values"];

            for(var k = 0; k < data[i]["data"]["results"][j]["values"].length; k++){
              data[i]["data"]["results"][j]["values"][k][0] = new Date(data[i]["data"]["results"][j]["values"][k][0]*1000).toISOString();
            }
            
            delete data[i]["data"]["results"][j]["Values"];
            delete data[i]["data"]["results"][j]["metric"];
          }
        }

        res.status(200).json(results);
    };

    createCluster = async (req, res, next) => {
      this.checkValidation(req);

      const result = await ClusterModel.create(req.body);
      if (!result) {
          throw new HttpException(409, 'Something went wrong');
      }
      delete req.body.id;
      delete req.body.port;
      delete req.body.status;
      
      res.status(201).send(req.body);
    };
    
    updateCluster = async (req, res, next) => {
      let dataList = await ClusterModel.findOne(req.params);
      if (!dataList.length) {
       throw new HttpException(404, "Data not found");
      };

      let updateReq = req.body;

      if(updateReq.clusterName === undefined) updateReq.clusterName = dataList[0]["clusterName"];
      if(updateReq.ip === undefined) updateReq.ip = dataList[0]["ip"];
      if(updateReq.port === undefined) updateReq.port = dataList[0]["port"];
      if(updateReq.clusterType === undefined) updateReq.clusterType = dataList[0]["clusterType"];

      const result = await ClusterModel.update(updateReq, req.params.clusterCode);

      if (!result) {
        throw new HttpException(409, 'Something went wrong');
      };

      res.status(201).send("Update Success.");
    };

    deleteCluster = async (req, res, next) => {
      const result = await ClusterModel.delete(req.params.clusterCode);

      if (!result) {
        throw new HttpException(409, 'Something went wrong');
      };

      res.status(201).send("Delete Success.");
    };

    checkValidation = (req) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new HttpException(400, 'Validation faild', errors);
      }
    };

    createTime = (Timeinterval) => {
      let Timearray = [];
      let date = new Date();
      let number = Timeinterval;

      number = number.replace(/[^0-9]/g, "");
      switch (Timeinterval) {
        case number + 's':
          Timearray.push(new Date(date.setUTCSeconds(date.getUTCSeconds() - parseInt(number))).toISOString());
          Timearray.push(new Date(date.setUTCSeconds(date.getUTCSeconds() + parseInt(number))).toISOString());
          break;
        case number + 'm':
          Timearray.push(new Date(date.setUTCMinutes(date.getUTCMinutes() - parseInt(number))).toISOString());
          Timearray.push(new Date(date.setUTCMinutes(date.getUTCMinutes() + parseInt(number))).toISOString());
          break;
        case number + 'h':
          Timearray.push(new Date(date.setUTCHours(date.getUTCHours() - parseInt(number))).toISOString());
          Timearray.push(new Date(date.setUTCHours(date.getUTCHours() + parseInt(number))).toISOString());
          break;
        case number + 'd':
          Timearray.push(new Date(date.setUTCDay(date.getUTCDay() - parseInt(number))).toISOString());
          Timearray.push(new Date(date.setUTCDay(date.getUTCDay() + parseInt(number))).toISOString());
          break;        
        case number + 'M':
          Timearray.push(new Date(date.setUTCMonth(date.getUTCMonth() - parseInt(number))).toISOString());
          Timearray.push(new Date(date.setUTCMonth(date.getUTCMonth() + parseInt(number))).toISOString());
          break;
        case number + 'y':
          Timearray.push(new Date(date.setUTCFullYear(date.getUTCFullYear() - parseInt(number))).toISOString());
          Timearray.push(new Date(date.setUTCFullYear(date.getUTCFullYear() + parseInt(number))).toISOString());
          break;
      }

      return Timearray;
    };

    metricParsing = (metric) => {
      var MetricArray = [];
      if(metric === "") {
        var result = Object.keys(nodeMetric);
        for(var i = 0; i < result.length; i++){
          MetricArray[i] = result[i].substring(5);
        }
        return MetricArray;
      }
  
      MetricArray = metric.split("|");
      return MetricArray;
    };
}

/******************************************************************************
 *                               Export
 ******************************************************************************/
module.exports = new ClusterController;

const ServiceModel = require('../models/service.model');
const HttpException = require('../utils/HttpException.utils');
const { podMetric, nodeMetric } = require('../metricList');
const dotenv = require('dotenv');
dotenv.config();

/******************************************************************************
 *                              Service Controller
 ******************************************************************************/
class ServiceController {
  getAllData = async (req, res, next) => {
    let dataList = await ServiceModel.find();

    if (!dataList.length) {
      throw new HttpException(404, "Data not found");
    }

    var http = require("http");
    var data = new Object();
    var podUrls = [];
    var deploymentUrls = [];
    var SqlData = [];
    var factoryCode = [];
    var serviceUrl = [];
    var endpoint = [];
    var protocol;
    var nodePort;
    var packageData = [];

    var podSql = [];

    for (var i = 0; i < dataList.length; i++) {
      podUrls[i] ="http://" + dataList[i]["ip"] + ":" + dataList[i]["port"] + "/kube/api/v1/pods?labelSelector=service=fems";
      deploymentUrls[i] ="http://" + dataList[i]["ip"] + ":" + dataList[i]["port"] + "/kube/apis/apps/v1/deployments?labelSelector=service=fems";
      SqlData[i] = {ip: dataList[i]["ip"], clusterCode: dataList[i]["clusterCode"], clusterType: dataList[i]["clusterType"]}
    }

    // 중복 URL 제거
    podUrls = new Set(podUrls);
    podUrls = [...podUrls];

    deploymentUrls = new Set(deploymentUrls);
    deploymentUrls = [...deploymentUrls];

    const FSqlData = SqlData.filter((data2, index, result)=>{
      return result.findIndex((data1) => data1.ip === data2.ip) === index;
    });

    // multiple requests usings urls array with async-await
    var results = await Promise.all(
      podUrls.map((url) => {
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

    var deployResults = await Promise.all(
      deploymentUrls.map((url) => {
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
    for (var i = 0; i < deployResults.length; i++) {
      data = deployResults

      data[i]["clusterCode"] = FSqlData[i]["clusterCode"];
      data[i]["clusterType"] = FSqlData[i]["clusterType"];
      data[i]["ip"] = FSqlData[i]["ip"];
      data[i]["serviceList"] = [];

      delete deployResults[i]["apiVersion"];
      delete deployResults[i]["version"];
      delete deployResults[i]["kind"];
      delete deployResults[i]["metadata"];

      // service and pod information input
      for (var j = 0; j < deployResults[i]["items"].length; j++) {
        // kubernetes service and pod connection and bring information
        serviceUrl.push("http://" + dataList[i]["ip"] + ":" + dataList[i]["port"] + "/kube/api/v1/namespaces/" + deployResults[i]["items"][j]["metadata"]["namespace"] +"/services?labelSelector=service=fems");
        podSql.push("http://" + dataList[i]["ip"] + ":" + dataList[i]["port"] + "/kube/api/v1/namespaces/"+ deployResults[i]["items"][j]["metadata"]["namespace"] +"/pods?labelSelector=service=fems" );

        var serviceResult = await Promise.all(
          serviceUrl.map((url) => {
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

        var results3 = await Promise.all(
          podSql.map((url) => {
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

        // service와 pod 비교해서 (protocol + nodePort) => endpoint 생성
        for(var k = 0; k < serviceResult[i]["items"].length; k++){
          for(var g = 0; g < results3[i]["items"].length; g++){
            if(results3[i]["items"][g] !== undefined) {
              var count = 0;

              var serviceData = serviceResult[i]["items"][k]["spec"]["selector"];
              var podData = results3[i]["items"][g]["metadata"]["labels"];

              var serviceEntries = Object.entries(serviceData)
              var podEntries = Object.entries(podData)
              var podLabel = podEntries.map((x) => x = x[0] + ":" + x[1]);
              var serviceSelector = serviceEntries.map((x) => x = x[0] + ":" + x[1]);

              for(var q = 0; q < podLabel.length; q++){
                for(var w = 0; w < serviceSelector.length; w++){
                  if(podLabel[q] === serviceSelector[w]){
                    count++;
                    if(count === serviceSelector.length)
                    {
                      nodePort = serviceResult[i]["items"][k]["spec"]["ports"][0]["nodePort"]
                      if(nodePort === undefined){
                        nodePort = serviceResult[i]["items"][k]["spec"]["ports"][0]["port"]
                      }
                    }
                  } 
                }
              }

              if(count === serviceSelector.length){
                // if subnet name is null, set protocol is http
                if(!serviceResult[i]["items"][k]["spec"]["ports"][0]["name"])
                {
                  protocol = "http";
                } else {
                  protocol = serviceResult[i]["items"][k]["spec"]["ports"][0]["name"];
                }
                endpoint.push(protocol + "://" + podUrls[i].split("/")[2].split(":")[0] + ":" + nodePort);
              }
            }
          }
        }

        // 패키지 및 pod의 정보 생성
        for(var g = 0; g < results3[i]["items"].length; g++){
          var count = 0;

          var deployData = deployResults[i]["items"][j]["spec"]["template"]["metadata"]["labels"];
          var podData = results3[i]["items"][g]["metadata"]["labels"];

          var deployEntries = Object.entries(deployData)
          var podEntries = Object.entries(podData)
          var podLabel = podEntries.map((x) => x = x[0] + ":" + x[1]);
          var deploySelector = deployEntries.map((x) => x = x[0] + ":" + x[1]);

          for(var q = 0; q < podLabel.length; q++){
            for(var w = 0; w < deploySelector.length; w++){
              if(podLabel[q] === deploySelector[w]){
                count++;
                if(count === deploySelector.length)
                {
                  packageData.push({
                    "packageName" : deployResults[i]["items"][j]["metadata"]["name"],
                    "factoryCode" : ((deployResults[i]["items"][j]["metadata"]["labels"]["site"])?.toUpperCase())?.replace('-', '.'),
                    "version" : deployResults[i]["items"][j]["metadata"]["labels"]["version"],
                    "serviceUrl": endpoint[g],
                    "pods":[
                      {
                        "podName": results3[i]["items"][g]["metadata"]["name"],
                        "namespace": results3[i]["items"][g]["metadata"]["namespace"],
                        "status": results3[i]["items"][g]["status"]["phase"]
                      }
                    ]
                  });
                }
              } 
            }
          }
        }

        // pod 정보가 없는 경우 
        if(packageData.length === 0){
          data[i]["serviceList"].push(
            {
              "services":
              [
                {
                  "packageName" : deployResults[i]["items"][j]["metadata"]["name"],
                  "factoryCode" : ((deployResults[i]["items"][j]["metadata"]["labels"]["site"])?.toUpperCase())?.replace('-', '.'),
                  "version" : deployResults[i]["items"][j]["metadata"]["labels"]["version"],
                  "serviceUrl": "",
                  "pods":[]
                }
              ]
            }
          )
        }

        // pod 정보가 있는 경우
        for(var k = 0; k < packageData.length; k++){
          if(factoryCode.indexOf(((deployResults[i]["items"][j]["metadata"]["labels"]["site"])?.toUpperCase())?.replace('-', '.')) < 0){
            factoryCode.push(((deployResults[i]["items"][j]["metadata"]["labels"]["site"])?.toUpperCase())?.replace('-', '.'));

            var data1 = {
              "services":
              [
                packageData[k]
              ]
            }
            data[i]["serviceList"].push(data1);
          }
          else {
            for(var t = 0; t < data[i]["serviceList"].length; t++){
              if(data[i]["serviceList"][t]["services"][0]["factoryCode"] === ((deployResults[i]["items"][j]["metadata"]["labels"]["site"])?.toUpperCase())?.replace('-', '.')) {
                var data2 = packageData[k]
                data[i]["serviceList"][t]["services"].push(data2);
              }
            }
          }
        }

      packageData = [];
      podSql = [];
      serviceUrl = [];
      endpoint = [];
    }

      // 하드코딩
      if(serviceStatus === 1 && data[i]["clusterCode"] === "KDEMO.CLOUD"){
        data[i]["serviceList"].push({
          "services": [
            {
              "packageName": "fems-basic",
              "version": "v0.1.0",
              "factoryCode": "KDEMO.SQI01",
              "serviceUrl": "http://fems.101.79.1.134.nip.io:32320/login?WY000",
              "pods": [
                {
                  "podName": "fems-basic-test-55cbf75486-pbx2d",
                  "namespace": "inno-test",
                  "status": "Running"
                }
              ]
            }
          ]
        })
      }

      factoryCode = [];
      delete deployResults[i]["items"];
    }
    res.status(200).json(data);
  };

  getDataById = async (req, res, next)  => {
    let dataList = await ServiceModel.find();

    if (!dataList.length) {
      throw new HttpException(404, "Data not found");
    }

    var http = require("http");
    var data = new Object();
    var urls = [];

    for (var i = 0; i < dataList.length; i++) {
      urls[i] ="http://" + dataList[i]["ip"] + ":" + dataList[i]["port"] + "/kube/api/v1/pods?labelSelector=service=fems";
    }

    // 중복 URL 제거
    urls = new Set(urls);
    urls = [...urls]


    // multiple requests usings urls array with async-await
    var results = (await Promise.all(
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
    ));


    //results remove 'version' and 'kind' keys and add 'ip' keys
    //and remove managedFields in metadata in items in results
    for (var i = 0; i < results.length; i++) {
      for (var j = 0; j < results[i]["items"].length; j++) {
        if(results[i]["items"][j]["metadata"]["name"] === req.params.service_id){
          data = results

          data[i]["clusterCode"] = dataList[i]["clusterCode"];
          data[i]["ip"] = urls[i].split("/")[2].split(":")[0];
    
          delete results[i]["apiVersion"];
          delete results[i]["version"];
          delete results[i]["kind"];
          delete results[i]["metadata"];

          var serviceUrl = [];
          var podData = "";
          var servicedata = "";
          var protocol = "";
          var endpoint = "";
          var nodePort = "";

          serviceUrl.push("http://" + dataList[i]["ip"] + ":" + dataList[i]["port"] + "/kube/api/v1/namespaces/" + results[i]["items"][j]["metadata"]["namespace"] +"/services");

          var serviceResult = await Promise.all(
              serviceUrl.map((url) => {
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

          for(var k = 0; k < serviceResult[i]["items"].length; k++){
            var count = 0;
            podData = results[i]["items"][j]["metadata"]["labels"];
            servicedata = serviceResult[i]["items"][k]["spec"]["selector"];

            
            var podEntries = Object.entries(podData);
            var serviceEntries = Object.entries(servicedata);
            var podLabel = podEntries.map((x) => x = x[0] + ":" + x[1]);
            var serviceSelector = serviceEntries.map((x) => x = x[0] + ":" + x[1]);

            for(var q = 0; q < podLabel.length; q++){
              for(var w = 0; w < serviceSelector.length; w++){
                if(podLabel[q] === serviceSelector[w]){
                  count++;
                  if(count === serviceSelector.length)
                  {
                    //serviceName = serviceResult[i]["items"][k]["metadata"]["name"];
                    nodePort = serviceResult[i]["items"][k]["spec"]["ports"][0]["nodePort"];
                    if(nodePort === undefined){
                      nodePort = serviceResult[i]["items"][k]["spec"]["ports"][0]["port"]
                    }
                  }
                } 
              }
            }

            if(count === serviceSelector.length){
              // if subnet name is null, set protocol is http
              if(!serviceResult[i]["items"][k]["spec"]["ports"][0]["name"])
              {
                protocol = "http";
              } else {
                protocol = "https";
              }
              endpoint = protocol + "://" + dataList[i]["ip"] + ":" + nodePort;
            }
          }

          data[i]["packages"] = {
            "packageName": results[i]["items"][j]["metadata"]["labels"]["app"],
            // "serviceName": results[i]["items"][j]["metadata"]["labels"]["service"],
            "version": results[i]["items"][j]["metadata"]["labels"]["version"],
            "factoryCode":((results[i]["items"][j]["metadata"]["labels"]["site"])?.toUpperCase())?.replace('-', '.'),
            "serviceUrl": endpoint
          }
          // data[i]["packages"]["version"] = "1.0.0";
          // if version is not exist, set version 1.0.0
          if(!data[i]["packages"]["version"]){
              data[i]["packages"]["version"] = "0.0.0";
          }
          data[i]["packages"]["metadata"] = results[i]["items"][j]["metadata"];

          delete data[i]["packages"]["metadata"];

          data[i]["packages"]["pods"] = {
            "podName": results[i]["items"][j]["metadata"]["name"],
            "namespace": results[i]["items"][j]["metadata"]["namespace"],
            "creationTimestamp": results[i]["items"][j]["metadata"]["creationTimestamp"]
          };

          delete results[i]["items"][j]["metadata"];
          delete results[i]["items"][j]["spec"];

          data[i]["packages"]["status"] = {
            "phase": results[i]["items"][j]["status"]["phase"],
            "hostIP": results[i]["items"][j]["status"]["hostIP"],
            "podIP": results[i]["items"][j]["status"]["podIP"],
            "images": results[i]["items"][j]["status"]["containerStatuses"][0]["image"]
          }
        }
        else{
          delete results[i]["items"][j];
        }
      }
    }

    delete data[0]["items"];
    res.status(200).json(data);
  };

  getMonitoringData = async (req, res, next) => {
    let time = "";
    const MetricArray = this.metricParsing(req.query.metric_filter);

    if((req.query.start === undefined || req.query.end === undefined) && req.query.Timeinterval !== undefined){
      var Timearray = this.createTime(req.query.Timeinterval);
      time = "&start="+ Timearray[0] + "&end=" + Timearray[1];
    } else{
      time = "&start="+ new Date(req.query.start).toISOString() + "&end=" + new Date(req.query.end).toISOString();
    }
    
    let dataList = await ServiceModel.findOne(JSON.parse('{ "clusterCode" : "' + req.query.clusterCode + '" }'));
    if (!dataList.length) {
     throw new HttpException(404, "Data not found");
    }

    var http = require("http");
    var urls = [];
    var urls2 = [];
    var podData = [];
    var data = new Object();
    var data2 = new Object();
    var limitStatus = 0;
    var limitData = "";

    for (var i = 0; i < dataList.length; i++) {
      for(var j = 0; j < MetricArray.length; j++){
        urls[j] = "http://" + dataList[i]["ip"] + ":" + dataList[i]["port"] + "/monitoring/api/v1/query_range?query="+ podMetric["pod_" + MetricArray[j]].split('.$1').join(req.query.podname) + time + "&step=" + req.query.step;
      }
      urls2[i] = "http://" + dataList[i]["ip"] + ":" + dataList[i]["port"] + "/kube/api/v1/pods?labelSelector=service=fems";
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

    var serviceResult = await Promise.all(
      urls2.map((url) => {
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
    for(var i = 0; i < serviceResult.length; i++){
      for(var j = 0; j < serviceResult[i]["items"].length; j++){
        if(serviceResult[i]["items"][j]["metadata"]["name"] === req.query.podname){
          if(serviceResult[i]["items"][j]["spec"]["containers"][0]["resources"]["limits"] === undefined){
            limitStatus = 0;
          }
          else{
            limitStatus = 1;
            limitData = serviceResult[i]["items"][j]["spec"]["containers"][0]["resources"];
          }
        }
      }
    }

    for (var k = 0; k < serviceResult.length; k++) {
      for (var l = 0; l < serviceResult[k]["items"].length; l++) {
        data2 = serviceResult[k]["items"][l]["metadata"]; 
        data2["nodeName"] = serviceResult[k]["items"][l]["spec"]["nodeName"];       
        delete serviceResult[k]["items"][l]["metadata"]["ownerReferences"];        
        delete serviceResult[k]["items"][l]["metadata"]["managedFields"];        
        delete serviceResult[k]["items"][l]["metadata"]["annotations"];        
        delete serviceResult[k]["items"][l]["metadata"]["generateName"];
        delete serviceResult[k]["items"][l]["metadata"]["namespace"];        
        delete serviceResult[k]["items"][l]["metadata"]["uid"];        
        delete serviceResult[k]["items"][l]["metadata"]["resourceVersion"];
        delete serviceResult[k]["items"][l]["metadata"]["creationTimestamp"];

        podData.push(data2);
      }
    }

    //results remove 'version' and 'kind' keys and add 'ip' keys
    //and remove managedFields in metadata in items in results
    for (var i = 0; i < results.length; i++) {
      
      data = results
      delete data[i]["status"];
      data[i]["data"]["clusterName"] = dataList[0]["clusterName"];
      data[i]["data"]["clusterCode"] = dataList[0]["clusterCode"];
      data[i]["data"]["metricName"] = "pod_" + MetricArray[i];
      data[i]["data"]["results"] = results[i]["data"]["result"];
      delete data[i]["data"]["resultType"];
      delete data[i]["data"]["result"];
      
      for (var j = 0; j < data[i]["data"]["results"].length; j++) {
        for(var h = 0; h < podData.length; h++){
          if(podData[h]["name"] === data[i]["data"]["results"][j]["metric"]["pod"]){
            data[i]["data"]["results"][j]["nodeName"] = podData[h]["nodeName"];
          }
        }

        data[i]["data"]["results"][j]["podName"] = data[i]["data"]["results"][j]["metric"]["pod"];         
        data[i]["data"]["results"][j]["namespace"] = data[i]["data"]["results"][j]["metric"]["namespace"];

        for(var h = 0; h < podData.length; h++){
          if(podData[h]["name"] === data[i]["data"]["results"][j]["podName"]){
            data[i]["data"]["results"][j]["factoryCode"] = ((podData[h]["labels"]["site"])?.toUpperCase())?.replace('-', '.');
            data[i]["data"]["results"][j]["packageName"] = podData[h]["labels"]["app"];
          }
        }

        data[i]["data"]["results"][j]["Values"] = results[i]["data"]["results"][j]["values"];
        delete results[i]["data"]["results"][j]["values"];
        data[i]["data"]["results"][j]["values"] = data[i]["data"]["results"][j]["Values"];

        if(data[i]["data"]["metricName"] === "pod_memory_util" || data[i]["data"]["metricName"] === "pod_memory_total"){
          if(limitStatus === 0){
            for(var k = 0; k < data[i]["data"]["results"][j]["Values"].length; k++){
              data[i]["data"]["results"][j]["Values"][k][0] = new Date(data[i]["data"]["results"][j]["Values"][k][0]*1000).toISOString();
              data[i]["data"]["results"][j]["Values"][k][1] = '0';
            }
          }
          else if(limitStatus === 1){
            for(var k = 0; k < data[i]["data"]["results"][j]["Values"].length; k++){
              data[i]["data"]["results"][j]["Values"][k][0] = new Date(data[i]["data"]["results"][j]["Values"][k][0]*1000).toISOString();
              data[i]["data"]["results"][j]["Values"][k][1] = '0';
            }
          }
        }

        else{
          for(var k = 0; k < data[i]["data"]["results"][j]["Values"].length; k++){
            data[i]["data"]["results"][j]["Values"][k][0] = new Date(data[i]["data"]["results"][j]["Values"][k][0]*1000).toISOString();
          }
        }

        delete data[i]["data"]["results"][j]["metric"];
        delete data[i]["data"]["results"][j]["Values"];
      }
    }

    res.status(200).json(data);
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
      var result = Object.keys(podMetric);
      for(var i = 0; i < result.length; i++){
        MetricArray[i] = (result[i].split("pod_"))[1];
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
module.exports = new ServiceController;

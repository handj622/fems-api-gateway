const PackageModel = require('../models/package.model');
const HttpException = require('../utils/HttpException.utils');
const dotenv = require('dotenv');
const request = require('request');
const yaml = require('js-yaml');

dotenv.config();

global.serviceStatus = 0;

/******************************************************************************
 *                              Package Controller
 ******************************************************************************/
class PackageController {
  getAllData = async (req, res, next) => {
    var https = require("https");
    var packageData = [];
    var packageVersion = [];
    var versionUrl = [];
    var versionData = [];
    
    var options = [
      'https://registry.fems.cf/api/v2.0/projects/fems/repositories?page=1&page_size=10'
    ];

    var results = await Promise.all(
      options.map((url) => {
        return new Promise((resolve, reject) => {
          https
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

    for(var j = 0; j < results[0].length; j++){
      versionUrl.push("https://registry.fems.cf/api/v2.0/projects/fems/repositories/" + results[0][j]["name"].split('/')[1] + '/artifacts');
    }

    var results2 = await Promise.all(
      versionUrl.map((url) => {
        return new Promise((resolve, reject) => {
          https
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

    for(var c = 0; c < results2.length; c++){
      for(var C = 0; C < results2[c].length; C++){
        versionData.push(
          {
            "id" : results2[c][C]["tags"][0]["repository_id"],
            "version": results2[c][C]["tags"][0]["name"]
          }
        )
      }
    }
    
    for(var j = 0; j < results[0].length; j++){
      for(var g = 0; g < versionData.length; g++){
        if(versionData[g]["id"] === results[0][j]["id"]){
          packageVersion.push(versionData[g]["version"]);
        }
      }
      packageData[j] = 
      {
        "id": results[0][j]["id"],
        "packageName": results[0][j]["name"].split('/')[1],
        "version": packageVersion
      };

      packageVersion = [];
    }

    res.status(200).json({"packages": packageData});
  };
  getPackageValue = async(req, res, next) => {
    var https = require("https");
    var repositoryName = req.query.repositoryName;
    var tag = req.query.tag;
    
    var options = [
      'https://registry.fems.cf/api/v2.0/projects/fems/repositories/'+repositoryName+'/artifacts/'+tag+'/additions/values.yaml'
    ];

    var results = await Promise.all(
      options.map((url) => {
        return new Promise((resolve, reject) => {
          https
            .get(url, (res) => {
              res.setEncoding("utf8");
              let body = "";

              res.on("data", (data) => (body += data));
              res.on("end", () => resolve(yaml.load(body)));
            })
            .on("error", (err) => reject(err));
        });
      })
    )

    res.status(200).send(results);
  };
  deployPackage = async (req, res, next) => {
    let dataList = await PackageModel.findOne(req.query);

    if (!dataList.length) {
      throw new HttpException(404, "Data not found");
    }

    function replaceAll(str, searchStr, replaceStr) {
      return str.split(searchStr).join(replaceStr);
    }

    req.body.namespace = req.body.packageName + "-" + replaceAll(((req.body.factoryCode).toLowerCase()), '.', '-');
    req.body.option = req.query;
    
    await request.post({
      headers: {'content-type': 'application/json'},
      url: "http://" + dataList[0]["ip"]+":"+dataList[0]["port"]+"/helm",
      body: req.body,
      json: true
    }, function(error, response, body){
      res.status(200).send("Deploy Message : " + body.code)
    });
  };
}

/******************************************************************************
 *                               Export
 ******************************************************************************/
module.exports = new PackageController;

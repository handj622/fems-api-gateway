class AutoUpdateDB {
    getAllData = async (model) => {
        let dataList;
        dataList = await model.find();
    
        if (!dataList.length) {
          console.log("dataList nothin...");
        }
    
        var http = require("http");
        var urls = [];
    
        for (var i = 0; i < dataList.length; i++) {
          urls[i] = "http://" + dataList[i]["ip"] + ":" + dataList[i]["port"] + "/kube/api/v1/nodes";
        }

        urls = new Set(urls);
        urls = [...urls]

        // multiple requests usings urls array with async-await
        urls.map((url) => {
            return new Promise((resolve, reject) => {
                http
                .get(url, (res) => {
                    res.setEncoding("utf8");
                    let body = "";
    
                    res.on("data", (data) => (body += data));
                    res.on("end", () => resolve(JSON.parse(body)));

                    var URL = url.split("/")[2].split(":")[0];
                    model.UpdateRunning(URL);
                })
                .on("error", (err) => 
                {
                    var URL = url.split("/")[2].split(":")[0];
                    model.UpdateNotRunning(URL);
                });
            });
        })
    };
}

module.exports = new AutoUpdateDB();
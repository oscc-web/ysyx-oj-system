const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
const formidable = require("formidable");

const json = require("../models/json.js");

const {
    uploadDir,
    logLoginPath,
    rootDir
} = require("../config/config.js");

let logLoginWriteStream = fs.createWriteStream(logLoginPath, { flags: "a" });

function getIPAddress(req) {
    let ip = req.headers["x-real-ip"] ||
                         req.headers["x-forwarded-for"] ||
                         req.connection.remoteAddres ||
                         req.socket.remoteAddress ||
                         "";
    return ip;
}

function splitCookieToArr(cookie) {
    let cookieArr = [];
    if (cookie) {
        cookieArr = cookie.split(";");
    }
    return cookieArr;
}

function splitCookieToKeyValue(cookie) {
    let cookieObj = {};
    if (cookie) {
        let cookieArr = cookie.trim().split("=");
        const cookieKey = cookieArr[0];
        const cookieVal = cookieArr[1];
        cookieObj = {
            cookieKey,
            cookieVal
        }
    }
    return cookieObj;
}

function splitParamToKeyValue(param) {
    let paramObj = {};
    let paramArr = [];
    if (param) {
        paramArr = param.split("&");
    }
    for (let i = 0; i < paramArr.length; i++) {
        let paramArrTemp = paramArr[i].split("=");
        if (paramArrTemp.length == 2) {
            const paramKey = paramArrTemp[0];
            const paramVal = paramArrTemp[1];
            paramObj[paramKey] = paramVal;
        }
    }

    return paramObj;
}

module.exports = {
    verifyCookie: (cookie) => {
        const cookieArr = splitCookieToArr(cookie);

        for (let index = cookieArr.length; index >= 0; index--) {
            const item = cookieArr[index];
            const { cookieKey, cookieVal } = splitCookieToKeyValue(item);

            if (cookieKey === systemUser && cookieVal === systemPassword) {
                return true;
            }
        }

        return false;
    },
    verifyUserInfo: (req, res) => {
        let clientIPAddress = getIPAddress(req);
        console.log("登录地址：", clientIPAddress);
        logLoginWriteStream.write("登录地址：" + clientIPAddress + "\n");

        let dataStr = "";
        req.on("data", (data) => {
            dataStr += data;
        });
        req.on("end", () => {
            let dataObj = {};
            try {
                dataObj = JSON.parse(dataStr);
                console.log("验证数据：", dataObj);
                logLoginWriteStream.write("验证数据：" +
                                          JSON.stringify(dataObj) + "\n");
            }
            catch (e) {
                console.log(e);
            }

            res.writeHead(200, {
                "content-Type": "text/plain;charset=utf-8"
            });

            const loginDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
            console.log("登录时间：", loginDate);
            logLoginWriteStream.write("登录时间：" + loginDate + "\n");

            console.log("用户账号：", dataObj.userAccount);
            logLoginWriteStream.write("用户账号：" + dataObj.userAccount + "\n");

            let userArr = json.getJSONDataByField(
                path.join(rootDir, "jsons/user.json"),
                "equal",
                "userAccount",
                dataObj.userAccount);
            console.log(userArr);

            if (userArr.length === 1 &&
                userArr[0].userPassword === dataObj.userPassword) {
                console.log("验证成功");
                logLoginWriteStream.write("验证成功\n\n");

                // 设置Cookie过期时间为2小时
                res.writeHead(200, {
                    "Set-Cookie": dataObj.userAccount + "=" +
                                  dataObj.userPassword + ";" +
                                 "path=/;expires=" +
                                  new Date(Date.now() + 1000 * 60 * 60 * 2).toGMTString()
                });
                res.end(JSON.stringify({
                    msg: "success",
                    data: userArr[0]
                }));
            }
            else {
                console.log("用户密码：", dataObj.userPassword)
                logLoginWriteStream.write("用户密码：" + dataObj.userPassword + "\n");

                console.log("验证失败\n");
                logLoginWriteStream.write("验证失败\n\n");

                res.end(JSON.stringify({
                    msg: "error",
                    data: {}
                }));
            }
        });
    },
    getSubmitTableData: (req, res) => {
        let dataStr = "";
        req.on("data", (data) => {
            dataStr += data;
        });
        req.on("end", () => {
            let dataObj = {};
            try {
                dataObj = splitParamToKeyValue(dataStr);
            }
            catch (e) {
                console.log(e);
            }
            console.log(dataObj);

            res.writeHead(200, {
                "content-Type": "text/plain;charset=utf-8"
            });

            let submitArr = json.getJSONDataByField(
                path.join(rootDir, "jsons/submit.json"),
                "equal",
                "userId",
                dataObj.userId);
            submitArr = json.getJSONDataByOrder(submitArr,
                                               "submitDate",
                                               "date",
                                               "desc");
            for (let i = 0; i < submitArr.length; i++) {
                let submitObj = submitArr[i];

                let userArr = json.getJSONDataByField(
                    path.join(rootDir, "jsons/user.json"),
                    "equal",
                    "id",
                    submitObj.userId);
                if (userArr.length > 0) {
                    Object.assign(submitObj, submitObj, userArr[0]);
                }

                let problemArr = json.getJSONDataByField(
                    path.join(rootDir, "jsons/problem.json"),
                    "equal",
                    "id",
                    submitObj.problemId);
                if (problemArr.length > 0) {
                    Object.assign(submitObj, submitObj, problemArr[0]);
                }
            }
            submitArr = json.getJSONDataByPage(submitArr,
                                               dataObj.page,
                                               dataObj.limit);
            console.log(submitArr);

            if (submitArr.length > 0) {
                res.end(JSON.stringify({
                    code: 0,
                    msg: "获得相关数据",
                    count: submitArr.length,
                    data: submitArr
                }));
            }
            else {
                res.end(JSON.stringify({
                    code: 1,
                    msg: "暂无相关数据",
                    count: 0,
                    data: []
                }));
            }
        });
    },


    getFileInfo: (req, res) => {
        console.log("\n获取文件");

        fs.readdir(uploadDir, (err, data) => {
            let ret = [];
            for (let file of data) {
                let fileStat = fs.statSync(uploadDir + file);
                console.log("文件名称：", file);
                console.log("文件信息：", fileStat);
                ret.push({
                    src: file,
                    size: fileStat.size,
                    mtimeMs: new Date(fileStat.mtime).getTime()
                });
            }
            res.end(JSON.stringify(ret));
        });
    },
    uploadFile: (req, res) => {
        console.log("\n上传文件");

        var form = new formidable.IncomingForm();
        form.uploadDir = uploadDir;          // 设置文件上传目录
        form.multiples = true;               // 设置多文件上传
        form.keepExtensions = true;          // 保持原有扩展名
        form.maxFileSize = 10 * 1024 * 1024; // 设置文件大小为10MB

        form.on("error", (err) => {
            console.log("上传失败，文件大小超过10MB");
            res.writeHead(400, { "content-type": "text/html;charset=utf-8" });
            res.end("上传失败，文件大小超过10MB");
        });

        form.parse(req, (err, fields, files) => {
            if (err) {
                console.log("上传失败，表单解析错误");
                res.writeHead(500, { "content-type": "text/html;charset=utf-8" });
                res.end("上传失败，表单解析错误");
                return;
            }

            if (Object.prototype.toString.call(files.uploadFile) ===
              "[object Object]") {
                files.uploadFile = [files.uploadFile];
            }

            let errMsg = ""
            for (let file of files.uploadFile) {
                var fileName = file.name;

                console.log("文件名称: ", fileName);

                var suffix = fileName.slice(fileName.lastIndexOf("."));

                var fileOldPath = file.path;
                var fileNewPath = uploadDir + fileName;

                if (fields.allowCoverage !== "true") {
                    if (fs.existsSync(fileNewPath)) {
                        fileNewPath = fileNewPath + "-" + Date.now() + suffix;
                    }
                }

                fs.rename(fileOldPath, fileNewPath, function(err) {
                    if (err) {
                        errMsg = "上传失败";
                        console.log("上传失败，文件重命名异常");
                    }
                });
            }

            if (errMsg !== "") {
                errMsg = "上传失败，文件重命名异常";
            }
            res.end(errMsg);
        });
    },
    deleteFile: (req, res) => {
        console.log("\n删除文件");
        let url = decodeURI(req.url);
        let fileName = url.slice(url.indexOf("?") + 1);
        console.log("删除文件: ", fileName)

        fs.unlink(uploadDir + fileName, (err) => {
            if (err) {
                console.log(err);
                res.end("删除失败：" + JSON.stringify(err));
                return;
            }
            res.end();
        });
    },

}

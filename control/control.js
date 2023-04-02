const { exec, execSync, spawnSync } = require("child_process");
const fs = require("fs");

const path = require("path");
const dayjs = require("dayjs");
const formidable = require("formidable");
const { v4: uuidv4 } = require("uuid");

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
    getProblemData: (req, res) => {
        req.on("data", (data) => {
        });
        req.on("end", () => {
            res.writeHead(200, {
                "content-Type": "text/plain;charset=utf-8"
            });

            let problemArr = json.getJSONDataByOrder(
                path.join(rootDir, "jsons/problem.json"),
                "problemNo",
                "val",
                "asc");
            console.log(problemArr);

            if (problemArr.length > 0) {
                res.end(JSON.stringify({
                    msg: "success",
                    data: problemArr
                }));
            }
            else {
                res.end(JSON.stringify({
                    msg: "error",
                    data: []
                }));
            }
        });
    },
    judgeProblemAnswerIsRight:(req, res) => {
        let dataStr = "";
        req.on("data", (data) => {
            dataStr += data;
        });
        req.on("end", () => {
            let dataObj = {};
            try {
                dataObj = JSON.parse(dataStr);
            }
            catch (e) {
                console.log(e);
            }
            console.log(dataObj);

            const fileDir = path.join(uploadDir, dataObj.userId + "/");
            const filePath = path.join(fileDir, dataObj.fileName);
            const fileBin = path.join(fileDir, "a.out");

            const args =
                "-O2 -Wall -Werror " +
                "-o " + fileBin + " " +
                filePath;

            // exec("gcc " + args, (errBuild, stdoutBuild, stderrBuild) => {
            //     console.log("编译标准输出：", stdoutBuild)
            //     if (errBuild) {
            //         // console.log("编译异常错误：", errBuild);
            //         console.log("编译标准错误：", stderrBuild);
            //     }
            //     else {
            //         exec(fileBin, (errExec, stdoutExec, stderrExec) => {
            //             console.log("执行标准输出：", stdoutExec);
            //             if (errExec) {
            //                 // console.log("执行异常错误：", errExec);
            //                 console.log("执行标准错误：", stderrExec);
            //             }
            //         });
            //     }
            // });

            const resBuild = spawnSync("gcc", args.split(" "));
            let stdoutBuild = resBuild.stdout.toString();
            let stderrBuild = resBuild.stderr.toString();
            let stdoutExec = "";
            let stderrExec = "";
            console.log("编译标准输出：", stdoutBuild);
            console.log("编译错误输出：", stderrBuild);
            if (stderrBuild === "") {
                const resExec = spawnSync(fileBin);
                stdoutExec = resExec.stdout.toString();
                stderrExec = resExec.stderr.toString();
                console.log("执行标准输出：", stdoutExec);
                console.log("执行错误输出：", stderrExec);
            }

            let problemTestcase = "";
            const problemArr = json.getJSONDataByField(
                path.join(rootDir, "jsons/problem.json"),
                "equal",
                "id",
                dataObj.problemId);
            if (problemArr.length > 0) {
                const problemObj = problemArr[0];
                problemTestcase = problemObj.problemTestcase;
            }
            console.log("测试用例输出：", problemTestcase);
            let submitStatus = "未通过";
            let submitInfo = "";
            if (stderrBuild === "" &&
                stdoutExec === problemTestcase) {
                submitStatus = "已通过";
            }
            console.log("判题状态输出：", submitStatus);
            console.log();

            if (stderrBuild !== "") {
                submitInfo = stderrBuild;
            }
            else if (stderrExec !== "") {
                submitInfo = stderrExec;
            }

            json.addJSONDataToBack(
                path.join(rootDir, "jsons/submit.json"), {
                    id: uuidv4(),
                    userId: dataObj.userId,
                    problemId: dataObj.problemId,
                    submitStatus: submitStatus,
                    submitDate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                    submitInfo: submitInfo
                });

            res.end("success");
        });
    },
    uploadFileToServer: (req, res) => {
        var form = new formidable.IncomingForm();
        form.uploadDir = uploadDir;      // 设置文件上传目录
        form.multiples = true;               // 设置多文件上传
        form.keepExtensions = true;          // 保持原有扩展名
        form.maxFileSize = 10 * 1024 * 1024; // 设置文件大小为10MB

        form.on("error", (err) => {
            res.writeHead(400, { "content-type": "text/html;charset=utf-8" });
            res.end("errorMaxSize");
            res.end(JSON.stringify({
                code: 1,
                msg: "errorMaxSize",
                data: {}
            }));
            return;
        });

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(500, { "content-type": "text/html;charset=utf-8" });
                res.end(JSON.stringify({
                    code: 1,
                    msg: "errorAnalysis",
                    data: {}
                }));
                return;
            }

            if (Object.prototype.toString.call(files.upload) ===
                "[object Object]") {
                files.upload = [files.upload];
            }

            var fileNameNewArr = [];
            for (let file of files.upload) {
                var fileNameOld = file.name;
                console.log("文件名称: ", fileNameOld);

                var suffix = fileNameOld.slice(fileNameOld.lastIndexOf("."));
                var prefix = fileNameOld.slice(0, fileNameOld.lastIndexOf("."));

                var filePathOld = file.path;
                var fileNameNew = prefix + "-" +
                                  dayjs().format("YYYY-MM-DD-HH-mm-ss") + suffix;
                var uploadDirNew = uploadDir;
                fileNameNewArr.push(fileNameNew);
                if (fields.dir !== undefined) {
                    uploadDirNew = path.join(uploadDir, fields.dir + "/");
                }
                var filePathNew = uploadDirNew + fileNameNew;

                fs.rename(filePathOld, filePathNew, function(err) {
                    if (err) {
                        res.end(JSON.stringify({
                            code: 1,
                            msg: "errorRename",
                            data: {}
                        }));
                        return;
                    }
                });
            }

            res.end(JSON.stringify({
                code: 0,
                msg: "success",
                data: {
                    fileNameNew: fileNameNewArr
                }
            }));
        });
    }
}

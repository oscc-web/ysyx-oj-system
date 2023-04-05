const { spawnSync } = require("child_process");
const fs = require("fs");

const path = require("path");
const dayjs = require("dayjs");
const formidable = require("formidable");
const { v4: uuidv4 } = require("uuid");

const json = require("../models/json.js");

const {
    uploadDir,
    dbDir,
    logLoginPath
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

function judgeProblem(req, res) {
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
            path.join(dbDir, "problem.json"),
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
            path.join(dbDir, "submit.json"), {
                id: uuidv4(),
                userId: dataObj.userId,
                problemId: dataObj.problemId,
                submitStatus: submitStatus,
                submitDate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                submitInfo: submitInfo
            });

        res.end("success");
    });
}

function uploadFile(req, res, type, maxFileSize) {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    let form = new formidable.IncomingForm();
    form.uploadDir = uploadDir;                   // 设置文件上传目录
    form.multiples = true;                        // 设置多文件上传
    form.keepExtensions = true;                   // 保持原有扩展名
    form.maxFileSize = maxFileSize * 1024 * 1024; // 设置最大文件大小（MB）

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

        let file = files.upload;
        let fileNameOld = file.name;
        console.log("文件名称: ", fileNameOld);

        // 移动到新路径
        let suffix = fileNameOld.slice(fileNameOld.lastIndexOf("."));
        let prefix = fileNameOld.slice(0, fileNameOld.lastIndexOf("."));

        let filePathOld = file.path;
        let fileNameNew = prefix + "-" +
                            dayjs().format("YYYY-MM-DD-HH-mm-ss") + suffix;
        let uploadDirNew = uploadDir;

        if (fields.token !== undefined) {
            uploadDirNew = path.join(uploadDir, fields.token + "/");
        }
        let filePathNew = uploadDirNew + fileNameNew;

        console.log("历史路径：", filePathOld);
        console.log("最新路径：", filePathNew);

        if (!fs.existsSync(uploadDirNew)) {
            fs.mkdirSync(uploadDirNew);
        }
        fs.renameSync(filePathOld, filePathNew);

        // 解压缩文件
        const extractDir = path.join(uploadDirNew, "extract/");
        if (!fs.existsSync(extractDir)) {
            fs.mkdirSync(extractDir);
        }
        else {
            fs.rmSync(extractDir, {
                recursive: true,
                force: true
            });
            fs.mkdirSync(extractDir);
        }
        const resExtract = spawnSync(
            "tar",
            ["-x", "-f", filePathNew, "-C", extractDir]);
        let stdoutExtract = resExtract.stdout.toString();
        let stderrExtract = resExtract.stderr.toString();
        console.log("解压标准输出：", stdoutExtract);
        console.log("解压错误输出：", stderrExtract);

        if (type === "online") {
            res.end(JSON.stringify({
                code: 0,
                msg: "success",
                data: {
                    fileNameNew: fileNameNew
                }
            }));
        }
        else if (type === "script") {
            res.end(JSON.stringify({
                code: 0,
                msg: "success",
                data: {
                    fileNameNew: fileNameNew
                }
            }));
        }
    });
}

module.exports = {
    getProblemData: (req, res) => {
        req.on("data", (data) => {
        });
        req.on("end", () => {
            res.writeHead(200, {
                "content-Type": "text/plain;charset=utf-8"
            });

            let problemArr = json.getJSONDataByOrder(
                path.join(dbDir, "problem.json"),
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

            let submitArr = [];
            if (dataObj.userType === "管理员") {
                submitArr = json.getJSONDataByField(
                    path.join(dbDir, "submit.json"),
                    "equal",
                    "userId",
                    dataObj.userId);
            }
            else {
                submitArr = json.getJSONDataAll(
                    path.join(dbDir, "submit.json"));
            }

            submitArr = json.getJSONDataByOrder(submitArr,
                                               "submitDate",
                                               "date",
                                               "desc");
            for (let i = 0; i < submitArr.length; i++) {
                let submitObj = submitArr[i];

                let userArr = json.getJSONDataByField(
                    path.join(dbDir, "user.json"),
                    "equal",
                    "id",
                    submitObj.userId);
                if (userArr.length > 0) {
                    Object.assign(submitObj, submitObj, userArr[0]);
                }

                let problemArr = json.getJSONDataByField(
                    path.join(dbDir, "problem.json"),
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
    judgeProblem:(req, res) => {
        judgeProblem(req, res);
    },
    uploadFile: (req, res) => {
        uploadFile(req, res, "online", 50);
    },
    uploadFileByScript: (req, res) => {
        uploadFile(req, res, "script", 50);
    },
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

            const userId = dataObj.userId;
            const userAccount = dataObj.userAccount;
            const userPassword = dataObj.userPassword;

            let loginFlag = false;
            let userArr = [];
            if (userId != "") {
                console.log("用户标识：", userId);
                logLoginWriteStream.write("用户标识：" + userId + "\n");
                userArr = json.getJSONDataByField(
                    path.join(dbDir, "user.json"),
                    "equal",
                    "id",
                    userId);
                if (userArr.length > 0) {
                    loginFlag = true;
                }
            }
            else {
                console.log("用户账号：", userAccount);
                logLoginWriteStream.write("用户账号：" + userAccount + "\n");
                userArr = json.getJSONDataByField(
                    path.join(dbDir, "user.json"),
                    "equal",
                    "userAccount",
                    userAccount);
                if (userArr.length === 1 &&
                    userArr[0].userPassword === userPassword) {
                    loginFlag = true;
                }
            }
            console.log(userArr);

            if (loginFlag) {
                console.log("验证成功");
                logLoginWriteStream.write("验证成功\n\n");

                // 设置Cookie过期时间为2小时
                res.writeHead(200, {
                    "Set-Cookie": userAccount + "=" +
                                  userPassword + ";" +
                                 "path=/;expires=" +
                                  new Date(Date.now() + 1000 * 60 * 60 * 2).toGMTString()
                });
                res.end(JSON.stringify({
                    msg: "success",
                    data: userArr[0]
                }));
            }
            else {
                console.log("验证失败\n");
                logLoginWriteStream.write("验证失败\n\n");

                res.end(JSON.stringify({
                    msg: "error",
                    data: {}
                }));
            }
        });
    }
}

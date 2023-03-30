const fs = require("fs");
const formidable = require("formidable");

const {
    systemUser,
    systemPassword,
    uploadDir,
    logLoginPath
} = require("../config/config.js")

let logLoginWriteStream = fs.createWriteStream(logLoginPath, { flags: "a" })

function getIPAddress(req) {
    let ip = req.headers["x-real-ip"] ||
                         req.headers["x-forwarded-for"] ||
                         req.connection.remoteAddres ||
                         req.socket.remoteAddress ||
                         "";
    return ip;
}

function splitCookieToArray(cookie) {
    let cookieArray = [];
    if (cookie) {
        cookieArray = cookie.split(";");
    }
    return cookieArray;
}

function splitCookieToKeyValue(cookie) {
    if (!cookie) return {};
    let cookieArray = cookie.trim().split("=");
    const cookieKey = cookieArray[0];
    const cookieVal = cookieArray[1];
    return {
        cookieKey,
        cookieVal
    }
}

module.exports = {
    verifyCookie: (cookie) => {
        const cookieArray = splitCookieToArray(cookie);

        for (let index = cookieArray.length; index >= 0; index--) {
            const item = cookieArray[index];
            const { cookieKey, cookieVal } = splitCookieToKeyValue(item);

            if (cookieKey === systemUser && cookieVal === systemPassword) {
                return true;
            }
        }

        return false;
    },
    verifyUserInfo: (req, res) => {
        let clientIPAddress = getIPAddress(req);
        console.log("登录地址：" + clientIPAddress);
        logLoginWriteStream.write("登录地址：" + clientIPAddress + "\n");

        let verifyStr = "";
        req.on("data", (verifyData) => {
            verifyStr += verifyData;
        });
        req.on("end", () => {
            let verifyObj = {};
            try {
                verifyObj = JSON.parse(verifyStr);
                console.log("验证数据：", verifyObj);
                logLoginWriteStream.write("验证数据：" + verifyObj + "\n");
            }
            catch (e) {
                console.log(e);
            }

            res.writeHead(200, {
                "Content-Type": "text/plain;charset=UTF-8"
            });

            const loginDate = new Date().toLocaleString();
            console.log("登录时间：" + loginDate + "\n");
            logLoginWriteStream.write("登录时间：" + loginDate + "\n");

            console.log("用户账号：" + verifyObj.user);
            logLoginWriteStream.write("用户账号：" + verifyObj.user + "\n");

            if (verifyObj.user === systemUser &&
                verifyObj.password === systemPassword) {
                console.log("验证成功");
                logLoginWriteStream.write("验证成功\n");

                // 设置Cookie过期时间为2小时
                res.writeHead(200, {
                    "Set-Cookie": verifyObj.user + "=" +
                                    verifyObj.password + ";" +
                                    "path=/;expires=" +
                                    new Date(Date.now() + 1000 * 60 * 60 * 2).toGMTString()
                });
                res.end(JSON.stringify({ code: 0, msg: "验证成功" }));
            }
            else {
                console.log("验证失败");
                logLoginWriteStream.write("用户密码：" + verifyObj.password + "\n");
                logLoginWriteStream.write("验证失败\n");

                res.end(JSON.stringify({ code: 1, msg: "验证失败" }));
            }
        });
    },
    getFileInfo: (req, res) => {
        fs.readdir(uploadDir, (err, data) => {
            let ret = [];
            for (let file of data) {
                let fileStat = fs.statSync(uploadDir + file);
                console.log("文件信息：", fileStat);
                ret.push({
                    src: file,
                    size: fileStat.size,
                    mtimeMs: new Date(fileStat.mtime).getTime()
                })
            }
            res.end(JSON.stringify(ret));
        });
    },
    uploadFile: (req, res) => {
        console.log("上传文件");

        var form = new formidable.IncomingForm();
        form.uploadDir = uploadDir;          // 设置文件上传目录
        form.multiples = true;               // 设置多文件上传
        form.keepExtensions = true;          // 保持原有扩展名
        form.maxFileSize = 10 * 1024 * 1024; // 设置文件大小为10MB

        form.on("error", (err) => {
            console.log("上传失败，文件大小超过10MB：", err);
            res.writeHead(400, { "content-type": "text/html;charset=UTF-8" });
            res.end("上传失败，文件大小超过10MB");
        });

        form.parse(req, (err, fields, files) => {
            if (err) {
                console.log("上传失败：", err);
                res.writeHead(500, { "content-type": "text/html;charset=UTF-8" });
                res.end("上传失败：" + JSON.stringify(err));
                return;
            }

            if (!files.uploadFile) {
                res.end("上传失败，文件【name】属性必须为【uploadFile】");
                return
            };

            if (Object.prototype.toString.call(files.uploadFile) === "[object Object]") {
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
                        console.log("上传失败：", err);
                        errMsg += JSON.stringify(err) + "\n";
                    }
                });
            }

            res.end(errMsg);
        });
    },
    deleteFile: (req, res) => {
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
    }
}

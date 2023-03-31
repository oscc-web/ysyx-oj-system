const fs = require("fs");
const http = require("http");
const path = require("path");

const {
    port,
    uploadDir,
    logDir,
    logLoginPath,
} = require("./config/config.js");

const {
    verifyCookie,
    verifyUserInfo,
    getFileInfo,
    uploadFile,
    deleteFile
} = require("./control/control.js");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir)
}
if (!fs.existsSync(logLoginPath)) {
    fs.mkdirSync(logDir);
    fs.writeFileSync(logLoginPath, "");
}

function sendPage(res, path, statusCode = 200) {
    res.writeHead(statusCode, { "Content-Type": "text/html;charset=UTF-8" });
    fs.createReadStream(path).pipe(res);
}

function handlePage404(res, fileDir) {
    if (!fs.existsSync(fileDir)) {
        res.writeHead(404, { "content-type": "text/html;charset=UTF-8" });
        res.end("没有文件或目录");
        console.log("没有文件或目录：", fileDir);
        return true;
    }
    return false
}

var server = http.createServer(function(req, res) {
    let url = decodeURI(req.url);
    console.log("接口地址：", url);

    let method = req.method.toLowerCase()

    let parameterPosition = url.indexOf("?");
    if (parameterPosition > -1) {
        url = url.slice(0, parameterPosition);
        console.log("接口地址（去掉参数）: ", url);
    }

    if (/^\/public\//.test(url)) {
        let fileDir = "." + url;
        if (!handlePage404(res, fileDir)) {
            fs.createReadStream(fileDir).pipe(res);
        }
        return;
    }

    if (url === "/verifyUserInfo" && method === "post") {
        verifyUserInfo(req, res)
        return;
    }
    if (!verifyCookie(req.headers.cookie)) {
        sendPage(res, "./public/verify.html", 400);
        return;
    }

    if (url === "/" && method === "get") {
        sendPage(res, "./index.html");
    }
    else if (url === "/getFileInfo" && method === "get") {
        getFileInfo(req, res);
    }
    else if (url === "/uploadFile" && method === "post") {
        uploadFile(req, res);
    }
    else if (/^\/deleteFile?/.test(url) && method === "get") {
        deleteFile(req, res);
    }
    else {
        // 下载文件
        let fileDir = path.join(uploadDir, url);
        if (!handlePage404(res, fileDir)) {
            console.log("下载文件: ", fileDir);
            fs.createReadStream(fileDir).pipe(res)
        }
    }
});
server.listen(port);
console.log("监听端口：", port)

process.on("exit", () => {
    console.log("退出进程");
});

process.on("uncaughtException", (err) => {
    if (err.code == "ENOENT") {
        console.log("没有文件或目录: ", err.path);
    }
    else {
        console.log(err);
    }
});

process.on("SIGINT", () => {
    process.exit();
});

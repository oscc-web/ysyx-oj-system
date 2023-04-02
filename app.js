const fs = require("fs");
const http = require("http");
const path = require("path");

const {
    port,
    rootDir,
    uploadDir,
    logDir,
    logLoginPath,
} = require("./config/config.js");

const {
    verifyCookie,
    verifyUserInfo,
    getSubmitTableData,
    getProblemData,
    getFileInfo,
    deleteFile,
    uploadFile,
    judgeProblemAnswerIsRight,
    uploadFileToServer,
} = require("./control/control.js");

const contentTypeObj = {
    "json": "application/json",
    "pdf":  "application/pdf",
    "woff": "font/woff",
    "css":  "text/css",
    "html": "text/html;charset=utf-8",
    "js":   "text/javascript",
    "txt":  "text/plain;charset=utf-8",
    "gif":  "image/gif",
    "jpg":  "image/jpg",
    "png":  "image/png"
}

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir)
}
if (!fs.existsSync(logLoginPath)) {
    fs.mkdirSync(logDir);
    fs.writeFileSync(logLoginPath, "");
}

function sendPage(res, path, statusCode = 200) {
    const suffix = path.substring(path.lastIndexOf(".") + 1);
    if (contentTypeObj[suffix] !== undefined) {
        res.writeHead(statusCode, {
            "content-Type": contentTypeObj[suffix]
        });
        fs.createReadStream(path).pipe(res);
    }
}

function handlePage404(res, fileDir) {
    if (!fs.existsSync(fileDir)) {
        res.writeHead(404, { "content-type": "text/html;charset=utf-8" });
        res.end("没有文件或目录");
        console.log("没有文件或目录：", fileDir);
        return true;
    }
    return false
}

const server = http.createServer((req, res) => {
    let url = decodeURI(req.url);
    let method = req.method.toLowerCase()
    console.log("接口地址：", url);

    let parameterPosition = url.indexOf("?");
    if (parameterPosition > -1) {
        url = url.slice(0, parameterPosition);
        console.log("接口地址（去掉参数）: ", url);
    }
    console.log("接口方法：", method);

    if (/^\/public\//.test(url)) {
        let fileDir = "." + url;
        if (!handlePage404(res, fileDir)) {
            fs.createReadStream(fileDir).pipe(res);
        }
        return;
    }

    // if (url === "/verifyUserInfo" && method === "post") {
    //     verifyUserInfo(req, res)
    //     return;
    // }
    // if (!verifyCookie(req.headers.cookie)) {
    //     sendPage(res, "./public/verify.html", 400);
    //     return;
    // }

    if (url === "/" && method === "get") {
        sendPage(res, "./public/index.html");
    }
    if (url === "/api/verifyUserInfo" && method === "post") {
        verifyUserInfo(req, res)
    }
    else if (url === "/api/getSubmitTableData" && method === "post") {
        getSubmitTableData(req, res);
    }
    else if (url === "/api/getProblemData" && method === "post") {
        getProblemData(req, res);
    }
    else if (url === "/api/judgeProblemAnswerIsRight" && method === "post") {
        judgeProblemAnswerIsRight(req, res);
    }
    else if (url === "/api/uploadFileToServer" && method === "post") {
        uploadFileToServer(req, res);
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
        sendPage(res, path.join(rootDir, url));
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

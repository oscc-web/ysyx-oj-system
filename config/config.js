const path = require("path");

const rootDir = path.join(process.cwd());

module.exports = {
    port: 5050,
    rootDir: rootDir,
    uploadDir: path.join(rootDir, "uploads/"),
    logDir: path.join(rootDir, "logs/"),
    logLoginPath: path.join(rootDir, "logs/", "login.log")
}

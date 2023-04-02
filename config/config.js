const path = require("path");

module.exports = {
    port: 5050,
    rootDir: path.join(process.cwd()),
    uploadDir: path.join(process.cwd(), "uploads/"),
    logDir: path.join(process.cwd(), "logs/"),
    logLoginPath: path.join(process.cwd(), "logs/", "login.log")
}

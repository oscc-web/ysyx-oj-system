layui.use(["admin", "form", "layer", "tablePlug", "upload"], function() {
    var admin  = layui.admin;
    var form   = layui.form;
    var layer  = layui.layer;
    var upload = layui.upload;

    var fileNameNew = "";
    var userId = "";
    var problemId = "";

    $(document).ready(function() {
        var userObj = admin.getTempData("userObj");
        if (userObj !== undefined) {
            userId = userObj.id;
        }

        $.post("/api/getProblemData", {
        }, function(res) {
            var obj = JSON.parse(res);
            for (var i = 0; i < obj.data.length; i++) {
                var problemObj = obj.data[i];
                $("#problemName").append(
                    '<option value="' + problemObj.id + '">' +
                        problemObj.problemNo + '-' + problemObj.problemName +
                    '</option>');
            }
            form.render("select");
        });
    });

    upload.render({
        elem: "#upload",
        url: "/api/uploadFile",
        data: {
            token: userId
        },
        method: "post",
        accept: "file",
        exts: "tar.bz2|tar.gz",
        auto: true,
        field: "upload",
        size: 50 * 1024,
        multiple: false,
        number: 0,
        drag: false,
        choose: function(obj) {
            layer.load();

            var files = obj.pushFile();
            var fileName = "";

            var filesArr = [];
            for (var i in files) {
                filesArr.push(files[i]);
                fileName = fileName + files[i].name + "、";
            }
            fileName = fileName.substring(0, fileName.length - 1);

            obj.preview(function(index, file, result) {
                console.log(index);
                console.log(file);
                console.log(result);
                if (!file) {
                    $("#fileName").val("");
                    layer.msg("导入失败！", {
                        time: 1000
                    });
                    return false;
                }
                delete files[index];
            });

            $("#fileName").val(fileName);
        },
        done: function(res, index, upload) {
            layer.closeAll("loading");
            var obj = res;
            if (obj.msg === "success") {
                fileNameNew = obj.data.fileNameNew;
                layer.msg("上传成功！", {
                    time: 1000
                });
            }
            else if (obj.msg === "errorMaxSize") {
                layer.alert("上传失败，文件大小超过10MB！", {
                    skin: "layui-layer-admin"
                });
            }
            else if (obj.msg === "errorAnalysis") {
                layer.alert("上传失败，表单解析错误！", {
                    skin: "layui-layer-admin"
                });
            }
            else if (obj.msg === "errorRename") {
                layer.alert("上传失败，文件重命名异常！", {
                    skin: "layui-layer-admin"
                });
            }
        },
        error: function(index, upload) {
            layer.closeAll("loading");
        }
    });

    form.on("select(problemName)", function(data) {
        console.log(data);
        problemId = data.value;
    });

    form.on("submit(confirm)", function() {
        layer.load();
        $.post("/api/judgeProblem", JSON.stringify({
            fileName: fileNameNew,
            userId: userId,
            problemId: problemId
        }), function(res) {
            layer.closeAll("loading");
            if (res === "success") {
                layer.msg("完成判题！", {
                    time: 1000
                }, function() {
                    admin.putTempData("judgeFlag", true);
                    admin.closeThisDialog();
                });
            }
            else {
                layer.alert("判题失败，请联系系统管理员！", {
                    skin: "layui-layer-admin"
                }, function() {
                    admin.closeThisDialog();
                });
            }
        });
    });
});

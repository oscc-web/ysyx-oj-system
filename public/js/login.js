layui.use(["admin", "form", "layer"], function() {
    var admin = layui.admin;
    var form  = layui.form;
    var layer = layui.layer;

    form.on("submit(confirm)", function(data) {
        var passwordInfo = JSON.stringify(data.field);
        // $.post("executeUser_modifyUserPassword", {
        //     passwordInfo: passwordInfo
        // }, function(res, status) {
        //     if (res == "success") {
        //         layer.msg("修改成功！", {
        //             time: 1000
        //         }, function() {
        //             admin.closeThisDialog();
        //         });
        //     }
        //     else if (res == "userNotExist") {
        //         layer.alert("修改失败，旧密码输入错误！", {
        //             skin: "layui-layer-admin"
        //         });
        //         return false;
        //     }
        //     else if (res == "sessionEmpty") {
        //         layer.alert("修改失败，用户缓存失效！", {
        //             skin: "layui-layer-admin"
        //         });
        //         return false;
        //     }
        //     else {
        //         layer.alert("修改失败，请联系系统管理员！", {
        //             skin: "layui-layer-admin"
        //         });
        //         return false;
        //     }
        // });
    });
});

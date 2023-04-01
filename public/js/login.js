layui.use(["admin", "form", "layer"], function() {
    var admin = layui.admin;
    var form  = layui.form;
    var layer = layui.layer;

    form.on("submit(confirm)", function(data) {
        $.ajax({
            url: "/verifyUserInfo",
            type: "post",
            data: JSON.stringify(data.field),
            success: function(res) {
                var obj = JSON.parse(res);
                if (obj.msg === "success") {
                    admin.putTempData("userObj", obj.data);
                    layer.msg("登录成功！", {
                        time: 1000
                    }, function() {
                        admin.closeThisDialog();
                    });
                }
                else {
                    layer.alert("登录失败，账号或密码错误！", {
                        skin: "layui-layer-admin"
                    });
                }
            }
        });
    });
});

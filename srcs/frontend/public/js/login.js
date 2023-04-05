layui.use(["admin", "form", "layer", "tablePlug"], function() {
    var admin = layui.admin;
    var form  = layui.form;
    var layer = layui.layer;

    $(document).ready(function() {
        $("#userAccount").attr("lay-verify", "");
        $("#userPassword").attr("lay-verify", "");
    });

    form.on("select(loginType)", function(data) {
        var value = data.value;
        if (value === "唯一标识") {
            $("#userId").parents(".layui-form-item").show();
            $("#userId").attr("lay-verify", "required");

            $("#userAccount").parents(".layui-form-item").hide();
            $("#userAccount").attr("lay-verify", "");
            $("#userPassword").parents(".layui-form-item").hide();
            $("#userPassword").attr("lay-verify", "");
        }
        else if (value === "账号密码") {
            $("#userId").parents(".layui-form-item").hide();
            $("#userId").attr("lay-verify", "");

            $("#userAccount").parents(".layui-form-item").show();
            $("#userAccount").attr("lay-verify", "required");
            $("#userPassword").parents(".layui-form-item").show();
            $("#userPassword").attr("lay-verify", "required");
        }
        parent.layui.layer.iframeAuto(winIndex);
    });

    form.on("submit(confirm)", function(data) {
        $.ajax({
            url: "/api/verifyUserInfo",
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

var winIndex = 0;

function getWindowIndex(index) {
    winIndex = index;
}

layui.use(["admin", "element", "index", "layer"], function() {
    var admin    = layui.admin;
    var index    = layui.index;
    var layer    = layui.layer;

    index.loadSetting();

    var title   = "主页";
    var userObj = {};

    $(document).ready(function() {
        setUserInfo();
        index.openTab({
            title: "主页",
            url: "../public/html/home.html" + version,
            end: function() {
            }
        });
    });

    $(".layui-layout-left li").click(function() {
        title = $(this).find("a").text();
        if (title === "提交") {
            if (userObj === undefined) {
                layer.msg("请先登录系统，再上传代码！", {
                    time: 1000
                }, function() {
                    openLoginWindow();
                });
                return;
            }
        }

        index.openTab({
            title: title,
            url: $(this).find("a").attr("lay-href") + version,
            end: function() {
            }
        });
    });

    $("#login").click(function() {
        openLoginWindow();
    });

    $("#logout").click(function() {
        layer.confirm("确定退出系统？", {
            skin: "layui-layer-admin"
        }, function(index) {
            layer.msg("操作成功！", {
                time: 1000
            }, function() {
                admin.putTempData("userObj", undefined);
                setUserInfo();
                if (title === "提交") {
                    $(".layui-layout-left .layui-nav-item").removeClass(
                        "layui-this");
                    $(".layui-layout-left .layui-nav-item").eq(0).addClass(
                        "layui-this");
                    $(".layui-body .layui-tab-item").removeClass(
                        "layui-show");
                    $(".layui-body .layui-tab-item").eq(0).addClass(
                        "layui-show");
                }
                layer.close(index);
            })
        });
    });

    function openLoginWindow() {
        admin.open({
            type: 2,
            title: "用户登录窗口",
            content: "../public/html/login.html" + version,
            area: ["360px", "250px"],
            offset: "auto",
            shade: 0.5,
            end: function() {
                setUserInfo();
            }
        });
    }

    function setUserInfo() {
        userObj = admin.getTempData("userObj");
        console.log(userObj);
        if (userObj !== undefined) {
            $("#userLoginStatus").find("span").addClass("layui-bg-blue");
            $("#userLoginStatus").find("span").text("已登录");
            $("#userName").find("span").text(userObj.userName);
            $("#userType").find("span").text(userObj.userType);
            $("#login").hide();
            $("#logout").show();
        }
        else {
            $("#userLoginStatus").find("span").removeClass("layui-bg-blue");
            $("#userLoginStatus").find("span").text("未登录");
            $("#userName").find("span").text("暂无");
            $("#userType").find("span").text("暂无");
            $("#login").show();
            $("#logout").hide();
        }
    }
});

layui.use(["admin", "element", "index", "layer"], function() {
    var admin    = layui.admin;
    var index    = layui.index;
    var layer    = layui.layer;

    index.loadSetting();

    var tabTitle   = "主页";
    var userObj = {};
    var tabUrlSubmit = "";

    $(document).ready(function() {
        setUserInfo();
        index.openTab({
            title: "主页",
            url: "../public/html/home.html" + version
        });

        var theme = "theme-green-dark";
        if (!layui.data(admin.tableName).theme) {
            admin.changeTheme(getThemeDir() + theme + ".css");
            layui.data(admin.tableName, {
                key: "theme",
                value: theme
            });
        }
    });

    $(".layui-layout-left li").click(function() {
        tabTitle = $(this).find("a").text();
        if (tabTitle === "提交") {
            if (userObj === undefined) {
                layer.msg("请先登录系统，再上传代码！", {
                    time: 1000
                }, function() {
                    openLoginWindow();
                });
                return;
            }
        }

        tabUrl = $(this).find("a").attr("lay-href") + version;
        if (tabTitle === "提交") {
            tabUrlSubmit = tabUrl;
        }
        index.openTab({
            title: tabTitle,
            url: tabUrl
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
                if (tabTitle === "提交") {
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
            index.closeTab(tabUrlSubmit);
        }
    }
});

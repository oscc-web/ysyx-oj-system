layui.use(["admin", "carousel", "element", "index", "layer"], function() {
    var admin    = layui.admin;
    var carousel = layui.carousel;
    var index    = layui.index;
    var layer    = layui.layer;

    index.loadSetting();

    var compIdM       = "";
    var userId        = "";
    var userAuthority = "";
    var userDirection = "";

    $(document).ready(function() {
        index.openTab({
            title: "主页",
            url: "../public/html/submit.html" + version,
            end: function() {
            }
        });
    });

    $(".layui-layout-left li").click(function() {
        index.openTab({
            title: $(this).find("a").text(),
            url: $(this).find("a").attr("lay-href") + version,
            end: function() {
            }
        });
    });

    $("#login").click(function() {
        admin.open({
            type: 2,
            title: "用户登录窗口",
            content: "../public/html/login.html" + version,
            area: ["360px", "250px"],
            offset: "auto",
            shade: 0.5
        });
    });

    $("#logout").click(function() {
        layer.confirm("确定退出系统？", {
            skin: "layui-layer-admin"
        }, function() {
            // window.location.replace("../../index.html" + version);
        });
    });
});

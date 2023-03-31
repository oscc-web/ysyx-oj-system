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
            url: "./html/submit.html" + version,
            end: function() {
            }
        });

        // admin.flexible(false);
        // admin.putTempData("flexible", true);

        // $("#year").text(new Date().getFullYear());

        // $.ajaxSettings.async = false;
        // $.post("executeData_getDataFakeInfo", {
        //     debugFlag: debugFlag
        // }, function(res) {
        //     var obj = JSON.parse(res);
        //     console.log(obj);
        //     $(document).attr("title",
        //                      obj.compNameBriefA + $(document).attr("title"));
        //     $("#comp").text(obj.compNameAll);
        // });
        // if (debugFlag) {
        //     $("#logo").prop("src", "");
        // }

        // $.post("executeUser_getUserLoginData", function(res) {
        //     var obj = eval("(" + res + ")");
        //     console.log(obj);
        //     if (obj.msg == "success") {
        //         var user = obj.data[0];
        //         var comp = obj.data[1];
        //         var compP = obj.data[2];
        //         if (comp != undefined) {
        //             compIdM = comp.compIdM;
        //             // 不显示单位简称、单位类型、单位规模和单位省份
        //             comp.compNameBrief = "——";
        //             comp.compType = "——";
        //             comp.compScale = "——";
        //             comp.compProvince = "——";
        //         }
        //         userId = user.userId;
        //         var userIdentity = user.userIdentity;
        //         userAuthority = user.userAuthority;
        //         userDirection = user.userDirection;
        //         if (userIdentity == "系统管理员") {
        //             $("#statis").hide();
        //             $("#submit").hide();
        //             index.openTab({
        //                 title: "用户管理",
        //                 url: "./system/user/user_manage.html" + version,
        //                 end: function() {
        //                 }
        //             });
        //         }
        //         else if (userIdentity == "业务管理员") {
        //             $("#statis").hide();
        //             $("#statisView").hide();
        //             $("#chart").hide();
        //             $("#casicReport").hide();
        //             $("#customReport").hide();
        //             $("#log").hide();
        //             index.openTab({
        //                 title: "用户管理",
        //                 url: "./system/user/user_manage.html" + version,
        //                 end: function() {
        //                 }
        //             });
        //         }
        //         else if (userIdentity == "培训管理员") {
        //             $("#statis").hide();
        //             $("#submit").hide();
        //             $("#system").hide();
        //             index.openTab({
        //                 title: "培训计划",
        //                 url: "./train/train_plan.html" + version,
        //                 end: function() {
        //                 }
        //             });
        //         }
        //         else if (userIdentity == "产品管理员") {
        //             $("#statis").hide();
        //             $("#submit").hide();
        //             $("#compManage").hide();
        //             $("#userManage").hide();
        //             $("#targetManage").hide();
        //             $("#dictManage").hide();
        //             $("#logManage").hide();
        //             $("#dataMigrate").hide();
        //             $("#businessManage").hide();
        //             $("#monitorManage").hide();
        //             index.openTab({
        //                 title: "产品信息",
        //                 url: "./system/info/product_info.html" + version,
        //                 end: function() {
        //                 }
        //             });
        //         }
        //         else {
        //             // 集团用户可以查看国资委报表
        //             var userCompId = user.userCompId;
        //             if (userCompId != rootCompIdM) {
        //                 $("#sasacReport").hide();
        //             }

        //             $("#trainManage").hide();
        //             $("#system").hide();
        //             if (userAuthority.indexOf("填报") != -1) {
        //                 $("#statis").show();
        //                 // 打开培训计划版块
        //                 var trainTipsFlag = admin.getTempData(
        //                     "trainTipsFlag");
        //                 if (trainTipsFlag != undefined && trainTipsFlag) {
        //                     admin.putTempData("trainTipsFlag", false);
        //                     index.openTab({
        //                         title: "培训计划",
        //                         url: "./train/train_plan.html" + version,
        //                         end: function() {
        //                         }
        //                     });
        //                 }
        //                 else {
        //                     index.openTab({
        //                         title: "计量统计版块",
        //                         url: "./statis/statis_manage.html" + version,
        //                         end: function() {
        //                         }
        //                     });
        //                 }
        //             }
        //             else if (userAuthority.indexOf("审核") != -1 ||
        //                      userAuthority.indexOf("浏览") != -1) {
        //                 $("#statis").hide();
        //                 var trainTipsFlag = admin.getTempData(
        //                     "trainTipsFlag");
        //                 if (trainTipsFlag != undefined && trainTipsFlag) {
        //                     admin.putTempData("trainTipsFlag", false);
        //                     index.openTab({
        //                         title: "培训计划",
        //                         url: "./train/train_plan.html" + version,
        //                         end: function() {
        //                         }
        //                     });
        //                 }
        //                 else {
        //                     index.openTab({
        //                         title: "台账浏览",
        //                         url: "./statis/statis_view.html" + version,
        //                         end: function() {
        //                         }
        //                     });
        //                 }
        //             }
        //         }

        //         admin.putTempData("user", user);
        //         admin.putTempData("userDirection", userDirection);
        //         admin.putTempData("comp", comp);
        //         admin.putTempData("compP", compP);

        //         $.post("executeSubmit_getReportSubmitMsgData", {
        //             compIdM: compIdM,
        //             userAuthority: userAuthority,
        //             userDirection: userDirection
        //         }, function(res, status) {
        //             var obj = eval("(" + res + ")");
        //             var noticeData   = obj.notice;
        //             var noticeLength = noticeData.length;
        //             $("#noticeData").val(JSON.stringify(noticeData));
        //             if (noticeLength > 0) {
        //                 $("#messages").parent().css("margin-right", "10px");
        //                 $("#messages").children().prepend(
        //                     '<span class="layui-badge" style="top:23px;">' +
        //                     noticeLength + '</span>');
        //             }
        //         });

        //         getSystemSessionData();
        //         getReportSubmitStatus("", compIdM);
        //     }
        //     else {
        //         layer.alert("登录超时，请重新登录本系统！", {
        //             skin: "layui-layer-admin"
        //         }, function(index) {
        //             window.location.replace("../../index.html" + version);
        //             layer.close(index);
        //         });
        //         return;
        //     }
        // });
        // $.ajaxSettings.async = true;

        // var train = admin.getTempData("trainUserData");
        // if (train != undefined) {
        //     var trainColor = train.data.trainColor;
        //     if (trainColor == "red") {
        //         var callboard = $("#callboard").find("[carousel-item]");
        //         callboard.append(
        //             "<div>" +
        //                 "重要公告：培训证书未录入或已过期，请报名当年内的培训场次！" +
        //             "</div>");
        //     }
        // }
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
            content: "./html/login.html" + version,
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

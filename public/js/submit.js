layui.use(["admin", "form", "layer", "table"], function() {
    var admin = layui.admin;
    var form  = layui.form;
    var layer = layui.layer;
    var table = layui.table;

    var submitStatus    = "all";
    var searchCondition = "";
    var searchKeywords  = "";

    var problemDifficultyObj = {
        "简单": "layui-bg-green",
        "中等": "layui-bg-blue",
        "困难": "layui-bg-orange",
        "专家": "layui-bg-red"
    }
    var submitStatusObj = {
        "已通过": "layui-bg-green",
        "未通过": "layui-bg-red"
    }

    $(document).ready(function() {
        table.render({
            elem: "#submitTable",
            cols: [[{
                type: "numbers",
                fixed: "left"
            }, {
                field: "problemName",
                title: "题目名称",
                width: 300,
                fixed: "left",
                sort: false,
                align: "center"
            }, {
                field: "problemNo",
                title: "题目编号",
                width: 120,
                sort: false,
                align: "center"
            }, {
                field: "problemDifficulty",
                title: "题目难度",
                width: 150,
                sort: false,
                align: "center"
            }, {
                field: "problemLang",
                title: "编程语言",
                width: 150,
                sort: false,
                align: "center"
            }, {
                field: "problemTag",
                title: "题目标签",
                width: 150,
                sort: false,
                align: "center"
            }, {
                field: "submitStatus",
                title: "提交状态",
                width: 150,
                sort: false,
                align: "center"
            }, {
                field: "submitDate",
                title: "提交时间",
                width: 160,
                sort: false,
                align: "center"
            }, {
                title: "用户操作",
                width: 160,
                fixed: "right",
                sort: false,
                align: "center",
                templet: function(d) {
                    var buttonView =
                        "<a class='layui-btn layui-btn-xs layui-btn-normal'" +
                           "lay-event='view'>浏览判题信息" +
                        "</a>";
                    return buttonView;
                }
            }]],
            method: "post",
            height: "full-110",
            data: [{
                problemNo: "004",
                problemName: "RV32M单周期处理器",
                problemDifficulty: "专家",
                problemLang: "Chisel",
                problemTag: "体系结构",
                submitStatus: "未通过",
                submitDate: "2023-03-31 15:00:00",
                submitInfo: "ERROR: XXX"
            }, {
                problemNo: "003",
                problemName: "ALU运算单元",
                problemDifficulty: "困难",
                problemLang: "Verilog",
                problemTag: "数字电路",
                submitStatus: "未通过",
                submitDate: "2023-03-31 14:00:00",
                submitInfo: "ERROR: XXX"
            }, {
                problemNo: "002",
                problemName: "快速排序",
                problemDifficulty: "中等",
                problemLang: "C",
                problemTag: "程序设计",
                submitStatus: "未通过",
                submitDate: "2023-03-31 13:00:00",
                submitInfo: "ERROR: XXX"
            }, {
                problemNo: "001",
                problemName: "Hello World",
                problemDifficulty: "简单",
                problemLang: "C",
                problemTag: "程序设计",
                submitStatus: "已通过",
                submitDate: "2023-03-31 12:00:00",
                submitInfo: "PASS: XXX"
            }, {
                problemNo: "001",
                problemName: "Hello World",
                problemDifficulty: "简单",
                problemLang: "C",
                problemTag: "程序设计",
                submitStatus: "未通过",
                submitDate: "2023-03-31 11:00:00",
                submitInfo: "ERROR: XXX"
            }],
            done: function(res, curr, count) {
                var selectorPrefix =
                    "div[lay-id='submitTable'] .layui-table-main ";
                for (var i = 0; i < res.data.length; i++) {
                    var data = res.data[i];
                    var problemDifficulty = data.problemDifficulty;
                    var selectorContent = selectorPrefix +
                        "tr[data-index=" + i + "] " +
                        "td[data-field='problemDifficulty'] .layui-table-cell";
                    $(selectorContent).html(
                        '<span class="layui-badge ' +
                            problemDifficultyObj[problemDifficulty] + '">' +
                            problemDifficulty +
                        '</span>');

                    var submitStatus = data.submitStatus;
                    var selectorContent = selectorPrefix +
                        "tr[data-index=" + i + "] " +
                        "td[data-field='submitStatus'] .layui-table-cell";
                    $(selectorContent).html(
                        '<span class="layui-badge ' +
                            submitStatusObj[submitStatus] + '">' +
                            submitStatus +
                        '</span>');
                }
            },
            page: true,
            limit: 90,
            text: {
                none: "暂无相关数据"
            }
        });

        // searchSubmitTable();
    });

    function searchSubmitTable() {
        table.reload("submitTable", {
            url: "executeUser_getUserInfoData",
            where: {
                userType: "user",
                userCreateDate: userCreateDate,
                submitStatus: submitStatus,
                searchCondition: searchCondition,
                searchKeywords: searchKeywords
            },
            page: {
                curr: 1
            }
        });
    }

    function handleSubmitInfoData(obj) {
        var data = obj.data;
        console.log(data);

        if (obj.event == "view") {
            admin.open({
                type: 1,
                title: "判题信息窗口",
                content:
                    '<div class="layui-form-item layui-form-text" style="padding:25px 20px 0px 25px;">' +
                        '<textarea class="layui-textarea" placeholder="暂无" style="height:250px;"></textarea>' +
                    '</div>',
                area: "550px",
                offset: "auto",
                btn: ["确定"],
                shade: 0.5,
                success: function(layero, index) {
                    $("textarea").val(data.submitInfo);
                },
                yes: function(index, layero) {
                    layer.close(index);
                }
            });
        }
        else {
            return;
        }
    }

    table.on("tool(submitTable)", function(obj) {
        handleSubmitInfoData(obj);
    });

    $("#import").click(function() {
        admin.open({
            type: 2,
            title: "提交代码窗口",
            content: "./submit_code.html" + version,
            area: ["550px", "250px"],
            offset: "auto",
            shade: 0.5
        });
    });

    // $("#export").click(function() {
    //     exportTableData("executeUser_getUserInfoData", {
    //     }, {
    //         userAccount: "用户账号",
    //         userPassword: "用户密码",
    //         userCompName: "单位名称",
    //         userName: "用户姓名",
    //         userIdCard: "用户身份证号",
    //         userIdentity: "用户身份",
    //         userAuthority: "用户权限",
    //         userDirection: "用户业务方向",
    //         submitStatus: "用户激活状态",
    //         userHostIp: "用户主机地址",
    //         userCreateDate: "用户创建日期",
    //         userLockStatus: "用户锁定状态",
    //         userDataOrigin: "用户数据来源"
    //     }, [
    //     ], [
    //     ], {
    //     }, {
    //         "A": 120,
    //         "B": 120,
    //         "C": 350,
    //         "D": 120,
    //         "E": 150,
    //         "F": 120,
    //         "G": 120,
    //         "H": 120,
    //         "I": 120,
    //         "J": 120,
    //         "K": 150,
    //         "L": 120,
    //         "M": 120,
    //     }, {
    //     },
    //     "用户注册信息",
    //     "static",
    //     [],
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "");
    // });

    form.on("select(submitStatus)", function(data) {
        submitStatus = data.value;
        searchSubmitTable();
    });

    $(".search").click(function() {
        searchCondition = $("#searchCondition").val();
        searchKeywords  = $("#searchKeywords").val();
        searchSubmitTable();
    });
});

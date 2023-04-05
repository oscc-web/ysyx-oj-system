layui.use(["admin", "form", "layer", "table"], function() {
    var admin = layui.admin;
    var form  = layui.form;
    var layer = layui.layer;
    var table = layui.table;

    var userId          = "";
    var userType        = "普通用户";
    var submitStatus    = "全部";
    var searchCondition = "";
    var searchKeywords  = "";

    var problemDiffObj = {
        "简单": "layui-bg-green",
        "中等": "layui-bg-blue",
        "困难": "layui-bg-orange",
        "专家": "layui-bg-red"
    }
    var submitStatusObj = {
        "已通过": "layui-bg-green",
        "未通过": "layui-bg-red"
    }

    var tableCols = [[{
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
        field: "problemDiff",
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
        field: "problemTags",
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
    }]];

    $(document).ready(function() {
        var userObj = admin.getTempData("userObj");
        if (userObj !== undefined) {
            userId = userObj.id;
            userType = userObj.userType;
        }

        if (userType === "管理员") {
            // $("#submit").hide();

            tableCols[0].splice(6, 0, {
                field: "userName",
                title: "用户姓名",
                width: 150,
                sort: false,
                align: "center"
            });
        }
        else {
            // $("#submit").show();
        }

        table.render({
            elem: "#submitTable",
            cols: tableCols,
            method: "post",
            height: "full-110",
            done: function(res, curr, count) {
                var selectorPrefix =
                    "div[lay-id='submitTable'] .layui-table-main ";
                for (var i = 0; i < res.data.length; i++) {
                    var data = res.data[i];
                    var problemDiff = data.problemDiff;
                    var selectorContent = selectorPrefix +
                        "tr[data-index=" + i + "] " +
                        "td[data-field='problemDiff'] .layui-table-cell";
                    $(selectorContent).html(
                        '<span class="layui-badge ' +
                            problemDiffObj[problemDiff] + '">' +
                            problemDiff +
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

        searchSubmitTable();
    });

    function searchSubmitTable() {
        table.reload("submitTable", {
            url: "/api/getSubmitTableData",
            where: JSON.stringify({
                userId: userId,
                userType: userType,
                submitStatus: submitStatus,
                searchCondition: searchCondition,
                searchKeywords: searchKeywords
            }),
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

    $("#submit").click(function() {
        admin.open({
            type: 2,
            title: "提交代码窗口",
            content: "./submit_code.html" + version,
            area: ["550px", "250px"],
            offset: "auto",
            shade: 0.5,
            end: function() {
                var judgeFlag = admin.getTempData("judgeFlag");
                if (judgeFlag !== undefined && judgeFlag) {
                    admin.putTempData("judgeFlag", false);
                    searchSubmitTable();
                }
            }
        });
    });

    $("#export").click(function() {
        exportTableData("/api/getSubmitTableData", JSON.stringify({
            userId: userId,
            userType: userType,
            submitStatus: submitStatus,
            searchCondition: searchCondition,
            searchKeywords: searchKeywords
        }), {
            problemName: "题目名称",
            problemNo: "题目编号",
            problemDiff: "题目难度",
            problemLang: "编程语言",
            problemTags: "题目标签",
            userName: "用户姓名",
            submitStatus: "提交状态",
            submitDate: "提交时间",
        }, [
        ], [
        ], {
        }, {
            "A": 250,
            "B": 120,
            "C": 120,
            "D": 120,
            "E": 120,
            "F": 120,
            "G": 120,
            "H": 120,
        }, {
        },
        "提交报告信息",
        "static",
        [],
        "",
        "",
        "",
        "",
        "",
        "");
    });

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

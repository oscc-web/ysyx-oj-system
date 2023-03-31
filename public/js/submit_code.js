layui.use(["admin", "form", "layer", "tablePlug"], function() {
    var admin = layui.admin;
    var form  = layui.form;
    var layer = layui.layer;

    // form.on("select(statisDateYear)", function(data) {
    //     var year = data.value;
    //     if (year != "") {
    //         $.ajaxSettings.async = false;
    //         $.post("executeStatis_getStatisDateMonths", {
    //             year: year
    //         }, function(res) {
    //             var obj = JSON.parse(res);
    //             console.log(obj);
    //             $("#statisDateMonth").empty();
    //             $("#statisDateMonth").prepend(
    //                 "<option value=''>选择月份</option>");
    //             for (var i = 0; i < obj.months.length; i++) {
    //                 $("#statisDateMonth").append(
    //                     "<option value='" + obj.months[i] + "'>" +
    //                     obj.months[i] + "<option>");
    //             }
    //         });
    //         $.ajaxSettings.async = true;
    //     }
    //     else {
    //         $("#statisDateMonth").empty();
    //         $("#statisDateMonth").prepend("<option value=''>选择月份</option>");
    //     }

    //     form.render("select");
    // });

    // $("#confirm").click(function() {
    //     var statisDateYear  = $("#statisDateYear").val();
    //     var statisDateMonth = $("#statisDateMonth").val();
    //     var statisDateM     = "";

    //     if (dateExistFlag) {
    //         if (dataType == "comp" || dataType == "user" ||
    //             dataType == "econ" || dataType == "migrate" ||
    //             dataType == "compField") {
    //             if (statisDateYear == "") {
    //                 parent.layui.layer.alert("提交失败，请选择匹配日期的年份！", {
    //                     skin: "layui-layer-admin"
    //                 });
    //                 return;
    //             }
    //             if (statisDateMonth == "") {
    //                 parent.layui.layer.alert("提交失败，请选择匹配日期的月份！", {
    //                     skin: "layui-layer-admin"
    //                 });
    //                 return;
    //             }
    //             statisDateM = statisDateYear + "-" + statisDateMonth;
    //         }
    //         else {
    //             var error = "年份或季度！";
    //             if (dataType == "co2") {
    //                 error = "年份！";
    //             }
    //             else if (dataType == "price") {
    //                 error = "季度！";
    //             }

    //             if (statisDateYear == "") {
    //                 parent.layui.layer.alert(
    //                     "提交失败，请选择导入文件的" + error, {
    //                     skin: "layui-layer-admin"
    //                 });
    //                 return;
    //             }
    //         }
    //     }
    //     else {
    //         if (dataType != "product" && dataType != "train") {
    //             parent.layui.layer.alert("提交失败，不存在相应的日期时间！", {
    //                 skin: "layui-layer-admin"
    //             });
    //             return;
    //         }
    //     }

    //     if (!importFileFlag) {
    //         parent.layui.layer.alert("提交失败，文件未导入或导入错误！", {
    //             skin: "layui-layer-admin"
    //         });
    //         return;
    //     }

    //     if (dataType == "comp") {
    //         var statisDate = admin.getTempData("statisDate");
    //         if (statisDate == undefined) {
    //             statisDate = "";
    //         }
    //         if (statisDate == statisDateM) {
    //             layer.alert(
    //                 "提交失败，当前选择的导入单位树期次为" + statisDate +
    //                 "，与匹配单位树期次一样！", {
    //                 skin: "layui-layer-admin"
    //             });
    //             return false;
    //         }
    //     }

    //     if (dataType == "comp" || dataType == "user" ||
    //         dataType == "econ" || dataType == "migrate" ||
    //         dataType == "compField" || dataType == "train") {
    //         admin.putTempData("statisDateM", statisDateM);
    //         admin.putTempData("dataMatchFlag", true);
    //         admin.closeThisDialog();
    //     }
    //     else if (dataType == "co2" || dataType == "price" ||
    //              dataType == "product") {
    //         layer.load();
    //         $.post("executeData_saveDataImportResult" , {
    //             dataType: dataType,
    //             statisDate: statisDateYear,
    //             statisYear: statisDateYear,
    //             dataImport: JSON.stringify(dataImportG)
    //         }, function(res) {
    //             layer.closeAll("loading");
    //             if (res == "success") {
    //                 layer.msg("保存成功！", {
    //                     time: 1000
    //                 }, function() {
    //                     admin.closeThisDialog();
    //                     if (dataType == "product") {
    //                         parent.layui.table.reload("productInfoTable", {
    //                             page: {
    //                                 curr: 1
    //                             }
    //                         });
    //                     }
    //                 });
    //             }
    //             else if (res == "repeat") {
    //                 parent.layui.layer.alert("保存失败，当前日期存在数据！", {
    //                     skin: "layui-layer-admin"
    //                 });
    //             }
    //             else {
    //                 parent.layui.layer.alert("保存失败，请联系系统管理员！", {
    //                     skin: "layui-layer-admin"
    //                 });
    //             }
    //         });
    //     }
    // });
});

var dateExistFlag  = false;
var importFileFlag = false;
var dataType       = "";
var dataImportG    = [];

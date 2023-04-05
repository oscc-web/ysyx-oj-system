var sortType  = "";
var sortOrder = "asc"

var ratio = 1e-6;

var cellConfigAll3 = {
    s: {
        fill: {
            bgColor: {
                indexed: 64
            },
            fgColor: {
                rgb: "FFFF00"
            }
        },
        font: {
            sz: 10
        },
        alignment: {
            horizontal: "center",
            vertical: "center"
        },
        numFmt: "0.000",
        border: {
            top: {
                style: "thin",
                color: {
                    rgb: "000000"
                }
            },
            bottom: {
                style: "thin",
                color: {
                    rgb: "000000"
                }
            },
            left: {
                style: "thin",
                color: {
                    rgb: "000000"
                }
            },
            right: {
                style: "thin",
                color: {
                    rgb: "000000"
                }
            }
        }
    }
};
var cellConfigVal3 = {
    t: "n",
    s: {
        font: {
            sz: 10
        },
        alignment: {
            horizontal: "center",
            vertical: "center"
        },
        numFmt: "0.000",
        border: {
            top: {
                style: "thin",
                color: {
                    rgb: "000000"
                }
            },
            bottom: {
                style: "thin",
                color: {
                    rgb: "000000"
                }
            },
            left: {
                style: "thin",
                color: {
                    rgb: "000000"
                }
            },
            right: {
                style: "thin",
                color: {
                    rgb: "000000"
                }
            }
        }
    }
};

Date.prototype.Format = function(format) {
    var obj = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "H+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S" : this.getMilliseconds()
    };
    if (/(y+)/.test(format)) {
        format = format.replace(
            RegExp.$1,
            (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var i in obj) {
        if (new RegExp("(" + i + ")").test(format)) {
            format = format.replace(
                RegExp.$1,
                (RegExp.$1.length == 1) ?
                    (obj[i]) :
                    (("00" + obj[i]).substr((""+ obj[i]).length)));
        }
    }
    return format;
}

function addTableDataBE(tableId, tableType, url, param, newData, idName,
                        indexName) {
    layui.use(["layer", "table", "treeGrid"], function() {
        var $        = layui.jquery;
        var layer    = layui.layer;
        var table    = layui.table;
        var treeGrid = layui.treeGrid;

        if (tableType == "treeGrid") {
            table = treeGrid;
        }

        var tableData = [];
        var dataIndex = 0;

        var tableCache = updateTableCacheOrForm(tableId, tableType, "cache");
        console.log(tableCache);
        if (tableCache != undefined) {
            for (var i = 0; i < tableCache.length; i++) {
                tableData.push(tableCache[i]);
            }
            dataIndex = tableCache.length;
        }

        param.dataIndex = dataIndex;

        // 设置加载窗口以阻塞用户连续点击【新增】按钮
        layer.load();
        $.post(url, param, function(res) {
            layer.closeAll("loading");
            var obj = JSON.parse(res);
            if (obj.msg == "success") {
                layer.msg("新增成功！", {
                    time: 1000
                }, function() {
                    var id = obj.id;
                    newData[idName]    = id;
                    newData[indexName] = dataIndex;
                    tableData.push(newData);
                    console.log(tableData);
                    table.reload(tableId, {
                        url: "",
                        data: tableData
                    });
                });
            }
            else {
                layer.alert("新增失败，请联系系统管理员！", {
                    skin: "layui-layer-admin"
                });
            }
        });
    });
}

function addTableDataFE(tableId, tableType, newData) {
    layui.use(["table", "treeGrid"], function() {
        var table    = layui.table;
        var treeGrid = layui.treeGrid;

        if (tableType == "treeGrid") {
            table = treeGrid;
        }

        var tableData  = [];
        var tableCache = updateTableCacheOrForm(tableId, tableType, "cache");
        if (tableCache == undefined) {
            return;
        }
        for (var i = 0; i < tableCache.length; i++) {
            tableData.push(tableCache[i]);
        }

        tableData.push(newData);
        table.reload(tableId, {
            url: "",
            data: tableData
        });
    });
}

function closeCurrentWindow() {
    var index = parent.layer.getFrameIndex(window.name);
    parent.layer.close(index);
}

function convertTimeFormat(timeCurrent) {
    var day  = timeCurrent.substring(0, 2);
    var time = timeCurrent;

    if ((day == "上午") || (day == "下午")) {
        time = time.substring(2, time.length);
        if (day == "下午") {
            var timeList = time.split(":");
            timeList[0] = Number(timeList[0]) + 12;
            time = timeList.toString().replace(/,/g, ":");
        }
    }

    return time;
}

function convertDataFromStrToDou(num) {
    return (parseFloat(num) != NaN) ? parseFloat(num) : 0.000
}

function convertTitleToUpperCase(str) {
    var strArr = str.split(" ");

    for (var i = 0; i < strArr.length; i++) {
        strArr[i] = strArr[i].slice(0, 1).toUpperCase() + strArr[i].slice(1);
    }

    return strArr.join(" ");
}

function deleteTableDataBE(tableId, tableType, msg, idName, url, param, type) {
    layui.use(["layer", "table", "treeGrid"], function() {
        var $        = layui.jquery;
        var layer    = layui.layer;
        var table    = layui.table;
        var treeGrid = layui.treeGrid;

        var checkStatus = "";

        // if (tableType == "table") {
        //     checkStatus = table.checkStatus(tableId);
        // }
        // else if (tableType == "treeGrid") {
        //     checkStatus = treeGrid.checkStatus(tableId);
        // }
        if (tableType == "treeGrid") {
            table = treeGrid;
        }
        checkStatus = table.checkStatus(tableId);

        console.log(checkStatus);
        var length = checkStatus.data.length;
        if (length == 0) {
            layer.alert("删除失败，请选择需要删除的" + msg + "!", {
                skin: "layui-layer-admin"
            });
        }
        else {
            layer.confirm("是否删除所选的" + msg + "？", {
                skin: "layui-layer-admin"
            }, function(index) {
                var dataIdArr = [];
                for (var i = 0; i < length; i++) {
                    dataIdArr.push(checkStatus.data[i][idName]);
                }

                // 仅供临时使用
                var tableCache;
                if (tableId == "productInfoTable") {
                    tableCache = table.cache[tableId];
                }
                else {
                    tableCache = updateTableCacheOrForm(tableId, tableType,
                                                        "cache");
                }

                if (tableCache == undefined || tableCache == null) {
                    return;
                }

                param.dataIdArr    = JSON.stringify(dataIdArr);
                param.dataIndexMax = tableCache.length - 1;

                layer.load();
                $.post(url, param, function(res) {
                    layer.closeAll("loading");
                    if (res == "success") {
                        layer.msg("删除成功！", {
                            time: 1000
                        }, function() {
                            if (type != "FE") {
                                table.reload(tableId, param);
                            }
                            // 采用前端删除同步，防止用户未保存的数据丢失
                            else {
                                var tableData = [];
                                var dataIdStr = dataIdArr.toString();
                                for (var i = 0; i < tableCache.length; i++) {
                                    var id = tableCache[i][idName];
                                    // 将已删除的行数据过滤掉
                                    if (dataIdStr.indexOf(id) != -1) {
                                        continue;
                                    }
                                    tableData.push(tableCache[i]);
                                }
                                table.reload(tableId, {
                                    url: "",
                                    data: tableData
                                });
                            }
                        });
                    }
                    else {
                        layer.alert("删除失败，请联系系统管理员！", {
                            skin: "layui-layer-admin"
                        });
                    }
                });
                layer.close(index);
            });
        }
    });
}

function deleteTableDataFE(tableId, tableType, msg) {
    layui.use(["layer", "table", "treeGrid"], function() {
        var $        = layui.jquery;
        var layer    = layui.layer;
        var table    = layui.table;
        var treeGrid = layui.treeGrid;

        if (tableType == "treeGrid") {
            table = treeGrid;
        }
        var checkStatus = table.checkStatus(tableId);

        console.log(checkStatus);
        if (checkStatus.data.length == 0) {
            layer.alert("删除失败，请选择需要删除的" + msg + "!", {
                skin: "layui-layer-admin"
            });
        }
        else {
            layer.confirm("是否删除所选的" + msg + "？", {
                skin: "layui-layer-admin"
            }, function(index) {
                var data = $("div[lay-id='" + tableId +
                    "'] .layui-form-checked");
                var elem = data.parents("tr");
                elem.remove();
                var tableData  = [];
                var tableCache = table.cache[tableId];

                if (tableCache == undefined) {
                    return;
                }
                for (var i = 0; i < tableCache.length; i++) {
                    tableData.push(tableCache[i]);
                }
                elem.each(function(index, item) {
                    var dataIndex = parseInt($(this).attr("data-index"));
                    tableData.splice(dataIndex, 1);
                });
                table.reload(tableId, {
                    url: "",
                    data: tableData
                });
                layer.close(index);
            });
        }
    });
}

function exportCellConfigStr(value, line, data) {
    return {
        v: value,
        t: "s",
        s: {
            font: {
                sz: 10
            },
            alignment: {
                horizontal: "center",
                vertical: "center"
            },
            border: {
                top: {
                    style: "thin",
                    color: {
                        rgb: "000000"
                    }
                },
                bottom: {
                    style: "thin",
                    color: {
                        rgb: "000000"
                    }
                },
                left: {
                    style: "thin",
                    color: {
                        rgb: "000000"
                    }
                },
                right: {
                    style: "thin",
                    color: {
                        rgb: "000000"
                    }
                }
            }
        }
    }
}

function exportTableData(url,
                         param,
                         label,
                         labelMerge,
                         merge,
                         opt,
                         col,
                         row,
                         name,
                         type,
                         data,
                         cellNumRange,
                         cellNumStyle,
                         cellNumFunc,
                         cellTxtRange,
                         cellTxtStyle,
                         cellTxtFunc) {
    layui.use(["excel", "layer"], function() {
        var $     = layui.jquery;
        var excel = layui.excel;
        var layer = layui.layer;

        var time = (new Date()).Format("yyyy-MM-dd-HH-mm-ss");
        if (type == "static") {
            $.ajaxSettings.async = false;
            layer.load();
            $.post(url, param, function(res, status) {
                layer.closeAll("loading");
                var obj = JSON.parse(res);
                data = obj.data;
            });
            $.ajaxSettings.async = true;
        }

        data.unshift(label);
        if (JSON.stringify(labelMerge) != "[]") {
            for (var i = 0; i < labelMerge.length; i++) {
                data.unshift(labelMerge[i]);
            }
        }

        console.log(opt);
        var optTemp = {};
        for (var i in label) {
            optTemp[i] = exportCellConfigStr;
        }

        data = excel.filterExportData(data, optTemp);

        if (cellNumRange != "") {
            excel.setExportCellStyle(data, cellNumRange, cellNumStyle,
                                     cellNumFunc);
        }
        if (cellTxtRange != "") {
            excel.setExportCellStyle(data, cellTxtRange, cellTxtStyle,
                                     cellTxtFunc);
        }

        var mergeConf = excel.makeMergeConfig(merge);
        var colConf = excel.makeColConfig(col, 80);
        var rowConf = excel.makeRowConfig(row, 60);

        excel.exportExcel({
            sheet1: data
        },
        name + "_" + time + ".xlsx",
        "xlsx", {
            extend: {
                "!merges": mergeConf,
                "!cols": colConf,
                "!rows": rowConf
            }
        });
    });
}

function generateRandomNumLarge() {
    return Math.round(Math.random() * 100000);
}

function generateRandomNumSmall() {
    return Math.round(Math.random() * 10000);
}

function generateRandomNumRange(lower, upper) {
    return Math.floor(Math.random() * (upper - lower + 1) + lower);
}

function getArrayUniqueValue(arrayIn) {
    arrayIn.sort();
    var arrayOut = [arrayIn[0]];
    for (var i = 1; i < arrayIn.length; i++) {
        if (arrayIn[i] !== arrayOut[arrayOut.length - 1]) {
            arrayOut.push(arrayIn[i]);
        }
    }
    return arrayOut;
}

function getArrayAvgNum(array) {
    var sum = eval(array.join("+"));
    return ~~(sum / array.length * 100) / 100;
}

function getArrayMaxNum(array) {
    return Math.max.apply(null, array);
}

function getArrayMinNum(array) {
    return Math.min.apply(null, array);
}

function getArraySortResult(arrayA, arrayB) {
    if ((arrayA != null) && (arrayB != null)) {
        if (sortType == "seriesData") {
            if (sortOrder == "asc") {
                return arrayA.value - arrayB.value;
            }
            else if (sortOrder == "desc") {
                return arrayB.value - arrayA.value;
            }
            else {
                return 0;
            }
        }
    }
    return 0;
}

function getDateHours(date1, date2) {
    if ((date1 != undefined) && (date1 != "") &&
        (date2 != undefined) && (date2 != "")) {
        date1 = new Date(date1.replace(/-/g, "/"));
        date2 = new Date(date2.replace(/-/g, "/"));
        if (date2.getTime() > date1.getTime()) {
            var ms = Math.abs(date2.getTime() - date1.getTime());
            return (ms / 1000 / 60 / 60) + 24;
        }
        else {
            return 0;
        }
    }
    else {
        return 0
    }
}

function getResponseData(type, url, data, callback) {
    layui.use(["admin"], function() {
        var $ = layui.jquery;
        if (type == "test") {
            callback();
        }
        else {
            $.post(url, data, function(data) {
                callback(data);
            });
        }
    });
}

function getAbsolutePath(path) {
    var protocol = window.document.location.protocol;
    var hostName = window.document.location.hostname;
    var portName = window.document.location.port;

    var msgRes = "success";
    var pathRes = "";
    if (path.indexOf("javascript:;") == -1) {
        path = path.replace(/\\/g, '/');
        pathRes = protocol + "//" + hostName + ":" + portName + "/ecepims" + path;
        if (path == "") {
            msgRes = "empty";
        }
    }
    else {
        pathRes = path;
    }

    return {
        msg: msgRes,
        path: pathRes
    }
}

function getTableData(tableId, url, param) {
    layui.use(["table"], function() {
        var table = layui.table;
        table.reload(tableId, {
            url: url,
            where: param
        });
    });
}

function judgeTableSelectVaild(filter, msg) {
    layui.use(["form"], function() {
        var form = layui.form;

        form.on("select(" + filter + ")", function(data) {
            console.log(data);
            var elem = data.othis;
            var value = data.value;
            if (value == "——") {
                layer.msg(msg + "不能选择【——】！", {
                    time: 2000
                });
                elem.prev("select").val("");
                form.render("select");
            }
        });
    });
}

function initTableDate(tableView, tableId, elemDate) {
    layui.use(["laydate"], function() {
        var laydate = layui.laydate;

        var elemCol = tableView.find("td[data-field='" + elemDate + "']");
        elemCol.addClass("date-icon");
        layui.each(elemCol, function(index, elem) {
            elem.onclick = function(event) {
                layui.stope(event);
            };
            laydate.render({
                elem: elem.children[0],
                type: "date",
                format: "yyyy-MM-dd",
                done: function(value, date) {
                    var tableRow = $(this.elem[0]).closest('tr');
                    var talbeCache = table.cache[tableId];
                    talbeCache[tableRow.data("index")][elemDate] = value;
                }
            });
        });
    });
}

function keepDecimal(num, n) {
    return Math.round(num * Math.pow(10, n)) / Math.pow(10, n);
}

function keepDecimalForce(num, n) {
    var result = Math.round(num * Math.pow(10, n)) / Math.pow(10, n);
    var resultStr = result.toString();
    var dotIndex = resultStr.indexOf(".");

    if (dotIndex < 0) {
        dotIndex = resultStr.length;
        resultStr += ".";
    }

    while (resultStr.length <= dotIndex + n) {
        resultStr += "0";
    }

    return resultStr;
}

function renderSelectFromTable(data, elem) {
    layui.use(["form"], function() {
        var $    = layui.jquery;
        var form = layui.form;

        var selectData = [];
        for (var i = 0; i < elem.length; i++) {
            selectData[i] = new Array();
            for (var j = 0; j < data.length; j++) {
                selectData[i].push(data[j][elem[i][0]]);
            }
            selectData[i] = getArrayUniqueValue(selectData[i]);
        }

        for (var i = 0; i < selectData.length; i++) {
            if (selectData[i].length > 0) {
                $(elem[i][1]).empty();
                $(elem[i][1]).prepend("<option value=''>" + elem[i][2] +
                    "</option>");
                for (var j = 0; j < selectData[i].length; j++) {
                    $(elem[i][1]).append("<option value='" + selectData[i][j] +
                        "'>" + selectData[i][j] + "</option>");
                }
            }
        }

        form.render("select");
    });
}

function removeBlankHeadAndTail(str) {
    return str.trim();
}

function removeBlankAll(str) {
    return str = str.replace(/\s*/g, "");
}

function resetTableData(tableId, msg, valueType, elem) {
    layui.use(["layer", "table"], function() {
        var $     = layui.jquery;
        var layer = layui.layer;
        var table = layui.table;

        var checkStatus = table.checkStatus(tableId);
        if (checkStatus.data.length == 0) {
            layer.alert("重置失败，请选择需要重置的" + msg + "!", {
                skin: "layui-layer-admin"
            });
        }
        else {
            layer.confirm("是否重置所选的" + msg + "？", {
                skin: "layui-layer-admin"
            }, function(index) {
                var tableData  = [];
                var tableCache = table.cache[tableId];
                if (tableCache == undefined) {
                    return;
                }
                var selectorPrefix = "div[lay-id='" + tableId + "'] ";
                for (var i = 0; i < tableCache.length; i++) {
                    var data = tableCache[i];
                    var getType = Object.prototype.toString;
                    var tableElem = $(selectorPrefix +
                        ".layui-table-fixed-l tr[data-index='" + i + "'] " +
                        ".layui-form-checkbox");
                    if (tableElem.hasClass("layui-form-checked")) {
                        data["LAY_CHECKED"] = false;
                        for (var j = 0; j < elem.length; j++) {
                            if ($(selectorPrefix +
                                "tr[data-index='" + i + "'] " +
                                "td[data-content='——'][data-field='" +
                                elem[j] + "'] input").prop(
                                "disabled")) {
                                continue;
                            }
                            if (valueType == "stringNum") {
                                data[elem[j]] = "0.000";
                                continue;
                            }
                            if (getType.call(data[elem[j]]) ==
                                "[object String]") {
                                data[elem[j]] = "";
                            }
                            else if (getType.call(data[elem[j]]) ==
                                "[object Number]") {
                                data[elem[j]] = 0;
                            }
                            else {
                                data[elem[j]] = null;
                            }
                        }
                    }
                    tableData.push(data);
                }
                table.reload(tableId, {
                    url: "",
                    data: tableData
                });
                layer.close(index);
            });
        }
    });
}

function saveTableDataBE(tableId, tableType, url, param, msg, closeFlag,
                         reloadFlag) {
    layui.use(["admin", "layer", "table"], function() {
        var $     = layui.jquery;
        var admin = layui.admin;
        var layer = layui.layer;
        var table = layui.table;

        var tableCache = updateTableCacheOrForm(tableId, tableType, "cache");
        tableCache = JSON.stringify(tableCache);

        param.tableData = tableCache;

        layer.load();
        $.post(url, param, function(res, status) {
            layer.closeAll("loading");
            if (res == "success") {
                layer.msg(msg, {
                    time: 1000
                }, function() {
                    if (closeFlag) {
                        admin.closeThisDialog();
                    }
                    if (reloadFlag) {
                        table.reload(tableId, {
                            where: param
                        });
                    }
                });
            }
            else {
                layer.alert("保存失败，请联系系统管理员！", {
                    skin: "layui-layer-admin"
                });
            }
        });
    });
}

function saveTableDataBECallback(tableId, tableType, url, param, callback) {
    layui.use(["admin", "layer", "table"], function() {
        var $     = layui.jquery;
        var admin = layui.admin;
        var layer = layui.layer;
        var table = layui.table;

        var tableCache = updateTableCacheOrForm(tableId, tableType, "cache");
        tableCache = JSON.stringify(tableCache);

        param.tableData = tableCache;

        layer.load();
        $.post(url, param, function(res, status) {
            layer.closeAll("loading");
            callback(res);
        });
    });
}

function searchTableData(tableId, url, param) {
    layui.use(["admin", "layer", "table"], function() {
        var table = layui.table;

        table.reload(tableId, {
            url: url,
            page: {
                curr: 1
            },
            where: param
        });
    });
}

function scrollTableContents(tableId, delayMs) {
    layui.use(["table"], function() {
        var $     = layui.jquery;
        var table = layui.table;

        var i = 0;
        var tableRowHeight = $(
            "div[lay-id='" + tableId + "'] tbody tr").outerHeight();

        var timerIndex = 0;

        function setTableTimer() {
            $("div[lay-id='" + tableId + "'] .layui-table-body table").css(
                "margin-top",
                i + "px");
            if (Math.abs(i) == tableRowHeight) {
                var tableCache = table.cache[tableId];
                if (tableCache == undefined) {
                    return;
                }
                else {
                    clearInterval(timerIndex);
                    var tableTop = tableCache.shift();
                    tableCache.push(tableTop);
                    table.reload(tableId, {
                        url: "",
                        data: tableCache
                    });
                }
            }
            i--;
        }
        timerIndex = setInterval(setTableTimer, delayMs);

        $("div[lay-id='" + tableId + "'] tbody").hover(function() {
            clearInterval(timerIndex);
        }, function() {
            clearInterval(timerIndex);
            timerIndex = setInterval(setTableTimer, delayMs);
        });
    });
}

function setArraySortOptions(type, order) {
    sortType  = type;
    sortOrder = order;
}

function updateTableCacheOrForm(tableId, tableType, op) {
    var tableCache;

    layui.use(["table", "treeGrid"], function() {
        var $        = layui.jquery;
        var table    = layui.table;
        var treeGrid = layui.treeGrid;

        op = op || "form";
        var divForm = $("#" + tableId).next();

        if (tableType == "table") {
            tableCache = table.cache[tableId];
        }
        else if (tableType == "treeGrid") {
            tableCache = treeGrid.cache[tableId].data.list;
        }
        console.log(tableCache);

        var tableRows = divForm.find(".layui-table-body tr");
        tableRows.each(function() {
            var tableRow = $(this);
            var dataIndex = tableRow.attr("data-index");
            tableRow.find("td").each(function() {
                var tableCol = $(this);
                var fieldName = tableCol.attr("data-field");
                // 更新下拉菜单数据
                var tableSelect = tableCol.find("select");
                if (tableSelect.length == 1) {
                    if (op == "cache") {
                        tableCache[dataIndex][fieldName] =
                            tableSelect.eq(0).val();
                    }
                    else if (op == "form") {
                        tableSelect.eq(0).val(
                            tableCache[dataIndex][fieldName]);
                    }
                }
                // 更新输入框数据
                var tableInput = tableCol.find(".ecep-table-input");
                if (tableInput.length == 1) {
                    if (op == "cache") {
                        tableCache[dataIndex][fieldName] =
                            tableInput.eq(0).val();
                    }
                    else if (op == "form") {
                        tableInput.eq(0).val(tableCache[dataIndex][fieldName]);
                    }
                }
            });
        });
    });

    return tableCache;
}

function updateTableCacheOrFormRow(tableId, tableType, op, tableRow) {
    var tableCache;

    layui.use(["form", "table", "treeGrid"], function() {
        var $        = layui.jquery;
        var table    = layui.table;
        var treeGrid = layui.treeGrid;

        op = op || "form";

        if (tableType == "table") {
            tableCache = table.cache[tableId];
        }
        else if (tableType == "treeGrid") {
            tableCache = treeGrid.cache[tableId].data.list;
        }

        var dataIndex = tableRow.attr("data-index");
        tableRow.find("td").each(function() {
            var tableCol = $(this);
            var fieldName = tableCol.attr("data-field");
            // 更新下拉菜单数据
            var tableSelect = tableCol.find("select");
            if (tableSelect.length == 1) {
                if (op == "cache") {
                    tableCache[dataIndex][fieldName] =
                        tableSelect.eq(0).val();
                }
                else if (op == "form") {
                    tableSelect.eq(0).val(
                        tableCache[dataIndex][fieldName]);
                }
            }
            // 更新输入框数据
            var tableInput = tableCol.find(".ecep-table-input");
            if (tableInput.length == 1) {
                if (op == "cache") {
                    tableCache[dataIndex][fieldName] =
                        tableInput.eq(0).val();
                }
                else if (op == "form") {
                    tableInput.eq(0).val(tableCache[dataIndex][fieldName]);
                }
            }
        });
    });

    return tableCache;
}

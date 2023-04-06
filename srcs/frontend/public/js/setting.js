layui.use(["admin", "form"], function() {
    var $     = layui.jquery;
    var admin = layui.admin;

    $(document).ready(function() {
        doChangeTheme("init", layui.data(admin.tableName).theme);
    });

    function doChangeTheme(type, theme) {
        $(".btnTheme").removeClass("active");
        if (theme) {
            $(".btnTheme[theme=" + theme + "]").addClass("active");
            if (type === "init") {
                return;
            }
            layui.data(admin.tableName, {
                key: "theme",
                value: theme
            });
        }
        try {
            top.layui.admin.changeTheme(getThemeDir() + theme + ".css");
        }
        catch (e) {
            console.warn(e);
        }
    }

    $(".btnTheme").click(function() {
        var theme = $(this).attr("theme");
        doChangeTheme("switch", theme);
    });
});

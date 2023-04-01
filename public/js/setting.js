layui.use(["admin", "form"], function() {
    var $     = layui.jquery;
    var admin = layui.admin;

    function doChangeTheme(theme) {
        $(".btnTheme").removeClass("active");
        if (theme) {
            $(".btnTheme[theme=" + theme + "]").addClass("active");
            // layui.data(admin.tableName, {
            //     key: "theme",
            //     value: theme
            // });
        }
        else {
            $(".btnTheme").eq(0).addClass("active");
            theme = $(".btnTheme").eq(0).attr("theme");
            // layui.data(admin.tableName, {
            //     key: "theme",
            //     remove: true
            // });
        }
        layui.data(admin.tableName, {
            key: "theme",
            value: theme
        });

        try {
            top.layui.admin.changeTheme(
                theme ? getThemeDir() + theme + ".css" : theme);
        }
        catch (e) {
            console.warn(e);
        }
    }

    doChangeTheme(layui.data(admin.tableName).theme);

    $(".btnTheme").click(function() {
        var theme = $(this).attr("theme");
        doChangeTheme(theme);
    });
});

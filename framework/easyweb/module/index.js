/** EasyWeb iframe v3.0.9 data:2018-12-24 */

layui.define(['layer', 'admin', 'element'], function (exports) {
    var $ = layui.jquery;
    var layer = layui.layer;
    var admin = layui.admin;
    var element = layui.element;
    var cacheTab = layui.data(admin.tableName).cacheTab;
    var tabEndCall = {};
    var bodyDOM = '.layui-layout-admin>.layui-body';
    var tabDOM = bodyDOM + '>.layui-tab';
    var tabFilter = 'admin-pagetabs';
    var navFilter = 'admin-side-nav';

    var index = {
        pageTabs: true,  // 是否开启多标签
        cacheTab: cacheTab == undefined ? false : cacheTab,  // 是否记忆打开的选项卡
        mTabList: [], // 当前Tab
        mTabPosition: undefined, // 当前选中Tab
        // 加载主体部分
        loadView: function (param) {
            var menuPath = param.menuPath;
            var menuName = param.menuName;
            if (!menuPath) {
                console.error('url不能为空');
                layer.msg('url不能为空', {icon: 2});
                return;
            }
            // 是否开启多标签
            if (index.pageTabs) {
                // 判断选项卡是否已添加
                var flag = false;
                $(tabDOM + '>.layui-tab-title>li').each(function () {
                    if ($(this).attr('lay-id') === menuPath) {
                        flag = true;
                        return false;
                    }
                });
                // 没有则添加
                if (!flag) {
                    element.tabAdd(tabFilter, {
                        id: menuPath,
                        title: menuName ? menuName : '无标题',
                        content: '<iframe src="' + menuPath + '" frameborder="0" class="admin-iframe"></iframe>'
                    });
                    index.mTabList.push(param);
                    if (index.cacheTab) {  // 记忆选项卡
                        admin.putTempData('indexTabs', index.mTabList);
                    }
                }
                // 切换到该选项卡
                element.tabChange(tabFilter, menuPath);
            } else {
                var $contentDom = $(bodyDOM + '>.admin-iframe');
                if (!$contentDom || $contentDom.length <= 0) {
                    $(bodyDOM).html('<iframe src="' + menuPath + '" frameborder="0" class="admin-iframe"></iframe>');
                } else {
                    $contentDom.attr('src', menuPath);
                }
                // 记忆选项卡
                index.mTabList.splice(0, index.mTabList.length);
                index.mTabList.push(param);
                if (index.cacheTab) {
                    admin.putTempData('indexTabs', index.mTabList);
                }
                // 记录当前Tab位置
                index.mTabPosition = param.menuPath;
                if (index.cacheTab) {
                    admin.putTempData('tabPosition', index.mTabPosition);
                }
            }
            // 移动设备切换页面隐藏侧导航
            if (admin.getPageWidth() <= 750) {
                admin.flexible(true);
            }
        },
        // 打开新页面
        openTab: function (param) {
            var url = param.url;
            var title = param.title;
            if (param.end) {
                tabEndCall[url] = param.end;
            }
            index.loadView({
                menuPath: url,
                menuName: title
            });
        },
        // 关闭选项卡
        closeTab: function (url) {
            element.tabDelete(tabFilter, url);
        },
        // 加载设置
        loadSetting: function () {
            // 恢复记忆的tab选项卡
            if (index.cacheTab) {
                var indexTabs = admin.getTempData('indexTabs');
                if (indexTabs) {
                    var tabPosition = admin.getTempData('tabPosition');
                    var mi = -1;
                    for (var i = 0; i < indexTabs.length; i++) {
                        if (index.pageTabs) {
                            index.loadView(indexTabs[i]);
                        }
                        if (indexTabs[i].menuPath == tabPosition) {
                            mi = i;
                        }
                    }
                    if (mi != -1) {
                        setTimeout(function () {
                            index.loadView(indexTabs[mi]);
                            if (!index.pageTabs) {
                                admin.activeNav(tabPosition);
                            }
                        }, 500);
                    }
                }
            }
            // 是否开启footer
            var openFooter = layui.data(admin.tableName).openFooter;
            if (openFooter != undefined && openFooter == false) {
                $('body.layui-layout-body').addClass('close-footer');
            }
            // 是否开启tab自动刷新
            var tabAutoRefresh = layui.data(admin.tableName).tabAutoRefresh;
            if (tabAutoRefresh) {
                $(tabDOM).attr('lay-autoRefresh', 'true');
            }
        },
        // 设置是否记忆Tab
        setTabCache: function (isCache) {
            layui.data(admin.tableName, {key: 'cacheTab', value: isCache});
            index.cacheTab = isCache;
            if (isCache) {
                admin.putTempData('indexTabs', index.mTabList);
                admin.putTempData('tabPosition', index.mTabPosition);
            } else {
                admin.putTempData('indexTabs', []);
                admin.putTempData('tabPosition', undefined);
            }
        },
        // 清除选项卡记忆
        closeTabCache: function () {
            admin.putTempData('indexTabs', undefined);
        }
    };

    // 监听侧导航栏点击事件
    element.on('nav(' + navFilter + ')', function (elem) {
        var $that = $(elem);
        var menuUrl = $that.attr('lay-href');
        if (menuUrl && menuUrl != 'javascript:;') {
            var menuName = $that.text().replace(/(^\s*)|(\s*$)/g, '');
            index.loadView({
                menuPath: menuUrl,
                menuName: menuName
            });
        } else if ($('.layui-side .layui-nav-tree').attr('lay-accordion') == 'true' && $that.parent().hasClass('layui-nav-item')) {
            if ($that.parent().hasClass('layui-nav-itemed') || $that.parent().hasClass('layui-this')) {
                $('.layui-layout-admin>.layui-side .layui-nav .layui-nav-item').removeClass('layui-nav-itemed');
                $that.parent().addClass('layui-nav-itemed');
            }
            $that.trigger('mouseenter');
        } else {
            admin.setNavHoverCss($that.parentsUntil('.layui-nav-item').parent().children().eq(0));
        }
    });

    // tab选项卡切换监听
    element.on('tab(' + tabFilter + ')', function (data) {
        var layId = $(this).attr('lay-id');

        index.mTabPosition = layId;  // 记录当前Tab位置
        if (index.cacheTab) {
            admin.putTempData('tabPosition', index.mTabPosition);
        }
        admin.rollPage('auto');  // 自动滚动
        admin.activeNav(layId);  // 设置导航栏选中

        // 解决切换tab滚动条时而消失的问题
        var $iframe = $(tabDOM + '>.layui-tab-content>.layui-tab-item.layui-show .admin-iframe')[0];
        if ($iframe) {
            $iframe.style.height = "99%";
            $iframe.scrollWidth;
            $iframe.style.height = "100%";
        }
        $iframe.focus();

        // 切换tab自动刷新
        var autoRefresh = $(tabDOM).attr('lay-autoRefresh');
        if (autoRefresh == 'true') {
            setTimeout(function () {
                admin.refresh();
            }, 300);
        }
    });

    // tab选项卡删除监听
    element.on('tabDelete(' + tabFilter + ')', function (data) {
        var layId = index.mTabList[data.index].menuPath;
        index.mTabList.splice(data.index, 1);
        if (index.cacheTab) {
            admin.putTempData('indexTabs', index.mTabList);
        }
        if (tabEndCall[layId]) {
            tabEndCall[layId].call();
        }
    });

    // 是否开启多标签
    var openTab = layui.data(admin.tableName).openTab;
    if (openTab != undefined) {
        index.pageTabs = openTab;
    }

    exports('index', index);
});

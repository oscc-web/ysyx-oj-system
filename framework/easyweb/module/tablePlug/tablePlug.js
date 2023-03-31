/**

 @Name：tablePlug 表格拓展插件
 @Author：岁月小偷
 @License：MIT
 @version 0.1.0

 */
layui.define(['table'], function (exports) {
  "use strict";

  var version = '0.1.5';

  var filePath = layui.cache.modules.tablePlug.substr(0, layui.cache.modules.tablePlug.lastIndexOf('/'));
  // 引入tablePlug.css
  layui.link(filePath + '/tablePlug.css?v' + version);
  // 引入图标文件
  layui.link(filePath + '/icon/iconfont.css?v' + version);

  // 异步地将独立功能《优化layui的select的选项设置》引入
  layui.extend({optimizeSelectOption: '{/}' + filePath + '/optimizeSelectOption/optimizeSelectOption'}).use('optimizeSelectOption');

  var $ = layui.$
    , laytpl = layui.laytpl
    , laypage = layui.laypage
    , layer = layui.layer
    , form = layui.form
    , util = layui.util
    , table = layui.table
    , hint = layui.hint()
    , device = layui.device()
    , layuiVersion = '2.4.5' // 基于2.4.5开发的
    // 检测是否满足智能重载的条件 检测是否修改了源码将构造出还有thisTable透漏出来
    , checkSmartReloadCodition = (function () {
      if (layui.device().ie && parseInt(layui.device().ie) < 9) {
        console.warn('tablePlug插件暂时不支持ie9以下的ie浏览器，如果需要支持可自行调试，一般就是一些数组的方法ie8没有还有一个重要的就是window.parent这些支持不好，在getPosition的时候会死循环，如果有这方面相关的经验有处理方法请分享给俺，谢谢。')
      }
      if (table.thisTable && table.Class) {
        // console.info('欢迎使用tablePlug插件，使用过程中有任何问题或者有什么建议都可以到码云上新建issues', 'https://gitee.com/sun_zoro/layuiTablePlug');
        return true;
      } else {
        console.error('如果要使用该插件（tablePlug），参照readme.md的说明修改layui的table模块的代码，目前该组件是基于layui-V' + layuiVersion, 'https://gitee.com/sun_zoro/layuiTablePlug');
        return false;
      }
    })()
    , tablePlug = {
      version: version // tablePlug的版本后面提交的时候会更新也好知道使用的是不是同一个版本
    }
    , tableIns = {}
    , CHECK_TYPE_ADDITIONAL = 'additional'  // 新增的
    , CHECK_TYPE_REMOVED = 'removed'  // 删除的
    , CHECK_TYPE_ORIGINAL = 'original' // 原有的
    , CHECK_TYPE_DISABLED = 'disabled' // 不可选的
    , ELEM_BODY = '.layui-table-body'
    , FIXED_SCROLL = 'layui-table-fixed-scroll'
    , NONE = 'layui-none'
    , HIDE = 'layui-hide'
    , LOADING = 'layui-tablePlug-loading-p'
    , ELEM_HEADER = '.layui-table-header'
    , COLGROUP = 'colGroup' // 定义一个变量，方便后面如果table内部有变化可以对应的修改一下即可
    , tableSpacialColType = ['numbers', 'checkbox', 'radio'] // 表格的特殊类型字段
    , LayuiTableColFilter = [
      '<span class="layui-table-filter layui-inline">',
      '<span class="layui-tablePlug-icon layui-tablePlug-icon-filter"></span>',
      '</span>'
    ]
    , filterLayerIndex // 保存打开字段过滤的layer的index
    , getIns = function (id) {
      return table.thisTable.that[id];
    }

    , tableCheck = function () {
      var checked = {};
      return {
        // 检验是否可用，是否初始化过
        check: function (tableId) {
          return !!checked[tableId];
        },
        reset: function (tableId) {
          if (!checked[tableId]) {
            checked[tableId] = {};
            checked[tableId][CHECK_TYPE_ORIGINAL] = [];
            checked[tableId][CHECK_TYPE_ADDITIONAL] = [];
            checked[tableId][CHECK_TYPE_REMOVED] = [];
            checked[tableId][CHECK_TYPE_DISABLED] = [];
          } else {
            this.set(tableId, CHECK_TYPE_ADDITIONAL, []);    // 新增的
            this.set(tableId, CHECK_TYPE_REMOVED, []);       // 删除的
          }
        },
        init: function (tableId, data) {
          this.reset(tableId);
          this.set(tableId, CHECK_TYPE_ORIGINAL, data);
        },
        // 设置部分记录不可选
        disabled: function (tableId, data) {
          if (!checked[tableId]) {
            this.reset(tableId);
          }
          this.set(tableId, CHECK_TYPE_DISABLED, data);
        },
        checkDisabled: function (tableId, value) {
          return this.get(tableId, CHECK_TYPE_DISABLED).indexOf(value) !== -1;
        },
        // 获得当前选中的，不区分状态
        getChecked: function (tableId) {
          var delArr = this.get(tableId, CHECK_TYPE_REMOVED);

          var retTemp = this.get(tableId, CHECK_TYPE_ORIGINAL).concat(this.get(tableId, CHECK_TYPE_ADDITIONAL));
          var ret = [];
          layui.each(retTemp, function (index, data) {
            if (delArr.indexOf(data) === -1 && ret.indexOf(data) === -1) {
              ret.push(data);
            }
          });
          return ret;
        },
        get: function (tableId, type) {
          if (type === CHECK_TYPE_ADDITIONAL
            || type === CHECK_TYPE_REMOVED
            || type === CHECK_TYPE_ORIGINAL
            || type === CHECK_TYPE_DISABLED) {
            return checked[tableId] ? (checked[tableId][type] || []) : [];
          } else {
            return checked[tableId];
          }
        },
        set: function (tableId, type, data) {
          if (type !== CHECK_TYPE_ORIGINAL
            && type !== CHECK_TYPE_ADDITIONAL
            && type !== CHECK_TYPE_REMOVED
            && type !== CHECK_TYPE_DISABLED) {
            return;
          }
          checked[tableId][type] = (!data || !isArray(data)) ? [] : data;
        },
        update: function (tableId, id, checkedStatus) {
          var _original = checked[tableId][CHECK_TYPE_ORIGINAL];
          var _additional = checked[tableId][CHECK_TYPE_ADDITIONAL];
          var _removed = checked[tableId][CHECK_TYPE_REMOVED];
          if (checkedStatus) {
            // 勾选
            if (_original.indexOf(id) === -1) {
              // 不在原来的集合中
              if (_additional.indexOf(id) === -1) {
                _additional.push(id);
              } else {
                // 多余的，但是应该是避免这从情况的
              }
            } else {
              // 在原来的集合中，意味着之前有去掉勾选的操作
              if (_removed.indexOf(id) !== -1) {
                _removed.splice(_removed.indexOf(id), 1);
              }
            }
          } else {
            // 取消勾选
            if (_original.indexOf(id) === -1) {
              // 不在原来的集合中，意味着以前曾经添加过
              if (_additional.indexOf(id) !== -1) {
                _additional.splice(_additional.indexOf(id), 1);
              }
            } else {
              // 在原来的集合中
              if (_removed.indexOf(id) === -1) {
                _removed.push(id);
              }
            }
          }
        }
      }
    }()

    , isArray = function (obj) {
      // 判断一个变量是不是数组
      return Object.prototype.toString.call(obj) === '[object Array]';
    }

    // 针对表格中是否选中的数据处理
    , dataRenderChecked = function (data, tableId, config) {
      if (!data || !tableId) {
        return;
      }
      config = config || getConfig(tableId);
      if (!config || !config.checkStatus) {
        return;
      }
      var nodeSelected = tableCheck.getChecked(tableId);
      for (var i = 0; i < data.length; i++) {
        data[i][table.config.checkName] = nodeSelected.indexOf(data[i][getPrimaryKey(config)]) !== -1;
      }
    }

    // 同步表格不可点击的checkbox
    , disabledCheck = function (tableId, syncConfig) {
      // tableId 这个参数有可能传入table的id也可以直接传入table的实例
      // syncConfig是否需要同步config
      // var config = getConfig(tableId);
      var config;
      if (typeof tableId === 'string') {
        config = getConfig(tableId);
      } else {
        config = tableId.config;
        tableId = config ? config.id : '';
      }

      if (!config) {
        return;
      }
      var tableView = config.elem.next();

      if (syncConfig) {
        config.checkDisabled = config.checkDisabled || {};
        config.checkDisabled.enabled = config.checkDisabled.enabled || true;
        config.checkDisabled.data = tableCheck.get(tableId, CHECK_TYPE_DISABLED) || [];
      }
      if (config.checkDisabled && config.checkDisabled.enabled) {
        layui.each(table.cache[tableId], function (index, data) {
          tableView.find('.layui-table-body')
            .find('tr[data-index="' + index + '"]')
            .find('input[name="layTableCheckbox"]')
            .prop('disabled', tableCheck.checkDisabled(tableId, data[getPrimaryKey(config)]));
        });
      } else {
        tableCheck.set(tableId, CHECK_TYPE_DISABLED, []);
      }

      tableView.find('input[lay-filter="layTableAllChoose"]').prop('checked', table.checkStatus(tableId).isAll);
      form.render('checkbox', tableView.attr('lay-filter'));
    };

  // 对table的全局config进行深拷贝
  tablePlug.set = function (config) {
    $.extend(true, table.config, config || {});
  };

  // 为啥要自己定义一个set去更新table.config而不用table.set？
  // 因为table.set实际是非深拷贝，然后我这里期待的是一个可以根据需要后面根据开发者需要去丰富pageLanguageText的内容的而不是set的时候需要把plug里面写的初始的也全部写上
  tablePlug.set({
    pageLanguageText: {
      // 自定义table的page组件中的多语言支持，实际这个完全可以自己定义，想要显示的文字，但是建议实用为主，真的需要再去定义
      en: {
        jumpTo: 'jump to', // 到第
        page: 'page', // 页
        go: 'go', // 确定
        total: 'total', // 共
        unit: '', // 条（单位，一般也可以不填）
        optionText: 'limit each page' // 条/页
      }
      // 定义中文简写的, (如果需要的话，建议不改，按照原来的就行)
      // 'zh-CN': {
      //
      // }
      // 比如定义中文繁体
      // 'zh-TW': {
      //
      // }
    }
  });

  // 获得某个节点的位置 offsetTop: 是否获得相对top window的位移
  function getPosition(elem, _window, offsetTop) {
    _window = _window || window;
    var $ = _window.$ || _window.layui.$;
    if (!$) {
      console.log('该功能必须依赖jquery,请先为', _window, '窗口引入jquery先');
    }
    var offsetTemp = {};
    if (offsetTop && _window.top !== _window.self) {
      // if (!parent.layui.tablePlug) {
      //   console.log('该功能必须依赖tablePlug请先引入');
      // } else {
      //   offsetTemp = parent.layui.tablePlug.getPosition($(window.frames.frameElement), _window.parent, offsetTop);
      // }
      offsetTemp = getPosition($(_window.frames.frameElement), _window.parent, offsetTop);
    }
    var bodyOffset = $('body').hasClass('layui-container') ? $('body').offset() : {top: 0, left: 0};
    return {
      top: (offsetTemp.top || 0) + elem.offset().top - bodyOffset.top - $(_window.document).scrollTop(),
      left: (offsetTemp.left || 0) + elem.offset().left - bodyOffset.left - $(_window.document).scrollLeft()
    }
  }

  // 修改原始table的loading的逻辑
  var loading = table.Class.prototype.loading;
  table.Class.prototype.loading = function (hide) {
    var that = this;
    loading.call(that, hide);
    if (!hide && that.layInit) {
      that.layInit.remove();
      // 添加一个动画
      that.layInit.addClass('layui-anim layui-anim-rotate layui-anim-loop');
      if (!that.layMain.height()) {
        // 如果当前没有内容，添加一个空的div让它有显示的地方
        that.layBox.append($('<div class="' + LOADING + '" style="height: 56px;"></div>'));
      }
      var offsetHeight = 0;
      if (that.layMain.height() - that.layMain.prop('clientHeight') > 0) {
        // 如果出现滚动条，要减去滚动条的宽度
        offsetHeight = that.getScrollWidth();
      }
      that.layInit.height(that.layBox.height() - that.layHeader.height() - offsetHeight).css('marginTop', that.layHeader.height() + 'px');
      that.layBox.append(that.layInit);
    }
  };

  // 初始化表格的内容
  table.Class.prototype.initTable = function () {
    var that = this;

    that.layFixed.find('tbody').html('');
    that.layFixed.addClass(HIDE);
    that.layTotal.addClass(HIDE);
    that.layPage.addClass(HIDE);

    that.layMain.find('tbody').html('');
    that.layMain.find('.' + NONE).remove();

    that.layHeader.find('input[name="layTableCheckbox"]').prop('checked', false);

    that.renderForm('checkbox');
  };

  // 渲染完成之后的回调
  var renderDone = function () {
    var that = this;
    // 同步不可选的状态
    disabledCheck(that);
    // 添加筛选的功能
    addFieldFilter.call(that);

    if (!that.layMain.find('.' + NONE).length) {
      that.layTotal.removeClass(HIDE);
      that.layFixLeft.removeClass(HIDE);
    }

    layui.each(that.tempData, function (index, data) {
      that.addTemp(index + 1, data, null, true);
    })
  };

  //获得数据
  table.Class.prototype.pullData = function (curr) {
    var that = this
      , options = that.config
      , request = options.request
      , response = options.response
      , sort = function () {
      if (typeof options.initSort === 'object') {
        that.sort(options.initSort.field, options.initSort.type);
      }
    };

    var dataTemp = table.getTemp(that.key);
    // 存储临时数据
    that.tempData = dataTemp.data;

    that.startTime = new Date().getTime(); //渲染开始时间

    if (options.url) { //Ajax请求
      var params = {};
      params[request.pageName] = curr;
      params[request.limitName] = options.limit;

      //参数
      var data = $.extend(params, options.where);
      if (options.contentType && options.contentType.indexOf("application/json") == 0) { //提交 json 格式
        data = JSON.stringify(data);
      }

      $.ajax({
        type: options.method || 'get'
        , url: options.url
        , contentType: options.contentType
        , data: data
        , dataType: 'json'
        , headers: options.headers || {}
        , success: function (res) {
          //如果有数据解析的回调，则获得其返回的数据
          if (typeof options.parseData === 'function') {
            res = options.parseData(res) || res;
          }
          //检查数据格式是否符合规范
          if (res[response.statusName] != response.statusCode) {
            that.renderForm();
            // #### 源码修改 #### 直接在源头处理掉一些不太合理的地方避免智能重载后面还需要打补丁
            that.initTable();
            that.layMain.append('<div class="' + NONE + '">' + (
              res[response.msgName] ||
              ('返回的数据不符合规范，正确的成功状态码 (' + response.statusName + ') 应为：' + response.statusCode)
            ) + '</div>');
          } else {
            that.renderData(res, curr, res[response.countName]), sort();
            options.time = (new Date().getTime() - that.startTime) + ' ms'; //耗时（接口请求+视图渲染）
          }
          that.setColsWidth();
          typeof options.done === 'function' && options.done(res, curr, res[response.countName]);
          // renderDone.call(that);
        }
        , error: function (e, m) {
          // #### 源码修改 #### 直接在源头处理掉一些不太合理的地方避免智能重载后面还需要打补丁
          that.initTable();
          // that.layMain.html('<div class="'+ NONE +'">数据接口请求异常：'+ m +'</div>');
          that.layMain.append('<div class="' + NONE + '">数据接口请求异常：' + m + '</div>');
          that.renderForm();
          that.setColsWidth();
          // renderDone.call(that);
        }
      });
    } else if (options.data && options.data.constructor === Array) { //已知数据
      var res = {}
        , startLimit = curr * options.limit - options.limit

      res[response.dataName] = options.data.concat().splice(startLimit, options.limit);
      res[response.countName] = options.data.length;

      that.initTable();
      that.renderData(res, curr, options.data.length), sort();
      that.setColsWidth();
      typeof options.done === 'function' && options.done(res, curr, res[response.countName]);
    }
  };

  // 数据渲染
  table.Class.prototype.renderData = function (res, curr, count, sort) {
    var that = this
      , options = that.config
      , data = res[options.response.dataName] || []
      , trs = []
      , trs_fixed = []
      , trs_fixed_r = []

      //渲染视图
      , render = function () { //后续性能提升的重点
        var thisCheckedRowIndex;
        if (!sort && that.sortKey) {
          return that.sort(that.sortKey.field, that.sortKey.sort, true);
        }
        layui.each(data, function (i1, item1) {
          var tds = [], tds_fixed = [], tds_fixed_r = []
            , numbers = i1 + options.limit * (curr - 1) + 1; //序号

          if (item1.length === 0) return;
          if (!sort) {
            item1[table.config.indexName] = i1;
          }

          that.eachCols(function (i3, item3) {
            var field = item3.field || i3
              , key = options.index + '-' + item3.key
              , content = item1[field];

            if (content === undefined || content === null) content = '';
            if (item3.colGroup) return;

            //td内容
            var td = ['<td data-field="' + field + '" data-key="' + key + '" ' + function () { //追加各种属性
              var attr = [];
              if (item3.edit) attr.push('data-edit="' + item3.edit + '"'); //是否允许单元格编辑
              if (item3.align) attr.push('align="' + item3.align + '"'); //对齐方式
              if (item3.templet) attr.push('data-content="' + content + '"'); //自定义模板
              if (item3.toolbar) attr.push('data-off="true"'); //行工具列关闭单元格事件
              if (item3.event) attr.push('lay-event="' + item3.event + '"'); //自定义事件
              if (item3.style) attr.push('style="' + item3.style + '"'); //自定义样式
              if (item3.minWidth) attr.push('data-minwidth="' + item3.minWidth + '"'); //单元格最小宽度
              return attr.join(' ');
            }() + ' class="' + function () { //追加样式
              var classNames = [];
              if (item3.hide) classNames.push(HIDE); //插入隐藏列样式
              if (!item3.field) classNames.push('layui-table-col-special'); //插入特殊列样式
              return classNames.join(' ');
            }() + '">'
              , '<div class="layui-table-cell laytable-cell-' + function () { //返回对应的CSS类标识
                return item3.type === 'normal' ? key
                  : (key + ' laytable-cell-' + item3.type);
              }() + '">' + function () {
                var tplData = $.extend(true, {
                  LAY_INDEX: numbers
                }, item1)
                  , checkName = table.config.checkName;

                //渲染不同风格的列
                switch (item3.type) {
                  case 'checkbox':
                    return '<input type="checkbox" name="layTableCheckbox" lay-skin="primary" ' + function () {
                      //如果是全选
                      if (item3[checkName]) {
                        item1[checkName] = item3[checkName];
                        return item3[checkName] ? 'checked' : '';
                      }
                      return tplData[checkName] ? 'checked' : '';
                    }() + '>';
                    break;
                  case 'radio':
                    if (tplData[checkName]) {
                      thisCheckedRowIndex = i1;
                    }
                    return '<input type="radio" name="layTableRadio_' + options.index + '" '
                      + (tplData[checkName] ? 'checked' : '') + ' lay-type="layTableRadio">';
                    break;
                  case 'numbers':
                    return numbers;
                    break;
                }
                ;

                //解析工具列模板
                if (item3.toolbar) {
                  return laytpl($(item3.toolbar).html() || '').render(tplData);
                }
                return item3.templet ? function () {
                  return typeof item3.templet === 'function'
                    ? item3.templet(tplData)
                    : laytpl($(item3.templet).html() || String(content)).render(tplData)
                }() : content;
              }()
              , '</div></td>'].join('');

            tds.push(td);
            if (item3.fixed && item3.fixed !== 'right') tds_fixed.push(td);
            if (item3.fixed === 'right') tds_fixed_r.push(td);
          });

          trs.push('<tr data-index="' + i1 + '">' + tds.join('') + '</tr>');
          trs_fixed.push('<tr data-index="' + i1 + '">' + tds_fixed.join('') + '</tr>');
          trs_fixed_r.push('<tr data-index="' + i1 + '">' + tds_fixed_r.join('') + '</tr>');
        });

        that.layBody.scrollTop(0);
        // 如果没有数据才需要删除NONE
        !data.length || that.layMain.find('.' + NONE).remove();
        that.layMain.find('tbody').html(trs.join(''));
        that.layFixLeft.find('tbody').html(trs_fixed.join(''));
        that.layFixRight.find('tbody').html(trs_fixed_r.join(''));

        that.renderForm();
        typeof thisCheckedRowIndex === 'number' && that.setThisRowChecked(thisCheckedRowIndex);
        that.syncCheckAll();

        //滚动条补丁
        that.haveInit ? that.scrollPatch() : setTimeout(function () {
          that.scrollPatch();
        }, 50);
        that.haveInit = true;

        layer.close(that.tipsIndex);

        //同步表头父列的相关值
        options.HAS_SET_COLS_PATCH || that.setColsPatch();
        options.HAS_SET_COLS_PATCH = true;

        // 渲染完毕做一些处理
        renderDone.call(that);
      };

    // 只有在之前出现异常后面才需要先初始化table的内容
    that.layMain.find('.' + NONE).length && that.initTable();

    that.key = options.id || options.index;
    table.cache[that.key] = data; //记录数据

    //显示隐藏分页栏
    that.layPage[(count == 0 || (data.length === 0 && curr == 1)) ? 'addClass' : 'removeClass'](HIDE);

    //排序
    if (sort) {
      return render();
    }

    if (data.length === 0) {
      that.renderForm();
      // #### 源码修改 01 #### 处理没有数据的时候fixed模块被删除只能重载没办法重复利用的问题
      // that.layFixed.remove(); 智能reload的话不应该直接remove掉，直接hide掉就可以了
      // that.layFixed.addClass(HIDE);
      that.initTable();
      // that.layMain.find('tbody').html('');
      // that.layMain.find('.' + NONE).remove();
      return that.layMain.append('<div class="' + NONE + '">' + options.text.none + '</div>');
    }

    render(); //渲染数据
    that.renderTotal(data); //数据合计

    //同步分页状态
    if (options.page) {
      options.page = $.extend({
        elem: 'layui-table-page' + options.index
        , count: count
        , limit: options.limit
        , limits: options.limits || [10, 20, 30, 40, 50, 60, 70, 80, 90]
        , groups: 3
        , layout: ['prev', 'page', 'next', 'skip', 'count', 'limit']
        , prev: '<i class="layui-icon">&#xe603;</i>'
        , next: '<i class="layui-icon">&#xe602;</i>'
        , jump: function (obj, first) {
          if (!first) {
            //分页本身并非需要做以下更新，下面参数的同步，主要是因为其它处理统一用到了它们
            //而并非用的是 options.page 中的参数（以确保分页未开启的情况仍能正常使用）
            that.page = obj.curr; //更新页码
            options.limit = obj.limit; //更新每页条数
            that.loading();
            that.pullData(obj.curr);
          }
          // #### 源码修改02 #### 支持多语言的page
          if (that.config.pageLanguage && !(that.config.pageLanguage === true)) {
            var pageLanguageText;
            if (typeof that.config.pageLanguage === 'string') {
              if (!table.config.pageLanguageText[that.config.pageLanguage]) {
                console.log('找不到' + that.config.pageLanguage + '对应的语言文本定义');
                return;
              }
              pageLanguageText = table.config.pageLanguageText[that.config.pageLanguage];
            } else if (typeof that.config.pageLanguage === 'object') {
              var lanTemp = that.config.pageLanguage.lan;
              if (!lanTemp) {
                return;
              }
              pageLanguageText = $.extend({}, table.config.pageLanguageText[lanTemp], that.config.pageLanguage.text || {});
            } else {
              return;
            }

            if (!pageLanguageText) {
              return;
            }

            // 处理page支持en
            var pageElem = that.layPage.find('>div');
            pageElem.addClass(HIDE);
            var skipElem = pageElem.find('.layui-laypage-skip');
            var skipInput = skipElem.find('input');
            var skipBtn = skipElem.find('button');
            skipElem.html(pageLanguageText['jumpTo'] || 'jump to');
            skipInput.appendTo(skipElem);
            skipElem.append(pageLanguageText['page'] || 'page');
            skipBtn.html(pageLanguageText['go'] || 'go').appendTo(skipElem);

            var countElem = pageElem.find('.layui-laypage-count');
            var countText = countElem.text();
            countElem.html((pageLanguageText['total'] || 'total') + ' ' + countText.split(' ')[1] + (pageLanguageText['unit'] ? ' ' + pageLanguageText['unit'] : ''));

            var limitsElem = pageElem.find('.layui-laypage-limits');
            layui.each(limitsElem.find('option'), function (index, optionElem) {
              optionElem = $(optionElem);
              var textTemp = optionElem.text();
              optionElem.html(textTemp.split(' ')[0] + ' ' + (pageLanguageText['optionText'] || 'limit each page'));
            });
            pageElem.removeClass(HIDE);
          }
        }
      }, options.page);
      options.page.count = count; //更新总条数
      laypage.render(options.page);
    }
  };

  var setColsWidth = table.Class.prototype.setColsWidth;
  table.Class.prototype.setColsWidth = function () {
    var that = this;
    that.layBox.find('.' + LOADING).remove();
    setColsWidth.call(that);

    var options = that.config;
    var tableId = options.id;
    var tableView = that.elem;

    var noneElem = tableView.find('.' + NONE);

    // 如果没有数据的时候表头内容的宽度超过容器的宽度
    that.elem[noneElem.length && that.layHeader.first().find('.layui-table').width() - 1 > that.layHeader.first().width() ? 'addClass' : 'removeClass']('layui-table-none-overflow');

    //如果多级表头，重新填补填补表头高度
    if (options.cols.length > 1) {
      //补全高度
      var th = that.layFixed.find(ELEM_HEADER).find('th');
      // 只有有头部的高度的时候计算才有意义
      var heightTemp = that.layHeader.height();
      heightTemp = heightTemp / options.cols.length; // 每一个原子tr的高度
      th.each(function (index, thCurr) {
        thCurr = $(thCurr);
        thCurr.height(heightTemp * (parseInt(thCurr.attr('rowspan') || 1))
          - 1 - parseFloat(thCurr.css('padding-top')) - parseFloat(thCurr.css('padding-bottom')));
      });
    }

    that.layBody.scrollTop(0);
    that.layBody.scrollLeft(0);
    that.layHeader.scrollLeft(0);
  };

  $(window).resize(function () {
    layer.close(filterLayerIndex);
  });

  //初始化一些参数
  table.Class.prototype.setInit = function (type) {
    var that = this
      , options = that.config;

    options.clientWidth = options.width || function () { //获取容器宽度
      //如果父元素宽度为0（一般为隐藏元素），则继续查找上层元素，直到找到真实宽度为止
      var getWidth = function (parent) {
        var width, isNone;
        parent = parent || options.elem.parent();
        width = parent.width();
        try {
          isNone = parent.css('display') === 'none';
        } catch (e) {
        }
        if (parent[0] && (!width || isNone)) return getWidth(parent.parent());
        return width;
      };
      return getWidth();
    }();

    if (type === 'width') return options.clientWidth;

    //初始化列参数
    layui.each(options.cols, function (i1, item1) {
      layui.each(item1, function (i2, item2) {

        //如果列参数为空，则移除
        if (!item2) {
          item1.splice(i2, 1);
          return;
        }

        item2.key = i1 + '-' + i2;
        item2.hide = item2.hide || false;

        //设置列的父列索引
        //如果是组合列，则捕获对应的子列
        if (item2.colGroup || item2.colspan > 1) {
          var childIndex = 0;
          // #### 源码修改 #### 修复复杂表头数据与表头错开的bug
          layui.each(options.cols[i1 + (parseInt(item2.rowspan) || 1)], function (i22, item22) {
            //如果子列已经被标注为{HAS_PARENT}，或者子列累计 colspan 数等于父列定义的 colspan，则跳出当前子列循环
            if (item22.HAS_PARENT || (childIndex > 1 && childIndex == item2.colspan)) return;

            item22.HAS_PARENT = true;
            item22.parentKey = i1 + '-' + i2;

            childIndex = childIndex + parseInt(item22.colspan > 1 ? item22.colspan : 1);
          });
          item2.colGroup = true; //标注是组合列
        }

        //根据列类型，定制化参数
        that.initOpts(item2);
      });
    });
  };

  var tableInsReload = table.Class.prototype.reload;
  //表格完整重载
  table.Class.prototype.reload = function (options) {
    var that = this;
    table.reload(that.config.id, options, true);
  };

  // 添加一条临时数据
  table.Class.prototype.addTemp = function (numbers, data, callback, notScroll) {
    var that = this;
    var tds_fixed = [], tds_fixed_r = [], tds = [];
    var options = that.config, item1 = data || {};
    numbers = -numbers;
    table.cache[that.key][numbers] = item1;
    that.eachCols(function (i3, item3) {
      var field = item3.field || i3
        , key = options.index + '-' + item3.key
        , content = item1[field];

      if (content === undefined || content === null) content = '';
      if (item3.colGroup) return;

      //td内容
      var td = ['<td data-field="' + field + '" data-key="' + key + '" ' + function () { //追加各种属性
        var attr = [];
        if (item3.type === 'normal' && item3.edit !== false) attr.push('data-edit="text"'); //是否允许单元格编辑
        if (item3.align) attr.push('align="' + item3.align + '"'); //对齐方式
        if (item3.templet) attr.push('data-content="' + content + '"'); //自定义模板
        if (item3.toolbar) attr.push('data-off="true"'); //行工具列关闭单元格事件
        if (item3.event) attr.push('lay-event="' + item3.event + '"'); //自定义事件
        if (item3.style) attr.push('style="' + item3.style + '"'); //自定义样式
        if (item3.minWidth) attr.push('data-minwidth="' + item3.minWidth + '"'); //单元格最小宽度
        return attr.join(' ');
      }() + ' class="' + function () { //追加样式
        var classNames = [];
        if (item3.hide) classNames.push(HIDE); //插入隐藏列样式
        if (!item3.field) classNames.push('layui-table-col-special'); //插入特殊列样式
        return classNames.join(' ');
      }() + '">'
        , '<div class="layui-table-cell laytable-cell-' + function () { //返回对应的CSS类标识
          return item3.type === 'normal' ? key
            : (key + ' laytable-cell-' + item3.type);
        }() + '">' + function () {
          var tplData = $.extend(true, {
            LAY_INDEX: numbers
          }, item1);

          //渲染不同风格的列
          switch (item3.type) {
            case 'checkbox':
            case 'radio':
            case 'numbers':
              return '';
              break;
          }

          //解析工具列模板
          if (item3.toolbar) {
            return '';
          }
          return item3.templet ? function () {
            return typeof item3.templet === 'function'
              ? item3.templet(tplData)
              : laytpl($(item3.templet).html() || String(content)).render(tplData)
          }() : content;
        }()
        , '</div></td>'].join('');

      tds.push(td);
      if (item3.fixed && item3.fixed !== 'right') tds_fixed.push(td);
      if (item3.fixed === 'right') tds_fixed_r.push(td);
    });

    that.layMain.find('.' + NONE).remove();
    that.elem.removeClass('layui-table-none-overflow');
    // 追加到最后
    that.layMain.find('tbody').append('<tr class="layui-tablePlug-data-temp" data-index="' + numbers + '">' + tds.join('') + '</tr>');
    that.layFixLeft.find('tbody').append('<tr class="layui-tablePlug-data-temp" data-index="' + numbers + '">' + tds_fixed.join('') + '</tr>');
    that.layFixRight.find('tbody').append('<tr class="layui-tablePlug-data-temp" data-index="' + numbers + '">' + tds_fixed_r.join('') + '</tr>');
    that.renderForm();
    that.resize();
    // 滚动到底部
    notScroll || that.layBody.scrollTop(that.layBody[0].scrollHeight);

    that.layBody.find('tr.layui-tablePlug-data-temp[data-index="' + numbers + '"]')
      .find('td:first-child')
      .append('<div class="close_temp"></div>');

    that.layFixRight.find('.close_temp').remove();

    // 执行回调，传过去两个参数，第一个是当前的table的config,第二个是新增的这个临时的tr的jquery对象
    typeof callback === 'function' && callback.call(that.config, that.layBody.find('tr[data-index="' + numbers + '"]'));
  };

  // 对外提供添加临时数据的接口
  table.addTemp = function (id, data, callback) {
    var ins = getIns(id);
    if (typeof data === 'function') {
      callback = data;
      data = {};
    }
    ins && ins.addTemp(table.getTemp(id).numbers, (data && typeof data === 'object') ? data : {}, callback);
  };

  // 获得临时数据
  table.getTemp = function (id) {
    var data = table.cache[id] || [];
    var dataTemp = [], i = 1;
    for (; ; i++) {
      if (data[-i]) {
        if (isArray(data[-i])) {
          // 无效的数据
        } else {
          dataTemp.push(data[-i]);
        }
      } else {
        break;
      }
    }
    return {
      data: dataTemp,
      numbers: i
    }
  };

  // 清空临时数据
  table.cleanTemp = function (id, index) {
    var ins = getIns(id);
    var dataTemp = table.getTemp(id);
    var data = table.cache[id] || [];
    if (dataTemp.data.length) {
      var numbers = dataTemp.numbers;
      for (var i = 1; i < numbers; i++) {
        if (data[-i] && (index ? -i === index : true)) {
          data[-i] = [];
          if (index) {
            break;
          }
        }
      }
    }
    // 删除节点
    $('div.layui-table-view[lay-id="' + id + '"]').removeClass('has-data-temp-warn')
      .find('tr.layui-tablePlug-data-temp[data-index' + (index ? '="' + index + '"' : '') + ']').remove();
    table.resize(id);
    ins.layBody.scrollTop(ins.layBody[0].scrollHeight);
  };

  $(document).on('click', '.layui-table-view tr.layui-table-hover.layui-tablePlug-data-temp div.close_temp', function (event) {
    layui.stope(event);
    var btnElem = $(this);
    var trElem = btnElem.closest('tr');
    var tableId = trElem.closest('.layui-table-view').attr('lay-id');
    table.cleanTemp(tableId, trElem.data('index'));
  });

  //遍历表头
  table.eachCols = function (id, callback, cols) {
    var that = this;
    var config = that.thisTable.config[id] || {}
      , arrs = [], index = 0;

    cols = $.extend(true, [], cols || config.cols);

    //重新整理表头结构
    layui.each(cols, function (i1, item1) {
      layui.each(item1, function (i2, item2) {

        //如果是组合列，则捕获对应的子列
        if (item2.colGroup) {
          var childIndex = 0;
          index++
          item2.CHILD_COLS = [];
          // #### 源码修改 #### 修复复杂表头数据与表头错开的bug
          // 找到它的子列
          // layui.each(cols[i1 + 1], function(i22, item22){
          layui.each(cols[i1 + (parseInt(item2.rowspan) || 1)], function (i22, item22) {
            //如果子列已经被标注为{PARENT_COL_INDEX}，或者子列累计 colspan 数等于父列定义的 colspan，则跳出当前子列循环
            if (item22.PARENT_COL_INDEX || (childIndex > 1 && childIndex == item2.colspan)) return;

            item22.PARENT_COL_INDEX = index;

            item2.CHILD_COLS.push(item22);
            childIndex = childIndex + parseInt(item22.colspan > 1 ? item22.colspan : 1);
          });
        }

        if (item2.PARENT_COL_INDEX) return; //如果是子列，则不进行追加，因为已经存储在父列中
        arrs.push(item2)
      });
    });

    //重新遍历列，如果有子列，则进入递归
    var eachArrs = function (obj) {
      layui.each(obj || arrs, function (i, item) {
        if (item.CHILD_COLS) return eachArrs(item.CHILD_COLS);
        typeof callback === 'function' && callback(i, item);
      });
    };

    eachArrs();
  };

  // 字段过滤的相关功能
  var addFieldFilter = function () {
    var that = this;
    var tableId = that.key;
    var tableView = that.elem;

    table.eachCols(tableId, function (index, item) {
      if (item.type === 'normal') {
        var field = item.field;
        if (!field) {
          return;
        }
        var thElem = tableView.find('th[data-field="' + field + '"]');
        if (!item.filter) {
          thElem.find('.layui-table-filter').remove();
        } else {
          if (!thElem.find('.layui-table-filter').length) {
            $(LayuiTableColFilter.join('')).insertAfter(thElem.find('.layui-table-cell>span:not(.layui-inline)')).click(function (event) {
              layui.stope(event);
              var filterActive = tableView.find('.layui-table-filter.layui-active');
              if (filterActive.length && filterActive[0] !== this) {
                // 目前只支持单列过滤，多列过滤会存在一些难题，不好统一，干脆只支持单列过滤
                filterActive.removeClass('layui-active');
                that.layBody.find('tr.' + HIDE).removeClass(HIDE);
              }
              var mainElem = tableView.find('.layui-table-main');
              var nodes = [];
              layui.each(mainElem.find('td[data-field="' + field + '"]'), function (index, elem) {
                elem = $(elem);
                var textTemp = elem.text();
                if (nodes.indexOf(textTemp) === -1) {
                  nodes.push(textTemp);
                }
              });
              var layerWidth = 200;
              var layerHeight = 300;
              var btnElem = $(this);
              var btnPosition = getPosition(btnElem.find('.layui-tablePlug-icon-filter'));
              var topTemp = btnPosition.top;
              var leftTemp = btnPosition.left + btnElem.width();
              if (leftTemp + layerWidth > $(document).width()) {
                leftTemp -= (layerWidth + btnElem.width());
              }
              filterLayerIndex = layer.open({
                content: '',
                title: null,
                type: 1,
                // area: [layerWidth + 'px', layerHeight + 'px'],
                area: layerWidth + 'px',
                shade: 0.1,
                closeBtn: 0,
                fixed: false,
                resize: false,
                shadeClose: true,
                offset: [topTemp + 'px', leftTemp + 'px'],
                isOutAnim: false,
                maxmin: false,
                success: function (layero, index) {
                  layero.find('.layui-layer-content').html('<table id="layui-tablePlug-col-filter" lay-filter="layui-tablePlug-col-filter"></table>');
                  table.render({
                    elem: '#layui-tablePlug-col-filter',
                    data: nodes.map(function (value, index1, array) {
                      var nodeTemp = {
                        name: value
                      };
                      nodeTemp[table.config.checkName] = !that.layBody.find('tr.' + HIDE).filter(function (index, item) {
                        return $(item).find('td[data-field="' + field + '"]').text() === value;
                      }).length;
                      return nodeTemp;
                    }),
                    page: false,
                    skin: 'nob',
                    id: 'layui-tablePlug-col-filter-layer',
                    even: false,
                    height: nodes.length > 8 ? layerHeight : null,
                    size: 'sm',
                    style: 'margin: 0;',

                    cols: [[
                      {type: 'checkbox', width: 40},
                      {
                        field: 'name',
                        title: '全选<span class="table-filter-opt-invert" onclick="layui.tablePlug && layui.tablePlug.tableFilterInvert(this);">反选</span>'
                      }
                    ]]
                  })
                },
                end: function () {
                  btnElem[that.layBody.find('tr.' + HIDE).length ? 'addClass' : 'removeClass']('layui-active');
                }
              });

              // 监听字段过滤的列选择的
              table.on('checkbox(layui-tablePlug-col-filter)', function (obj) {
                if (obj.type === 'all') {
                  that.layBody.find('tr')[obj.checked ? 'removeClass' : 'addClass'](HIDE);
                } else {
                  layui.each(that.layBody.first().find('tr td[data-field="' + field + '"]'), function (index, elem) {
                    elem = $(elem);
                    if (elem.text() === obj.data.name) {
                      var trElem = elem.parent();
                      that.layBody.find('tr[data-index="' + trElem.data('index') + '"]')[obj.checked ? 'removeClass' : 'addClass'](HIDE);
                    }
                  });
                }
                // that.resize();
              });

            });
          } else {
            // thElem.find('.layui-table-filter')[that.layBody.find('tr.' + HIDE).length ? 'addClass' : 'removeClass']('layui-active');
            thElem.find('.layui-table-filter').removeClass('layui-active');
          }
        }
      }
    }, that.config.cols);
  };

  // 改造table.render和reload记录返回的对象
  var tableRender = table.render;
  table.render = function (config) {
    var that = this;
    var settingTemp = $.extend(true, {}, table.config, config);
    // table一般要给定id而且这个id就是当前table的实例的id
    var tableId = config.id || $(config.elem).attr('id');

    if (!tableCheck.check(tableId)) {
      // 如果render的时候设置了checkStatus或者全局设置了默认跨页保存那么重置选中状态
      tableCheck.init(tableId, settingTemp.checkStatus ? (settingTemp.checkStatus['default'] || []) : []);
    }

    if (settingTemp.checkDisabled && isArray(settingTemp.checkDisabled.data) && settingTemp.checkDisabled.data.length) {
      tableCheck.disabled(tableId, isArray(settingTemp.checkDisabled.data) ? settingTemp.checkDisabled.data : []);
    }

    // 改造parseData
    var parseData = settingTemp.parseData;
    if (!parseData || !parseData.plugFlag) {
      config.parseData = function (ret) {
        var parseDataThat = this;
        ret = typeof parseData === 'function' ? (parseData.call(parseDataThat, ret) || ret) : ret;
        var dataName = settingTemp.response ? (settingTemp.response.dataName || 'data') : 'data';
        dataRenderChecked(ret[dataName], parseDataThat.id);
        return ret;
      };
      config.parseData.plugFlag = true;
    }

    // 如果是data模式
    if (!config.url && isArray(config.data)) {
      dataRenderChecked(config.data, tableId, settingTemp);
    }

    // 如果配置了字段筛选的记忆需要更新字段的hide设置
    if (settingTemp.colFilterRecord) {
      var record = colFilterRecord.get(tableId, config.colFilterRecord);
      $.each(config.cols, function (i, item1) {
        $.each(item1, function (j, item2) {
          // item2.hide = !!record[i + '-' + j]
          item2.hide = !!record[item2.field];
        });
      });
    } else {
      colFilterRecord.clear(tableId);
    }

    // 处理复杂表头的单列和并列的问题
    if (config.cols.length > 1) {
      layui.each(config.cols, function (i1, item1) {
        layui.each(item1, function (i2, item2) {
          if (!item2.field && !item2.toolbar && (!item2.colspan || item2.colspan === 1) && (tableSpacialColType.indexOf(item2.type) === -1)) {
            item2[COLGROUP] = true;
          } else if (item2[COLGROUP] && !(item2.colspan > 1)) {
            // 如果有乱用colGroup的，明明是一个字段列还给它添加上这个属性的会在这里KO掉，叫我表格小卫士^_^
            item2[COLGROUP] = false;
          }
        });
      });
    }

    var insTemp = tableRender.call(that, config);
    var configTemp = insTemp.config;
    var tableView = configTemp.elem.next();
    // 如果table的视图上的lay-id不等于当前表格实例的id强制修改,这个是个非常实用的配置。
    tableView.attr('lay-id') !== configTemp.id && tableView.attr('lay-id', configTemp.id);

    var insObj = getIns(configTemp.id); // 获得当前的table的实例，对实例内部的方法进行改造
    // 在render的时候就调整一下宽度，不要不显示或者拧成一团
    insTemp.setColsWidth();

    // 补充被初始化的时候设置宽度时候被关掉的loading，如果是data模式的实际不会走异步的，所以不需要重新显示loading
    insObj.config.url && insObj.loading();

    // 同步滚动条
    insObj.layMain.off('scroll') // 去掉layMain原始的事件
      .on('scroll', function () {
        var othis = $(this)
          , scrollLeft = othis.scrollLeft()
          , scrollTop = othis.scrollTop();

        insObj.layHeader.scrollLeft(scrollLeft);
        insObj.layTotal.scrollLeft(scrollLeft);
        // 过滤掉鼠标滚动fixed区域而联动滚动main的情况
        insObj.layFixed.find(ELEM_BODY + ':not(.' + FIXED_SCROLL + ')').scrollTop(scrollTop);

        layer.close(insObj.tipsIndex);
      });

    // 监听ELEM_BODY的滚动
    insObj.layFixed.find(ELEM_BODY).on('scroll', function () {
      var elemBody = $(this);
      if (elemBody.hasClass(FIXED_SCROLL)) {  // 只有当前鼠标的fixed区域才需要处理
        // 同步两个fixed的滚动
        insObj.layFixed.find(ELEM_BODY).scrollTop(elemBody.scrollTop());
        // 联动main的滚动
        insObj.layMain.scrollTop(elemBody.scrollTop());
      }
    }).on('mouseenter', function () {
      $(this).addClass(FIXED_SCROLL);
    }).on('mouseleave', function () {
      $(this).removeClass(FIXED_SCROLL);
      insObj.layFixed.removeClass(FIXED_SCROLL);
    });

    // 处理鼠标移入右侧
    insObj.layFixRight.find(ELEM_BODY).on('mouseenter', function () {
      var elemFixedR = insObj.layFixRight;
      if (elemFixedR.css('right') !== '-1px') {
        // 如果有滚动条的话
        elemFixedR.addClass(FIXED_SCROLL);
      } else {
        setTimeout(function () {
          if (elemFixedR.css('right') !== '-1px') {
            console.log('出现了一开始还没有打滚动条补丁的时候就触发的情况');
            elemFixedR.addClass(FIXED_SCROLL);
          }
        }, 50);
      }
    });

    // 左侧鼠标移入目前会出现一个新的滚动条，这个目前认定是正常的效果，避免鼠标没有滚轮就无法滚动左侧固定的情况 和下面的两种情况哪种更好待定
    // 下面的代码是为了处理掉左侧固定列的鼠标悬浮可以看不到滚动条，让它看着跟平时一样，但是如果需要用到鼠标拖动滚动条的情况就做不了，只能用滚轮滚动
    insObj.layFixLeft.find(ELEM_BODY).on('mouseenter', function () {
      var widthOut = insObj.layFixLeft.find(ELEM_HEADER).find('table').width();
      var widthIn = insObj.layFixLeft.find(ELEM_HEADER).width() + 1;
      insObj.layFixLeft.css({width: widthOut + 'px'}).find(ELEM_BODY).css({width: widthIn + 'px'});
    }).on('mouseleave', function () {
      insObj.layFixLeft.css({width: 'auto'}).find(ELEM_BODY).css({width: 'auto'});
    });

    return tableIns[configTemp.id] = insTemp;
  };

  // 改造table reload
  var tableReload = table.reload;
  var queryParams = (function () {
    // 查询模式的白名单
    var params = ['url', 'method', 'where', 'contentType', 'headers', 'parseData', 'request', 'response', 'data', 'page', 'initSort', 'autoSort'];
    return {
      // 获得查询的属性
      getParams: function () {
        return params;
      },
      // 注册查询的属性，方便后面自己有扩展新的功能的时候，有一些配置可以注册成不重载的属性
      registParams: function () {
        var that = this;
        layui.each(arguments, function (i, value) {
          if (isArray(value)) {
            that.registParams.apply(that, value);
          } else {
            if (typeof value === 'string' && params.indexOf(value) === -1) {
              params.push(value);
            }
          }
        });
      }
      // check: function () {
      //
      // }
    }
  })();

  // 是否启用智能重载模式
  var smartReload = (function () {
    var enable = false;
    return {
      enable: function () {
        if (arguments.length) {
          var isEnable = arguments[0];
          if (typeof isEnable !== "boolean") {
            hint.error('如果要开启或者关闭全局的表格智能重载模式，请传入一个true/false为参数');
          } else {
            enable = isEnable;
          }
        } else {
          return enable;
        }
      }
    }
  })();

  // 添加两个目前tablePlug扩展的属性到查询模式白名单中
  queryParams.registParams('colFilterRecord', 'checkStatus', 'smartReloadModel', 'checkDisabled');

  table.reload = function (tableId, config, shallowCopy) {
    var that = this;
    config = config || {};

    var configOld = getConfig(tableId);
    var configTemp = $.extend(true, {}, getConfig(tableId), config);
    // 如果不记录状态的话就重置目前的选中记录
    if (!configTemp.checkStatus) {
      tableCheck.reset(tableId);
    }
    if (smartReload.enable() && configTemp.smartReloadModel) {

      // 如果开启了智能重载模式
      // 是否为重载模式
      var reloadModel = false;
      if (!!configTemp.page !== !!configOld.page) {
        // 如果是否分页发生了改变
        reloadModel = true;
      }
      if (!reloadModel) {
        var dataParamsTemp = $.extend(true, [], queryParams.getParams());

        layui.each(config, function (_key, _value) {
          var indexTemp = dataParamsTemp.indexOf(_key);
          if (indexTemp === -1) {
            return reloadModel = true;
          } else {
            // 如果匹配到去掉这个临时的属性，下次查找的时候减少一个属性
            dataParamsTemp.splice(indexTemp, 1);
          }
        });
      }

      if (!reloadModel) {
        var insTemp = getIns(tableId);

        if (typeof config.page === 'object') {
          config.page.curr && (insTemp.page = config.page.curr);
          delete config.elem;
          delete config.jump;
        }
        shallowCopy ? $.extend(insTemp.config, config) : $.extend(true, insTemp.config, config);
        if (!insTemp.config.page) {
          insTemp.page = 1;
        }
        // 记录一下需要打补丁
        // insTemp.elem.data('patch', true);
        insTemp.loading();
        insTemp.pullData(insTemp.page);
        return table.thisTable.call(insTemp);
      }
    }

    // 如果是重载
    if (shallowCopy) {
      tableInsReload.call(getIns(tableId), config);
      tableIns[tableId].config = getIns(tableId).config;
    } else {
      var insTemp = tableReload.call(that, tableId, config);
      return tableIns[tableId] = insTemp;
    }
  };

  // 获得table的config
  var getConfig = function (tableId) {
    return tableIns[tableId] && tableIns[tableId].config;
  };

  // 原始的
  var checkStatus = table.checkStatus;
  // 重写table的checkStatus方法
  table.checkStatus = function (tableId) {
    var that = this;
    var statusTemp = checkStatus.call(that, tableId);
    var config = getConfig(tableId);
    if (config && config.checkStatus) {
      // 状态记忆
      statusTemp.status = tableCheck.get(tableId);
    }
    if (config && config.checkDisabled) {
      var checkDisabledTemp = config.checkDisabled;
      if (typeof checkDisabledTemp === 'object' && checkDisabledTemp.enabled !== false) {
        var num1 = 0; //可选的数量
        var num2 = 0; //最终选中的数量
        var primaryKey = getPrimaryKey(config);
        var disabledTemp = tableCheck.get(tableId, CHECK_TYPE_DISABLED);
        layui.each(table.cache[tableId], function (index, data) {
          var primaryValue = data[primaryKey];
          if (disabledTemp.indexOf(primaryValue) === -1) {
            num1++;
            if (data[table.config.checkName]) {
              num2++;
            }
          }
        });
        statusTemp.isAll = (num2 > 0 && num1 === num2);
      }
    }
    return statusTemp;
  };

  // 更新复选框的状态
  var updateCheckStatus = function (tableId, value, checked) {
    if (!tableCheck.checkDisabled(tableId, value)) {
      tableCheck.update(tableId, value, checked);
    } else {
      // 操作了不可选的
      return false;
    }
  };

  var getPrimaryKey = function (config) {
    if (config.primaryKey) {
      return config.primaryKey;
    }
    var keyStatus = config.checkStatus && config.checkStatus.primaryKey,
      keyDisabled = config.checkDisabled && config.checkDisabled.primaryKey;
    if (keyStatus && keyDisabled && keyStatus !== keyDisabled) {
      layui.hint().error('注意：当前表格(' + config.id + ')中checkStatus和checkDisabled都配置了primaryKey,但是他们不是同一个字段，必须保持表格配置中主键是唯一的，建议直接设置在顶层配置中就可以了！')
    }
    return keyDisabled || keyStatus || 'id';
  };

  // 监听所有的表格中的type:'checkbox'注意不要在自己的代码里面也写这个同名的监听，不然会被覆盖，
  table.on('checkbox', function (obj) {

    var tableView = $(this).closest('.layui-table-view');
    // lay-id是2.4.4版本新增的绑定到节点上的当前table实例的id,经过plug的改造render将旧版本把这个id也绑定到视图的div上了。
    var tableId = tableView.attr('lay-id');
    var config = getConfig(tableId);
    if (tableCheck.check(tableId)) {
      var _checked = obj.checked;
      var _data = obj.data;
      var _type = obj.type;

      var primaryKey = getPrimaryKey(config);

      if (_type === 'one') {
        updateCheckStatus(tableId, _data[primaryKey], _checked);
      } else if (_type === 'all') {
        // 全选或者取消全不选
        var renderFlag = false;
        layui.each(layui.table.cache[tableId], function (index, data) {
          var disableFlag = updateCheckStatus(tableId, data[primaryKey], _checked);
          if (disableFlag === false) {
            renderFlag = true;
            // 因为原始的table操作了不可选的复选框需要纠正一下状态
            var checkedTemp = tableCheck.getChecked(tableId).indexOf(data[primaryKey]) !== -1;
            tableView.find('.layui-table-body')
              .find('tr[data-index="' + index + '"]')
              .find('input[name="layTableCheckbox"]').prop('checked', checkedTemp);
            data[table.config.checkName] = checkedTemp;
          }
        });
        // renderFlag && getIns(tableId).renderForm('checkbox');
        renderFlag && form.render('checkbox', tableView.attr('lay-filter'));
      }
    }
  });

  // 让被美化的复选框支持原始节点的change事件
  form.on('checkbox', function (data) {
    $(data.elem).change();
  });

  // 表格筛选列的状态记录的封装
  var colFilterRecord = (function () {
    var recodeStoreName = 'tablePlug_col_filter_record';
    var getStoreType = function (recordType) {
      return recordType === 'local' ? 'data' : 'sessionData';
    };
    return {
      // 记录
      set: function (tableId, key, checked, recordType) {
        if (!tableId || !key) {
          return;
        }
        // 默认用sessionStore
        var storeType = getStoreType(recordType);
        var dataTemp = this.get(tableId, recordType);
        dataTemp[key] = !checked;
        layui[storeType](recodeStoreName, {
          key: tableId,
          value: dataTemp
        })
      },
      get: function (tableId, recordType) {
        return layui[getStoreType(recordType)](recodeStoreName)[tableId] || {};
      },
      clear: function (tableId) {
        $.each(['data', 'sessionData'], function (index, type) {
          layui[type](recodeStoreName, {
            key: tableId,
            remove: true
          });
        });
      }
    };
  })();

  // 监听表格筛选的点
  $(document).on('change', 'input[lay-filter="LAY_TABLE_TOOL_COLS"]', function (event) {
    var elem = $(this);
    // var key = elem.data('key');
    var key = elem.attr('name');
    var tableView = elem.closest('.layui-table-view');
    var tableId = tableView.attr('lay-id');
    var config = getConfig(tableId);
    var filterRecord = config.colFilterRecord;
    if (filterRecord) {
      colFilterRecord.set(tableId, key, this.checked, filterRecord);
    } else {
      colFilterRecord.clear(tableId)
    }
  });

  // 缓存当前操作的是哪个表格的哪个tr的哪个td
  $(document).off('mousedown', '.layui-table-grid-down')
    .on('mousedown', '.layui-table-grid-down', function (event) {
      // 记录操作的td的jquery对象
      table._tableTdCurr = $(this).closest('td');
    });

  // 给弹出的详情里面的按钮添加监听级联的触发原始table的按钮的点击事件
  $(document).off('click', '.layui-table-tips-main [lay-event]')
    .on('click', '.layui-table-tips-main [lay-event]', function (event) {
      var elem = $(this);
      var tableTrCurr = table._tableTdCurr;
      if (!tableTrCurr) {
        return;
      }
      var layerIndex = elem.closest('.layui-table-tips').attr('times');
      // 关闭当前的这个显示更多的tip
      layer.close(layerIndex);
      // 找到记录的当前操作的那个按钮
      table._tableTdCurr.find('[lay-event="' + elem.attr('lay-event') + '"]').first().click();
    });

  // 监听统一的toolbar一般用来处理通用的
  table.on('toolbar()', function (obj) {
    var config = obj.config;
    var btnElem = $(this);
    var tableId = config.id;
    var tableView = config.elem.next();
    switch (obj.event) {
      case 'LAYTABLE_COLS':
        // 给筛选列添加全选还有反选的功能
        var panelElem = btnElem.find('.layui-table-tool-panel');
        var checkboxElem = panelElem.find('[lay-filter="LAY_TABLE_TOOL_COLS"]');
        var checkboxCheckedElem = panelElem.find('[lay-filter="LAY_TABLE_TOOL_COLS"]:checked');
        $('<li class="layui-form" lay-filter="LAY_TABLE_TOOL_COLS_FORM">' +
          '<input type="checkbox" lay-skin="primary" lay-filter="LAY_TABLE_TOOL_COLS_ALL" '
          + ((checkboxElem.length === checkboxCheckedElem.length) ? 'checked' : '') + ' title="全选">' +
          '<span class="LAY_TABLE_TOOL_COLS_Invert_Selection">反选</span></li>')
          .insertBefore(panelElem.find('li').first())
          .on('click', '.LAY_TABLE_TOOL_COLS_Invert_Selection', function (event) {
            layui.stope(event);
            // 反选逻辑
            panelElem.find('[lay-filter="LAY_TABLE_TOOL_COLS"]+').click();
          });
        form.render('checkbox', 'LAY_TABLE_TOOL_COLS_FORM');
        break;
    }
  });

  // 监听筛选列panel中的全选
  form.on('checkbox(LAY_TABLE_TOOL_COLS_ALL)', function (obj) {
    $(obj.elem).closest('ul')
      .find('[lay-filter="LAY_TABLE_TOOL_COLS"]' + (obj.elem.checked ? ':not(:checked)' : ':checked') + '+').click();
  });

  // 监听筛选列panel中的单个记录的change
  $(document).on('change', 'input[lay-filter="LAY_TABLE_TOOL_COLS"]', function (event) {
    var elemCurr = $(this);
    // 筛选列单个点击的时候同步全选的状态
    $('input[lay-filter="LAY_TABLE_TOOL_COLS_ALL"]')
      .prop('checked',
        elemCurr.prop('checked') ? (!$('input[lay-filter="LAY_TABLE_TOOL_COLS"]').not(':checked').length) : false);
    form.render('checkbox', 'LAY_TABLE_TOOL_COLS_FORM');
  });

  // 逻辑移到另外的js里面去了

  // 阻止表格中lay-event的事件冒泡
  $(document).on('click', '.layui-table-view tbody [lay-event],.layui-table-view tbody tr [name="layTableCheckbox"]+', function (event) {
    layui.stope(event);
  });

  $.extend(tablePlug, {
    CHECK_TYPE_ADDITIONAL: CHECK_TYPE_ADDITIONAL
    , CHECK_TYPE_REMOVED: CHECK_TYPE_REMOVED
    , CHECK_TYPE_ORIGINAL: CHECK_TYPE_ORIGINAL
    , tableCheck: tableCheck
    , colFilterRecord: colFilterRecord  // 表格字段筛选记忆功能的封装
    , getConfig: getConfig  // 表格复选列的方法封装
    , getIns: function (tableId) { // 获得某个表格render返回的实例的封装
      return tableIns[tableId];
    }
    , disabledCheck: function (tableId, data) {  // 同步表格中的某些不可点击的节点
      var that = this;
      tableCheck.disabled(tableId, data || []);
      disabledCheck.call(that, tableId, true);
    }
    , dataRenderChecked: dataRenderChecked
    // , getObj: getIns  // 得到当前table的实际的实例
    , queryParams: queryParams // 表格查询模式的配置封装
    , smartReload: smartReload // 全局设置一个是否开启智能重载模式
    // 反选
    , tableFilterInvert: function (elem) {
      elem = $(elem);
      var tableView = elem.closest('.layui-table-view'),
        tableId = tableView.attr('lay-id');
      if (!tableId) {
        return;
      }
      var checkStatus = table.checkStatus(tableId);
      if (checkStatus.isAll) {
        // 以前全选了反选既为全不选，直接点击一下全选这个复选框就可以了
        tableView.find('[lay-filter="layTableAllChoose"]+').click();
      } else {
        if (!tableView.find('tbody [name="layTableCheckbox"]:checked').length) {
          // 如果一个都没有选中也是直接点击全选按钮
          tableView.find('[lay-filter="layTableAllChoose"]+').click();
        } else {
          layui.each(tableView.find('tbody [name="layTableCheckbox"]'), function (index, item) {
            $(item).next().click();
          });
        }
      }
    }
    , getPosition: getPosition
  });

  //外部接口
  exports('tablePlug', tablePlug);
});



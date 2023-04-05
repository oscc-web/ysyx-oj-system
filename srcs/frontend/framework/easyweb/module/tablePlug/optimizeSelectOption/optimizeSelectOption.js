/*!

 @Title: optimizeSelectOption
 @Description：优化select在layer和表格中显示的问题
 @Site:
 @Author: 岁月小偷
 @License：MIT

 */
;!function (factory) {
  'use strict';
  var modelName = 'optimizeSelectOption';
  layui.define(['form'], function (exports) { //layui加载
    exports(modelName, factory(modelName));
  });
}(function (modelName) {
  var version = '0.1.3';
  var $ = layui.$;
  var form = layui.form;
  var layer = layui.layer;

  var filePath = layui.cache.modules.optimizeSelectOption
    .substr(0, layui.cache.modules.optimizeSelectOption.lastIndexOf('/'));
  // 引入tablePlug.css
  layui.link(filePath + '/optimizeSelectOption.css?v' + version);


  var selectors = [
    '.layui-table-view',      // layui的表格中
    '.layui-layer-content',   // 用type:1 弹出的layer中
    '.select_option_to_layer' // 任意其他的位置
  ];
  // 记录弹窗的index的变量
  top.layer._indexTemp = top.layer._indexTemp || {};

  // 保留一下原始的form.render
  var formRender = form.render;
  form.render = function (type, filter, jqObj) {
    var that = this;
    var retObj;
    if (jqObj && jqObj.length) {
      layui.each(jqObj, function (index, elem) {
        elem = $(elem);
        var elemP = elem.parent();
        var formFlag = elemP.hasClass('layui-form');
        var filterTemp = elemP.attr('lay-filter');
        // mark一下当前的
        formFlag ? '' : elemP.addClass('layui-form');
        filterTemp ? '' : elemP.attr('lay-filter', 'tablePlug_form_filter_temp_' + new Date().getTime() + '_' + Math.floor(Math.random() * 100000));
        // 将焦点集中到要渲染的这个的容器上
        retObj = formRender.call(that, type, elemP.attr('lay-filter'));
        // 恢复现场
        formFlag ? '' : elemP.removeClass('layui-form');
        filterTemp ? '' : elemP.attr('lay-filter', null);
      });
    } else {
      retObj = formRender.call(that, type, filter);
    }
    return retObj;
  };

  var close = function () {
    // console.log(top.layer._indexTemp[modelName]);
    top.layer.close(top.layer._indexTemp[modelName]);
  };

  // 获得某个节点的位置 offsetTop: 是否获得相对top window的位移
  function getPosition(elem, _window, offsetTop) {
    _window = _window || window;
    var $ = _window.$ || _window.layui.$;
    if (!$) {
      console.log('该功能必须依赖jquery,请先为', _window, '窗口引入jquery先');
    }
    var offsetTemp = {};
    if (offsetTop && _window.top !== _window.self) {
      offsetTemp = getPosition($(_window.frames.frameElement), _window.parent, offsetTop);
    }
    var bodyOffset = $('body').hasClass('layui-container') ? $('body').offset() : {top: 0, left: 0};
    return {
      top: (offsetTemp.top || 0) + elem.offset().top - bodyOffset.top - $(_window.document).scrollTop(),
      left: (offsetTemp.left || 0) + elem.offset().left - bodyOffset.left - $(_window.document).scrollLeft()
    }
  }


  // 优化select的选项在某些场景下的显示问题
  $(document).on('click'
    , selectors.map(function (value) {
      return value + ' .layui-select-title';
    }).join(',')
    , function (event) {
      layui.stope(event);
      // return;
      close();
      var titleElem = $(this);
      if (!titleElem.parent().hasClass('layui-form-selected')) {
        return;
      }
      var dlElem = titleElem.next();
      var selectElem = titleElem.parent().prev();
      var dlClone = dlElem.clone(true);
      var selectupFlag = titleElem.parent().hasClass('layui-form-selectup');

      function getDlPosition() {
        var titleElemPosition = getPosition(titleElem, window, true);
        var topTemp = titleElemPosition.top;
        var leftTemp = titleElemPosition.left;
        if (selectupFlag) {
          topTemp = topTemp - dlElem.outerHeight() + titleElem.outerHeight() - parseFloat(dlElem.css('bottom'));
        } else {
          topTemp += parseFloat(dlElem.css('top'));
        }
        // console.log(topTemp, leftTemp);
        return {
          top: topTemp,
          left: leftTemp
        };
      }

      var dlPosition = getDlPosition();

      titleElem.css({backgroundColor: 'transparent'});
      top.layer._indexTemp[modelName] = top.layer.open({
        type: 1,
        title: false,
        closeBtn: 0,
        shade: 0,
        anim: -1,
        fixed: titleElem.closest('.layui-layer-content').length || window.top !== window.self,
        isOutAnim: false,
        // offset: [topTemp + 'px', leftTemp + 'px'],
        offset: [dlPosition.top + 'px', dlPosition.left + 'px'],
        // area: [dlElem.outerWidth() + 'px', dlElem.outerHeight() + 'px'],
        area: dlElem.outerWidth() + 'px',
        content: '<div class="layui-unselect layui-form-select layui-form-selected layui-table-select"></div>',
        success: function (layero, index) {
          dlElem.css({
            top: 0,
            position: 'relative'
          }).appendTo(layero.find('.layui-layer-content').css({overflow: 'hidden'}).find('.layui-form-selected'));
          layero.width(titleElem.width());
          // 原本的做法在ie下获得的是auto其他的浏览器却是确定的值，目前简单处理，先自行计算出来，后面再调优
          // selectupFlag && (layero.css({top: 'auto', bottom: layero.css('bottom')}));
          // console.log('before', 'top', layero.css('top'), 'bottom', layero.css('bottom'));
          var bottom_computed = top.window.innerHeight - layero.outerHeight() - parseFloat(layero.css('top'));
          // console.log('bottom_computed', bottom_computed);
          selectupFlag && (layero.css({top: 'auto', bottom: bottom_computed + 'px'}));
          // console.log('after', 'top', layero.css('top'), 'bottom', layero.css('bottom'));
          layero.find('dl dd').click(function () {
            close();
          });
          layero.find('dl dd').on('mousedown', function (event) {
            layui.stope(event);
          });
          // 不包含selectors的选择器的节点
          titleElem.parentsUntil(selectors.join(',')).one('scroll', function (event) {
            // 用top.layer去弹出的选项在其title所在的容器滚动的时候都关闭
            close();
          });
          // 单独给选择器的节点加上
          titleElem.parents(selectors.join(',')).one('scroll', function (event) {
            // 用top.layer去弹出的选项在其title所在的容器滚动的时候都关闭
            close();
          });

          var windowTemp = window;
          do {
            var $Temp = windowTemp.$ || windowTemp.layui.$;
            if ($Temp) {
              // 点击document的时候触发
              $Temp(windowTemp.document).one('click', function (event) {
                close();
              });

              $Temp(windowTemp.document).one('mousedown', function (event) {
                console.log('mousedown');
                close();
              });

              // 窗口resize的时候关掉表格中的下拉
              $Temp(windowTemp).one('resize', function (event) {
                close();
              });

              // 监听滚动在必要的时候关掉select的选项弹出（主要是在多级的父子页面的时候）
              $Temp(windowTemp.document).one('scroll', function () {
                if (top !== window && parent.parent) {
                  // 多级嵌套的窗口就直接关掉了
                  close();
                }
              });
            }
          } while (windowTemp.self !== windowTemp.top ? windowTemp = windowTemp.parent : false);
        },
        end: function () {
          form.render('select', null, selectElem);
        }
      });
    });

  return {
    version: version,
    getPosition: getPosition,
    close: close
  };
});

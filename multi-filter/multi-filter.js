//options: [{key: keyName, label: text,  data: [{text, value}], valueField, textField, selected: value, type: 1/2}]
var initFilterBox = function (wrapper, options, onFilter) {
    var $filterBox = $(wrapper).addClass('filter-box'),
        $filterResult = $('<div class="filter-item filter-result-item">\
                                        <span class="filter-label">已选择项：</span>\
                                        <ul class="filter-result-list">\
                                        </ul>\
                                    </div>').appendTo($filterBox),
        filterEmptyText = '不限',
        filterData = {},
        Ev = {
            _handles: {},
            on: function (name, handle) {
                if (!this._handles[name]) {
                    this._handles[name] = [];
                }
                this._handles[name].push(handle);
            },
            trigger: function (name, data) {
                var handles = this._handles[name];
                if (!handles) {
                    return;
                }
                for (var i = 0, handle; handle = handles[i]; i++) {
                    handle(data);
                }
            }
        },
        changeSelected = function (data) {
            var key = data.key;
            if (!filterData[key]) {
                filterData[key] = [];
            }
            filterData[key] = [];
            if (!data.value) {
                Ev.trigger('empty', data);
            }
            else {
                //处理数据
                filterData[key].push(data.value);
                Ev.trigger('change', data);
            }
        },
        addSelected = function (data) { //data: {key, value, label, tag}
            var key = data.key;
            if (!filterData[key]) {
                filterData[key] = [];
            }
            if (!data.value) {
                filterData[key] = [];
                Ev.trigger('empty', data);
            }
            else if (filterData[key].indexOf(data.value) < 0) {
                //处理数据
                filterData[key].push(data.value);
                //触发自定义事件
                Ev.trigger('add', data);
            }
        },
        removeSelected = function (data) {
            var key = data.key;
            if (!filterData[key]) {
                filterData[key] = [];
            }
            var index = filterData[key].indexOf(data.value);
            if (index > -1) {
                filterData[key].splice(index, 1);
                if (filterData[key].length == 0) {
                    Ev.trigger('empty', data);
                } else {
                    Ev.trigger('remove', data);
                }

            }
        },
        valueToType = function (value, typeStr) {
            switch (typeStr) {
                case 'number':
                    return +value;
                case 'string':
                    return value + '';
                default:
                    return value;
            }
        },
        initTagFilter = function (options) {
            var $filterItem = $('<div class="filter-item filter-tag-item" data-key="' + options.key + '">\
                                            <span class="filter-label">'+ options.label + '：</span>\
                                            <div class="filter-tag-select">\
                                                <ul class="filter-tag-list">\
                                                </ul>\
                                            </div>\
                                        </div>').insertBefore($filterResult),
                $tagSelect = $filterItem.children('.filter-tag-select'),
                $tagWrap = $tagSelect.children('.filter-tag-list'),
                activeClassName = 'active',
                tagListHtml = '<li class="filter-tag" data-value="">' + filterEmptyText + '</li>',
                valueType = options.data[0] ? (typeof options.data[0].value) : 'string',
                textField = options.textField || 'text',
                valueField = options.valueField || 'value';

            //构建列表
            for (var i = 0, item; item = options.data[i]; i++) {
                tagListHtml += '<li class="filter-tag" data-value="' + item[valueField] + '">' + item[textField] + '</li>';
            }
            $tagWrap.append(tagListHtml);

            if ($tagWrap[0].scrollHeight > $tagWrap.height()) {
                //初始化moreBtn
                var $moreBtn = $('<span class="filter-btn-more">更多</span>').prependTo($tagSelect).click(
                    function () {
                        var $this = $(this);
                        if ($this.text() == '更多') {
                            $tagSelect.addClass('open');
                            $this.text('收起');
                        } else {
                            $tagSelect.removeClass('open');
                            $this.text('更多');
                        }
                    });
                //初始化搜索筛选标签功能
                var $searchBox = $(
                    '<div class="search-box"><input type="text" class="search-input" placeholder="请输入关键词"></div>'
                )
                    .prependTo($tagSelect)
                    .children('input').on('input', function () {
                        var timer = null;
                        return function () {
                            timer && clearTimeout(timer);
                            var that = this;
                            timer = setTimeout(function () {
                                var value = $(that).val();
                                $tagWrap.children().each(function () {
                                    var $this = $(this);
                                    if ($this.text().indexOf(value) < 0) {
                                        $this.addClass('open-hidden');
                                    } else {
                                        $this.removeClass('open-hidden');
                                    }
                                });
                            }, 500);
                        }
                    }());
            }
            //初始化标签点击功能
            $tagWrap.on('click', '.filter-tag', function () {
                var $this = $(this),
                    value = $this.data('value'),
                    tag = $this.text();
                if ($this.hasClass(activeClassName)) {
                    removeSelected({
                        key: options.key,
                        value: valueToType(value, valueType)
                    });
                } else {
                    addSelected({
                        key: options.key,
                        label: options.label,
                        value: valueToType(value, valueType),
                        tag: tag
                    });
                }

            });
            //响应有关事件，来改变dom
            Ev.on('add', function (e) {
                if (e.key == options.key) {
                    $tagWrap.children('[data-value=' + e.value + ']')
                        .addClass(activeClassName)
                        .siblings('.' + activeClassName + '[data-value=""]')
                        .removeClass(activeClassName);
                }
            });
            Ev.on('remove', function (e) {
                if (e.key == options.key) {
                    $tagWrap.children('[data-value=' + e.value + ']')
                        .removeClass(activeClassName);
                }
            });
            Ev.on('empty', function (e) {
                if (e.key == options.key) {
                    $tagWrap.children('[data-value=""]')
                        .addClass(activeClassName)
                        .siblings('.' + activeClassName)
                        .removeClass(activeClassName);
                }
            });

            //设置默认选中
            if (options.selected) {
                var selectedArr = options.selected.split(',');
                for (var i = 0, item; item = selectedArr[i]; i++) {
                    $tagWrap.children('[data-value="' + item + '"]').click();
                }
            }
            else {
                $tagWrap.children('[data-value=""]').click();
            }

        },
        initSelectFilter = function (options) {
            var $filterItem = $('<div class="filter-item filter-select-item" data-key="' + options.key + '">\
                                            <span class="filter-label">'+ options.label + '：</span>\
                                            <select class="filter-select year-select">\
                                            </select>\
                                        </div>').insertBefore($filterResult),
                $select = $filterItem.children('.filter-select'),
                optionListHtml = '<option value="">' + filterEmptyText + '</option>',
                valueType = options.data[0] ? (typeof options.data[0].value) : 'string',
                textField = options.textField || 'text',
                valueField = options.valueField || 'value';
            //构建列表
            for (var i = 0, item; item = options.data[i]; i++) {
                optionListHtml += '<option value="' + item[valueField] + '">' + item[textField] + '</option>';
            }
            $select.html(optionListHtml);

            $select.on('change', function () {
                var $this = $(this),
                    value = $this.val(),
                    tag = $this.children(':selected').text();
                changeSelected({
                    key: options.key,
                    label: options.label,
                    value: valueToType(value, valueType),
                    tag: tag
                });
            });
            Ev.on('empty', function (e) {
                if (e.key == options.key) {
                    $select.val('');
                }
            });
            Ev.on('change', function (e) {
                if (e.key == options.key) {
                    $select.val(e.value);
                }
            });

            //设置默认选中项
            $select.val(options.selected || '');
            $select.trigger('change');
        },
        initFilterResult = function () {
            var $resultList = $filterResult.children('.filter-result-list'),
                resultItem = function (data) {
                    var $item = $resultList.children('[data-key=' + data.key + ']');
                    if (!$item.length) {
                        $item = $('<li class="filter-result" data-key="' + data.key + '">\
                                            <span class="filter-label">' + data.label + '：</span>\
                                        </li>').appendTo($resultList);
                    }
                    return {
                        add: function () {
                            $item.children('.default-tag').remove();
                            $item.append('<span class="filter-tag" data-value="' + data.value + '">' + data.tag + '<i class="icon-remove"></i></span>');
                        },
                        remove: function () {
                            $item.children('.filter-tag[data-value=' + data.value + ']').remove();
                        },
                        empty: function () {
                            $item.children('.filter-tag').remove();
                            $item.append('<span class="filter-tag default-tag" data-value="">' + filterEmptyText + '<i class="icon-remove"></i></span>');
                        }
                    }
                };
            $resultList.on('click', '.filter-tag', function () {
                var $this = $(this);
                if ($this.hasClass('default-tag')) {
                    return;
                }
                var data = {
                    key: $this.parent('.filter-result').data('key'),
                    value: $this.data('value')
                }
                removeSelected(data);
            });

            Ev.on('add', function (data) {
                resultItem(data).add();
            });
            Ev.on('remove', function (data) {
                resultItem(data).remove();
            });
            Ev.on('empty', function (data) {
                resultItem(data).empty();
            });
            Ev.on('change', function (data) {
                resultItem(data).empty();
                resultItem(data).add();
            });

        },
        doFilter = function () {
            onFilter(filterData);
        };

    //优先初始化结果相关功能
    initFilterResult();
    //依次构建filter项
    for (var i = 0, item; item = options[i]; i++) {
        if (item.type == 1) {
            initTagFilter(item);
        }
        else if (item.type == 2) {
            initSelectFilter(item);
        }
    }

    //在何时触发 onFilter
    Ev.on('add', doFilter);
    Ev.on('remove', doFilter);
    Ev.on('empty', doFilter);
    Ev.on('change', doFilter);

    doFilter();
};
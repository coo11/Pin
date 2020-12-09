let _sync = $cache.get("sync");
let _list = $cache.get("list");
let actions = $cache.get("actions");

let dataManager = require("./data-manager"),
  builder = require("./builder"),
  setting = require("./setting"),
  ui = require("./ui"),
  creator = require("./action-creator");

const bgcolor = $color("clear");
const dark = Number($device.isDarkMode);
const { width, scale } = $device.info.screen;
const COLOR = $color(...$cache.get("theme"));

function activeMenu(i) {
  let viewId = $("main").views.find(x => x.hidden == 0).id;
  let tappedId = ["itemlist", "actionlist", "settings"][i];
  if (tappedId != viewId) {
    $(viewId).hidden = 1;
    $(tappedId).hidden = 0;
    $("itemlist").setNeedsLayout();
  }
}

function init() {
  let topColunm = {
    type: "blur",
    props: { id: "top", style: 6 },
    layout: (make, view) => {
      make.top.left.right.inset(0);
      make.bottom.equalTo(view.super.safeAreaTop).offset(96);
    },
    views: [
      {
        type: "view",
        props: { id: "topview" },
        layout: (make, view) => {
          make.height.equalTo(44);
          make.right.left.inset(0);
          make.top.equalTo(view.super.safeAreaTop);
        },
        views: [
          {
            type: "tab",
            props: {
              id: "segment",
              index: _list,
              tintColor: COLOR, //iOS 12
              enabled: Boolean(_sync),
              items: ["本地", "iCloud"]
            },
            layout: (make, view) => {
              make.center.equalTo(view.super);
              make.height.equalTo(28);
              ui.setSegmentTextColor(view);
            },
            events: {
              changed(sender) {
                if (_sync !== 1) return;
                _list = sender.index;
                $cache.set("list", _list);
                dataManager.init();
              }
            }
          },
          {
            type: "label",
            props: {
              id: "title",
              textColor: ui.color.primary,
              font: $font("Lato-Medium", 18)
            },
            layout: (make, view) => make.center.equalTo(view.super)
          },
          ui.button({
            name: "plus",
            props: { id: "create" },
            layout: (make, view) => {
              make.right.inset(15);
              make.centerY.equalTo(view.super);
              make.size.equalTo(23);
              view.ocValue().$imageView().$setContentMode(1);
            },
            tap: async sender => {
              if ($("actionlist").hidden == 1) {
                const text = await $input.text();
                dataManager.addTextItems(text);
              } else popover(sender);
            }
          })
        ]
      },
      {
        type: "input",
        props: {
          attributedPlaceholder: ui.placeholder("     搜索文本"),
          bgcolor: ui.color.fill, //ui.rgba(200),
          align: $align.center,
          darkKeyboard: dark,
          paddingLeft: 23.04, //accurately computed
          font: $font(18),
          id: "search",
          cornerRadius: 10,
          info: []
        },
        views: [
          {
            type: "image",
            props: {
              image: ui.image("find"),
              tintColor: $color("systemSecondaryLabel")
            },
            layout: (make, view) => {
              make.centerY.equalTo(view.super);
              make.size.equalTo(18, 18);
              make.centerX.equalTo(view.super).offset(-34);
            }
          },
          {
            type: "view",
            layout: $layout.fill,
            events: {
              tapped: () => searchAnimation(),
              longPressed: () => searchAnimation(),
              doubleTapped: () => searchAnimation()
            }
          }
        ],
        layout: make => {
          make.left.right.inset(10);
          make.bottom.inset(8);
          make.height.lessThanOrEqualTo(36);
        },
        events: {
          returned: sender => sender.blur(),
          changed: sender => {
            let text = sender.text;
            let result = [];
            if (text != "") {
              let items = dataManager.getTextItems();
              result = items.filter(i => i.indexOf(text) > -1);
            }
            sender.info = result;
            let num = result.length,
              alpha = num ? 1 : 0.5;
            $("bottomlabel").views[0].enabled = Boolean(num);
            $("bottomlabel").views[0].alpha = alpha;
            $("bottomlabel").views[1].enabled = Boolean(num);
            $("bottomlabel").views[1].alpha = alpha;
            $("templist").data = result.map(i => {
              return { itemtext: { text: i } };
            });
          }
        }
      },
      {
        type: "label",
        props: {
          text: "取消",
          font: $font(18),
          textColor: COLOR
        },
        layout: (make, view) => {
          make.left.equalTo(view.prev.right).offset(10);
          make.centerY.equalTo(view.prev);
        },
        events: {
          tapped: sender => {
            sender.prev.text = "";
            searchAnimation(false);
          }
        }
      },
      {
        type: "view",
        props: {
          frame: $rect(0, 0, 0, -1 / scale),
          bgcolor: ui.color.boundary(),
          flex: "WT"
        }
      }
    ]
  };

  let bottomColunm = {
    type: "blur",
    props: { style: 6 },
    layout: (make, view) => {
      make.top.equalTo(view.super.safeAreaBottom).offset(-50);
      make.left.right.bottom.inset(0);
    },
    views: [
      {
        type: "matrix",
        props: {
          spacing: 0,
          columns: 3,
          bgcolor: $color("clear"),
          id: "bottomtab",
          itemHeight: 50,
          scrollEnabled: 0,
          template: [
            {
              type: "image",
              props: {
                bgcolor,
                id: "tabImage",
                tintColor: ui.color.placeholder
              },
              layout: (make, view) => {
                make.centerX.equalTo(view.super);
                make.size.equalTo(72);
                make.width.height.equalTo(25);
                make.top.inset(7);
              }
            },
            {
              type: "label",
              props: {
                id: "tabName",
                font: $font(10),
                textColor: $color("#A2A2A2")
              },
              layout: (make, view) => {
                make.centerX.equalTo(view.prev);
                make.bottom.inset(5);
              }
            }
          ],
          data: [
            {
              tabImage: {
                image: ui.image("pin"),
                tintColor: COLOR
              },
              tabName: { text: "Pin", textColor: COLOR }
            },
            {
              tabImage: { icon: $icon("055", $color("#A2A2A2")) },
              tabName: { text: "动作" }
            },
            {
              tabImage: { icon: $icon("002", $color("#A2A2A2")) },
              tabName: { text: "设置" }
            }
          ]
        },
        layout: $layout.fill,
        events: {
          didSelect(sender, indexPath) {
            const i = indexPath.row;
            [0, 1, 2].forEach(item => {
              const view = sender.cell($indexPath(0, item));
              const color = item === i ? COLOR : $color("#A2A2A2");
              view.get("tabImage").tintColor = color;
              view.get("tabName").textColor = color;
            });
            $("title").hidden = i === 0;
            $("segment").hidden = i !== 0;
            $("create").hidden = i === 2;
            $("title").text = i === 2 ? "设置" : "动作";
            activeMenu(i);
          }
        }
      },
      {
        type: "view",
        props: {
          alpha: 0,
          hidden: true,
          id: "bottomlabel"
        },
        views: [
          {
            type: "button",
            props: {
              bgcolor,
              alpha: 0.5,
              title: "分享",
              enabled: 0,
              font: $font(18),
              titleColor: COLOR
            },
            layout: (make, view) => {
              make.centerY.equalTo(view.super);
              make.left.inset(15);
            },
            events: {
              tapped(sender) {
                let list = $("search").info;
                $share.sheet(list.join("\n"));
              }
            }
          },
          {
            type: "button",
            props: {
              bgcolor,
              alpha: 0.5,
              title: "删除",
              enabled: 0,
              font: $font(18),
              titleColor: COLOR
            },
            layout: (make, view) => {
              make.centerY.equalTo(view.super);
              make.right.inset(15);
            },
            events: {
              tapped: () => {
                let list = $("search").info;
                $ui.menu({
                  items: [`确认删除 ${list.length} 条记录`],
                  handler: () => {
                    list = new Set(list);
                    let all = new Set(dataManager.getTextItems());
                    let target = [];
                    for (let i of all) {
                      if (!list.has(i)) target.push(i);
                    }
                    dataManager.saveTextItems(target);
                    $("templist").data = [];
                  }
                });
              }
            }
          }
        ],
        layout: make => {
          make.top.right.left.inset(0);
          make.height.equalTo(50);
        }
      },
      {
        type: "view",
        props: {
          frame: $rect(0, 0, 0, 1 / scale),
          bgcolor: ui.color.boundary(),
          flex: "WB"
        }
      }
    ]
  };

  $ui.render({
    props: {
      id: "main",
      debugging: 0,
      navBarHidden: 1,
      statusBarStyle: 0
    },
    views: [
      actionView(),
      setting.show(),
      builder.createClipboardView(),
      topColunm,
      bottomColunm
    ]
  });
  dataManager.init();
}

function searchAnimation(show = true) {
  let input = $("search");
  if (show) {
    $("main").add(builder.createClipboardView(true));
    $("bottomlabel").hidden = false;
    $("templist").moveToBack();
  } else {
    dataManager.init();
    $("bottomtab").hidden = false;
  }
  $ui.animate({
    duration: 0.2,
    animation: () => {
      $("itemlist").alpha = !Number(show);
      $("bottomtab").alpha = !Number(show);
      $("bottomlabel").alpha = Number(show);
      !show && ($("templist").alpha = Number(show));
      if (show) {
        input.align = $align.left;
        $("topview").updateLayout((make, view) =>
          make.top.equalTo(view.super.safeAreaTop).offset(-100)
        );
        input.updateLayout(make => make.right.inset(56));
        input.views[0].updateLayout(make =>
          make.centerX.equalTo(input).offset(-width / 2 + 48.52)
        );
        $("top").updateLayout((make, view) => {
          make.bottom.equalTo(view.super.safeAreaTop).offset(52);
        });
      } else {
        input.align = $align.center;
        input.blur();
        $("top").updateLayout((make, view) => {
          make.bottom.equalTo(view.super.safeAreaTop).offset(96);
        });
        $("topview").updateLayout((make, view) =>
          make.top.equalTo(view.super.safeAreaTop)
        );
        input.updateLayout(make => make.right.inset(10));
        input.views[0].updateLayout(make =>
          make.centerX.equalTo(input).offset(-34)
        );
      }
      $("main").relayout();
    },
    completion: () => {
      input.views[1].hidden = show;
      $("itemlist").hidden = show;
      if (!show) {
        $("templist").remove();
        $("bottomlabel").hidden = true;
      } else {
        input.focus();
        $("bottomtab").hidden = true;
      }
    }
  });
}

function popover(view) {
  $ui.popover({
    sourceView: view,
    directions: $popoverDirection.up,
    size: $size(width / 2, 88),
    views: [
      {
        type: "list",
        props: {
          scrollEnabled: 0,
          cornerRadius: 16,
          rowHeight: 44,
          data: [
            { label: { text: "新建底栏动作" } },
            { label: { text: "新建预览动作" } }
          ],
          template: [
            {
              type: "label",
              props: {
                align: $align.center,
                textColor: COLOR
              },
              layout: $layout.fill
            }
          ]
        },
        events: {
          didSelect: (_, indexPath) => {
            $ui.controller.dismiss();
            const i = indexPath.row;
            creator.process(i, action => {
              actions[i].unshift(action);
              $("actionlist").insert({
                indexPath: $indexPath(i, 0),
                value: createActionItem(action)
              });
              $cache.set("actions", actions);
            });
          }
        },
        layout: (make, view) => make.edges.equalTo(view.super.safeArea)
      }
    ]
  });
}

function actionView() {
  return {
    type: "list",
    props: {
      separatorColor: ui.color.boundary(),
      indicatorInsets: $insets(44, 0, 50, 0),
      header: {
        type: "view",
        props: { height: 44 }
      },
      footer: {
        type: "view",
        props: { height: 50 }
      },
      id: "actionlist",
      crossSections: 0,
      reorder: 1,
      hidden: 1,
      actions: [
        {
          title: "delete",
          handler: (_, indexPath) => {
            const { section, row } = indexPath;
            actions[section].splice(row, 1);
            $cache.set("actions", actions);
          }
        },
        {
          title: "启动",
          color: $color("#4B94F4"),
          handler: (_, indexPath) => {
            const { section, row } = indexPath;
            require("./helper").runAction(actions[section][row]);
          }
        }
      ],
      template: {
        props: { bgcolor: ui.color.cell },
        views: [
          {
            type: "label",
            props: { id: "actionname", textColor: ui.color.primary },
            layout: (make, view) => {
              make.centerY.equalTo(view.super);
              make.left.inset(15);
            }
          },
          {
            type: "label",
            props: {
              id: "actionpattern",
              font: $font(12),
              align: $align.right,
              textColor: $color("#a2a2a2")
            },
            layout: (make, view) => {
              make.width.equalTo(view.super).multipliedBy(0.5);
              make.centerY.equalTo(view.super);
              make.right.inset(15);
            }
          },
          {
            type: "image",
            props: {
              id: "actionicon",
              bgcolor: $color("clear")
            },
            layout: (make, view) => {
              make.centerY.equalTo(view.super);
              make.right.inset(20);
              make.size.equalTo(20);
            }
          }
        ]
      },
      data: mapActionItems()
    },
    layout: $layout.fillSafeArea,
    events: {
      didSelect: (_, indexPath) => {
        const { section, row } = indexPath,
          oldAction = actions[section][row];
        creator.process(
          section,
          newAction => {
            actions[section][row] = newAction;
            $("actionlist").data = mapActionItems();
            $cache.set("actions", actions);
          },
          oldAction
        );
      },
      reorderMoved: (fromIndexPath, toIndexPath) => {
        let sec = fromIndexPath.section;
        actions[sec].splice(
          toIndexPath.row,
          0,
          actions[sec].splice(fromIndexPath.row, 1)[0]
        );
      },
      reorderFinished: () => $cache.set("actions", actions)
    }
  };
}

/**
 * Convert action info to object which can be fit the cell
 * @returns {Object} To fill the cell in TableView
 */
function createActionItem({ name, pattern, icon = null } = {}) {
  if (icon) {
    icon = $icon(icon, COLOR);
    pattern = "";
  }
  return {
    actionicon: { icon: icon },
    actionname: { text: name },
    actionpattern: { text: pattern }
  };
}

/**
 * Make All cached actions info fits the list template structure
 * @returns {Object} To fill the list template
 */
function mapActionItems() {
  let scrollAction = actions[0].map(item => createActionItem(item));
  let previewAction = actions[1].map(item => createActionItem(item));
  return [
    { title: "底栏动作", rows: scrollAction },
    { title: "预览动作", rows: previewAction }
  ];
}

module.exports = { init: init };

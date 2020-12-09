let dataManager = require("./data-manager"),
  aparter = require("./apart-items"),
  ui = require("./ui");

let _sync = $cache.get("sync");
let _list = $cache.get("list");
let _prefs = $cache.get("today") || [0, 0, 12, 0, 0];

const textColor = ui.color.primary;
//const dark = Number($device.isDarkMode);
const COLOR = $color(...$cache.get("theme"));
const env = $app.env.toString().slice(0, 1) - 1;
const unitPixel = 1.0 / $device.info.screen.scale;
//const ver = parseInt($device.info.version.split(".")[0]) - 12;

const delTextItems = () => {
  let menu = ["清空本地记录", "清空云端记录", "清空所有记录"];
  $ui.menu({
    items: _sync === 1 ? menu : menu.splice(2, 1),
    handler: (_, idx) => {
      $clipboard.clear();
      ui.toast({ text: "已清空" });
      $device.taptic(2);
      idx == 0 && _list == 0 && ($("itemlist").data = []);
      idx == 1 && _list == 1 && ($("itemlist").data = []);
      idx == 2 && ($("itemlist").data = []);
      idx != 1 && dataManager.setTextItems([], 0);
      idx != 0 && dataManager.setTextItems([], 1);
      env == 1 && ($("i2clip").text = "");
    }
  });
};

function createClipboardView(search = false) {
  let bgcolor = env == 1 ? ui.color.todaybg : $color("clear"),
    topInset = search ? 52 : 96,
    props = env
      ? {}
      : {
          indicatorInsets: $insets(topInset, 0, 50, 0),
          header: {
            type: "view",
            props: { height: topInset }
          },
          footer: {
            type: "view",
            props: { height: 50 }
          }
        },
    events = env
      ? {
          pulled: sender => {
            sender.endRefreshing();
            $delay(0.4, () => refreshList());
          }
        }
      : search
      ? {
          willBeginDragging: () => {
            let status = $("search").editing;
            if (status) $("search").blur();
          }
        }
      : {
          layoutSubviews: view => {
            let y = view.contentOffset.y;
            let offset = 0,
              height = 0,
              alpha = 0;
            if ($("actionlist").hidden == 1 && $("settings").hidden == 1) {
              offset = y > 52 ? 0 : 52 - y;
              height = y > 36 ? 0 : y > 0 ? 36 - y : 36;
              alpha = y <= 0 ? 1 : y <= 36 ? (36 - y) / 36 : 0;
            }
            $("top").updateLayout((make, view) =>
              make.bottom.equalTo(view.super.safeAreaTop).offset(44 + offset)
            );
            $("search").updateLayout(make => make.height.equalTo(height));
            $("search").alpha = alpha;
          },
          didEndDragging: sender => {
            let y = sender.contentOffset.y;
            y < -100 && refreshList();
            scrollAnimation(sender);
          },
          didEndDecelerating: sender => scrollAnimation(sender)
        };
  let view = {
    type: "list",
    props: {
      bgcolor: $color("clear"),
      reorder: search,
      id: search ? "templist" : "itemlist",
      showsVerticalIndicator: 1,
      rowHeight: [44, 30, 36][env],
      separatorColor: ui.color.boundary(),
      template: {
        props: { bgcolor },
        views: [
          {
            type: "label",
            props: {
              textColor,
              id: "itemtext",
              align: $align.left,
              font: $font(env == 1 ? _prefs[2] : 14)
            },
            layout: (make, view) => {
              make.right.inset(0);
              make.centerY.equalTo(view.super);
              make.left.right.inset(16);
            }
          },
          {
            type: "button",
            props: { bgcolor: $color("clear") },
            layout: (make, view) => {
              make.right.top.bottom.inset(0);
              make.width.equalTo(view.super).dividedBy(6);
            },
            events: {
              tapped: sender => {
                $device.taptic(0);
                let prev = sender.prev;
                if (env == 2) $keyboard.insert(prev.text);
                else itemPreview(prev, search);
              }
            }
          }
        ]
      },
      actions: search
        ? []
        : [
            {
              title: "delete", //不用写 sender.delete(object)
              handler: (_, indexPath) => {
                let items = dataManager.getTextItems(),
                  { row } = indexPath;
                if (items[row] == $clipboard.text) {
                  $clipboard.clear();
                  env == 1 && ($("i2clip").text = "");
                }
                items.splice(row, 1);
                dataManager.saveTextItems(items);
              }
            },
            {
              title: "同步",
              color: $color("#F39B36"),
              handler: (sender, indexPath) => {
                let text = sender.object(indexPath).itemtext.text;
                if (_sync == 0)
                  ui.toast({ text: "同步已关闭", inset: 7, icon: "009" });
                else if (_sync == 2)
                  ui.toast({ text: "已自动同步", inset: 7, icon: "009" });
                else {
                  let items = dataManager.getTextItems(!_list);
                  items.unshift(text);
                  items = [...new Set(items)];
                  dataManager.setTextItems(items, !_list);
                  let toast = `已${_list ? "下载" : "上传"}`;
                  ui.toast({ text: toast, inset: 7 });
                }
              }
            },
            {
              title: "分词",
              color: $color("#4B94F4"),
              handler: (sender, indexPath) =>
                aparter.apart(sender.object(indexPath).itemtext.text)
            }
          ],
      ...props
    },
    layout: (make, view) => {
      make.left.right.inset(0);
      if (env == 1) {
        make.top.inset(30);
        make.bottom.inset(_prefs[4] ? 0 : 30);
      } else if (env == 2) make.top.bottom.inset(49);
      else make.top.bottom.equalTo(view.super.safeArea);
    },
    events: {
      didSelect: (_, __, data) => {
        $device.taptic(1);
        let text = data.itemtext.text;
        $clipboard.text = text;
        env == 1 && ($("i2clip").text = text);
      },
      reorderFinished: data => {
        const items = data.map(i => i.itemtext.text);
        dataManager.saveTextItems(items);
      },
      ...events
    }
  };
  return view;
}

function scrollAnimation(view) {
  let { y } = view.contentOffset;
  let point;
  if (y > 0 && y <= 26) point = $point(0, 0);
  else if (y > 26 && y <= 52) point = $point(0, 52);
  else return;
  $ui.animate({
    duration: 0.3,
    animation: () => {
      view.scrollToOffset(point);
      view.relayout();
    }
  });
}

function createPushView(title, button) {
  let views = [
    {
      type: "label",
      props: {
        textColor,
        text: title,
        font: $font("Lato-Medium", 18)
      },
      layout: (make, view) => {
        make.centerY.equalTo(view.super.bottom).offset(-22);
        make.centerX.equalTo(view.super);
      }
    },
    ui.button({
      name: "arrowl",
      layout: (make, view) => {
        make.left.inset(10);
        make.centerY.equalTo(view.prev);
        make.size.equalTo(22, 22);
        view
          .ocValue()
          .$imageView()
          .$setContentMode(1);
      },
      tap: () => $ui.pop()
    }),
    {
      type: "view",
      props: {
        frame: $rect(0, 0, 0, -unitPixel),
        bgcolor: ui.color.boundary(),
        flex: "WT"
      }
    }
  ];
  button && views.splice(2, 0, button);

  return {
    type: "blur",
    props: { style: 6, bgcolor: $color("clear") },
    layout: (make, view) => {
      make.top.left.right.inset(0);
      make.bottom.equalTo(view.super.safeAreaTop).offset(44);
    },
    views: views
  };
}

function pushViewListLayout() {
  return (make, view) => {
    make.left.right.inset(0);
    make.top.equalTo(view.super.safeAreaTop).offset(44);
    make.bottom.equalTo(view.super.safeAreaBottom);
  };
}

function refreshList() {
  dataManager.init();
  if (env === 1) $("i2clip").text = $clipboard.text || "";
  let t = dataManager.getTextItems();
  let total = `已记录 ${t.length} 条`;
  ui.toast({ text: total, inset: env ? 7 : 55 });
}

function itemPreview(label, search) {
  if (search && $("search").editing) $("search").blur();
  let { width, height } = $ui.window.frame,
    itemText = label.text;
  !env && (height = $("itemlist").frame.height); //safe height
  let size = $text.sizeThatFits({
    text: itemText.trim(),
    width: width - 16,
    font: $font(14)
  });
  let isCenter =
    (size.height < 51 && size.width < width - 30) || size.height < 17; //14pt:height:16.8
  let view = {
    type: "blur",
    props: {
      id: "bg",
      alpha: 0,
      bgcolor: $color("clear"),
      style: 6
    },
    layout: (make, view) => {
      if (env == 1) {
        view.borderWidth = unitPixel;
        view.borderColor = ui.color.boundary();
        view.radius = 8;
        make.bottom.left.right.inset(4);
        make.top.inset(0);
      } else make.edges.equalTo(view.super);
    },
    events: {
      tapped() {
        $device.taptic(0);
        ui.appear(0, "itemlist");
      },
      touchesBegan: sender => {
        $ui.animate({
          duration: 0.3,
          animation: () => {
            sender.get("blur").alpha = 0;
            sender.relayout();
          }
        });
      },
      touchesEnded: sender => {
        $ui.animate({
          duration: 0.3,
          animation: () => {
            sender.get("blur").alpha = 1;
            sender.relayout();
          }
        });
      }
    },
    views: [
      {
        type: "scroll",
        props: {
          bgcolor: $color("clear"),
          showsVerticalIndicator: 0,
          clipsToBounds: false,
          contentSize: $size(0, size.height + 8)
          //          scrollEnabled: size.height + 8 > height
        },
        layout: (make, view) => {
          make.height.equalTo(Math.min(size.height + 8, height));
          make.width.equalTo(view.super);
          make.centerY.equalTo(view.super.safeAreaCenterY);
        },
        views: [
          {
            type: "label",
            props: {
              userInteractionEnabled: false,
              align: isCenter ? $align.center : $align.left,
              textColor: ui.color.primary,
              bgcolor: $color("clear"),
              font: $font(14),
              lines: Math.floor(size.height / 16.8) + 1,
              text: itemText.trim()
            },
            layout: (make, view) => {
              make.size.equalTo($size(width - 16, size.height + 8));
              make.centerX.equalTo(view.super.super);
              make.top.inset(0);
            }
          }
        ],
        events: {
          willBeginDragging: sender => {
            $ui.animate({
              duration: 0.3,
              animation: () => {
                sender.next.alpha = 0;
                sender.next.relayout();
              }
            });
          },
          didEndDragging: sender => {
            $ui.animate({
              duration: 0.3,
              animation: () => {
                sender.next.alpha = 1;
                sender.next.relayout();
              }
            });
          }
        }
      },
      {
        type: "blur",
        props: {
          style: 4,
          alpha: 1,
          bgcolor: $color("clear"),
          cornerRadius: 12,
          borderColor: ui.color.boundary(),
          borderWidth: unitPixel
        },
        layout: (make, view) => {
          make.width.equalTo(view.super).multipliedBy(0.6);
          make.height.equalTo(env ? 28 : 32);
          make.centerY.equalTo(view.super.bottom).multipliedBy(0.75);
          make.centerX.equalTo(view.super);
        },
        views: [
          ui.button({
            name: "link",
            layout: (make, view) => {
              ui.shadow(view, COLOR);
              make.width.equalTo(view.super.width).dividedBy(3);
              make.height.equalTo(env ? 22 : 24);
              make.centerY.equalTo(view.super);
              make.left.inset(0);
              view
                .ocValue()
                .$imageView()
                .$setContentMode(1);
            },
            tap: () => {
              $device.taptic(0);
              let links = $detector.link(itemText);
              if (links.length === 0) {
                ui.toast({ text: "未检测到链接", icon: "225" });
              } else if (links[0] === itemText) {
                ui.toast({ text: "已存在", icon: "225" });
              } else {
                dataManager.addTextItems(links, false);
                ui.toast({ text: `提取 ${links.length} 条链接` });
              }
            }
          }),
          ui.button({
            name: "qr",
            layout: (make, view) => {
              ui.shadow(view, COLOR);
              make.width.equalTo(view.super.width).dividedBy(3);
              make.height.equalTo(env ? 22 : 24);
              make.center.equalTo(view.super);
              view
                .ocValue()
                .$imageView()
                .$setContentMode(1);
            },
            tap: () => {
              $device.taptic(0);
              let image = $qrcode.encode(itemText);
              env == 1 && ($widget.height = width);
              $("bg").add({
                type: "image",
                props: {
                  bgcolor: $color("white"),
                  image: image
                },
                layout: (make, view) => {
                  make.size.equalTo(width - 6);
                  make.center.equalTo(view.super);
                },
                events: {
                  tapped() {
                    $device.taptic(0);
                    $widget.height = 180;
                    ui.appear(0, "itemlist");
                  },
                  longPressed: () => {
                    $device.taptic(1);
                    $photo.save({
                      image: image,
                      handler: success =>
                        success && ui.toast({ text: "已保存至相册" })
                    });
                  }
                }
              });
              ui.guide(1, "长按即可保存二维码");
            }
          }),
          ui.button({
            name: "edit",
            layout: (make, view) => {
              ui.shadow(view, COLOR);
              make.width.equalTo(view.super.width).dividedBy(3);
              make.centerY.equalTo(view.super);
              make.height.equalTo(env ? 22 : 24);
              make.right.inset(0);
              view
                .ocValue()
                .$imageView()
                .$setContentMode(1);
            },
            props: { enabled: !search },
            tap: async () => {
              $device.taptic(0);
              const text = await $input.text({ text: itemText });
              if (text && text !== itemText) {
                const items = dataManager.getTextItems();
                if (items.indexOf(text) > -1) {
                  ui.toast({ text: "列表已存在", icon: "225" });
                  return;
                } else {
                  if ($clipboard.text === itemText) {
                    $clipboard.set({ type: "public.plain-text", value: text });
                    env == 1 && ($("i2clip").text = text);
                  }
                  const cell = label.super.super.ocValue();
                  const { row } = $("itemlist")
                    .ocValue()
                    .$indexPathForCell(cell)
                    .jsValue();
                  items[row] = text;
                  label.text = text;
                  dataManager.saveTextItems(items);
                  ui.toast({ text: "已保存" });
                  $device.taptic(0);
                  ui.appear(0, "itemlist");
                }
              }
            }
          })
        ]
      }
    ]
  };
  $ui.window.add(view);
  ui.appear(1, "itemlist");
  ui.guide(0, "双击文本编辑，长按查看二维码");
}

module.exports = {
  createClipboardView: createClipboardView,
  createPushView: createPushView,
  refreshList: refreshList,
  delTextItems: delTextItems,
  pushViewListLayout: pushViewListLayout
};

let ui = require("./ui"),
  builder = require("./builder");

const cellColor = ui.color.cell;
const textColor = ui.color.primary;
const COLOR = $color(...$cache.get("theme"));

const iconCell = {
  type: "view",
  props: { bgcolor: cellColor },
  layout: $layout.fill,
  views: [
    {
      type: "label",
      props: { text: "动作图标", textColor },
      layout: (make, view) => {
        make.centerY.equalTo(view.super);
        make.left.equalTo(15);
      }
    },
    {
      type: "image",
      props: {
        id: "icon-image",
        info: "",
        bgcolor: $color("clear")
      },
      layout: (make, view) => {
        make.size.equalTo(20, 20);
        make.centerY.equalTo(view.super);
        make.right.inset(15);
      }
    }
  ]
};

const encodeCell = {
  type: "view",
  props: { bgcolor: cellColor },
  layout: $layout.fill,
  views: [
    {
      type: "label",
      props: { text: "不进行 URL 编码", textColor },
      layout: (make, view) => {
        make.centerY.equalTo(view.super);
        make.left.equalTo(15);
      }
    },
    {
      type: "switch",
      props: {
        id: "encode-switch",
        onColor: COLOR
      },
      layout: (make, view) => {
        make.centerY.equalTo(view.super);
        make.right.inset(15);
      }
    },
    {
      type: "button",
      props: {
        icon: $icon("008", COLOR),
        bgcolor: $color("clear")
      },
      layout: (make, view) => {
        make.centerY.equalTo(view.super);
        make.right.equalTo(-80);
      },
      events: {
        tapped: () => {
          $ui.alert(
            "在大多数时候我们需要对链接里面的参数进行 URL 编码，但有些应用在解析参数的时候不会进行解码，所以会出现错误，在这种情况下你可以打开这个选项。"
          );
        }
      }
    }
  ]
};

exports.process = (section, handler, action = {}) => {
  let nameCell = createLabelCell("动作名称", "name-label");
  let patternCell = createLabelCell("动作模式", "pattern-label");
  let rows = [nameCell, patternCell, iconCell, encodeCell];
  if (section === 1) rows.splice(2, 1);

  $ui.push({
    props: {
      navBarHidden: 1,
      statusBarStyle: 0
    },
    layout: $layout.fill,
    views: [
      {
        type: "list",
        props: {
          separatorColor: ui.color.boundary(),
          data: [{ title: " ", rows: rows }],
//          bgcolor: $color("clear"),
          clipsToBounds: 0,
          header: { type: "view", props: { height: 44 } },
          footer: {
            type: "view",
            props: { height: 50 },
            views: [
              {
                type: "button",
                props: {
                  title: "完成",
                  cornerRadius: 10,
                  font: $font(19),
                  bgcolor: COLOR
                },
                layout: (make, view) => {
                  make.left.right.inset(8);
                  make.centerY.equalTo(view.super);
                  make.height.equalTo(40);
                },
                events: {
                  tapped: () => {
                    const name = $("name-label").text,
                      pattern = $("pattern-label").text,
                      icon = $("icon-image").info;
                    if (name && pattern) {
                      const noenc = $("encode-switch").on;
                      if (section === 1) handler({ name, pattern, noenc });
                      else if (!icon) return;
                      else handler({ name, pattern, icon, noenc });
                      $ui.pop();
                    }
                  }
                }
              }
            ]
          }
        },
        layout: $layout.fill,
        events: {
          didSelect: async (sender, indexPath) => {
            const cell = sender.cell(indexPath);
            ui.blink(cell.views[0].views[0]);
            if (indexPath.row == 0) {
              const label = cell.get("name-label"),
                text = await $input.text({ text: label.text || "" });
              if (text) label.text = text;
            } else if (indexPath.row == 1) showActionMenu(section);
            else if (indexPath.row == 2)
              $ui.selectIcon().then(name => {
                $("icon-image").info = name;
                $("icon-image").icon = $icon(name, COLOR);
              });
          }
        }
      },
      builder.createPushView("创建动作")
    ]
  });

  $("name-label").text = action.name || "";
  $("pattern-label").text = action.pattern || "";
  $("encode-switch").on = action.noenc || false;

  if (section === 0) {
    let iconName = action.icon || "";
    if (iconName) $("icon-image").icon = $icon(iconName, COLOR);
  }
};

function showActionMenu(section) {
  let options = ["自定义动作", "动作列表", "JSBox 脚本", "分享扩展"];
  if (section === 1) options.splice(2, 2);

  function pickHandler(name, pattern) {
    $("name-label").text = name;
    $("pattern-label").text = pattern;
  }

  $ui.menu(options).then(selected => {
    let idx = selected.index;
    if (idx == 0) {
      ui.toast({ text: "请用 %@ 代替含有关键字等参数的 URL", time: 2 });
      $input.text({
        type: $kbType.url,
        text: $("pattern-label").text || "",
        handler: text => {
          if (text) $("pattern-label").text = text;
        }
      });
    } else if (idx == 1) actionList(pickHandler, section);
    else if (idx == 2) jsList(pickHandler);
    else extensionList(pickHandler);
  });
}

function createLabelCell(name, identifier) {
  return {
    type: "view",
    props: { bgcolor: cellColor },
    layout: $layout.fill,
    views: [
      {
        type: "label",
        props: { text: name, textColor },
        layout: (make, view) => {
          make.centerY.equalTo(view.super);
          make.left.equalTo(15);
        }
      },
      {
        type: "label",
        props: {
          id: identifier,
          align: $align.right,
          textColor: COLOR
        },
        layout: (make, view) => {
          make.centerY.equalTo(view.super);
          make.right.inset(15);
          make.width.equalTo(view.super).multipliedBy(0.5);
        }
      }
    ]
  };
}

function actionList(handler, section) {
  let actions = JSON.parse($file.read("assets/actions.json").string);
  if (section === 1) actions.splice(0, 5);
  $ui.push({
    props: {
      navBarHidden: 1,
      statusBarStyle: 0
    },
    views: [
      {
        type: "list",
        props: {
          clipsToBounds: 0,
          bgcolor: ui.color.grouped,
          separatorColor: ui.color.boundary(),
          template: {
            props: {
              bgcolor: cellColor,
              textColor: ui.color.primary
            }
          },
          data: actions.map(item => {
            return {
              title: item.name,
              rows: item.items.map(i => i.name)
            };
          })
        },
        layout: builder.pushViewListLayout(),
        events: {
          didSelect: (_, indexPath) => {
            const { section, row } = indexPath;
            const { name, pattern } = actions[section]["items"][row];
            handler(name, pattern);
            $ui.pop();
          }
        }
      },
      builder.createPushView("动作列表")
    ]
  });
}

function jsList(handler) {
  let addins = $addin.list;
  $ui.push({
    props: {
      navBarHidden: 1,
      statusBarStyle: 0
    },
    views: [
      {
        type: "list",
        props: {
          clipsToBounds: 0,
          separatorColor: ui.color.boundary(),
          template: {
            props: {
              bgcolor: cellColor,
              textColor: ui.color.primary
            }
          },
          data: addins.map(item => item.displayName)
        },
        layout: builder.pushViewListLayout(),
        events: {
          didSelect: (_, indexPath) => {
            const { displayName } = addins[indexPath.row];
            handler(
              displayName,
              `jsbox://run?name=${encodeURIComponent(displayName)}`
            );
            $ui.pop();
          }
        }
      },
      builder.createPushView("JSBox 脚本")
    ]
  });
}

function appShareList() {
  let _image = $objc("UIImage").$imageNamed("AppIcon60x60"),
    _text = NSString.$stringWithString("text"),
    _url = NSURL.$URLWithString("https://apple.com");

  let list = NSMutableArray.$new();
  list.$addObject(_image);
  list.$addObject(_text);
  list.$addObject(_url);

  let activities = $objc(
      "UIApplicationExtensionActivity"
    ).$__applicationExtensionActivitiesForItems(list),
    count = activities.$count(),
    items = [];

  for (let idx = 0; idx < count; ++idx) {
    let activity = activities.$objectAtIndex(idx),
      name = activity.$activityTitle().jsValue(),
      type = activity.$activityType().jsValue(),
      image = activity.$__activityImage().jsValue();
    items.push({ name, type, image });
  }

  return items;
}

function extensionList(handler) {
  const items = appShareList();
  $ui.push({
    props: {
      navBarHidden: 1,
      statusBarStyle: 0
    },
    views: [
      {
        type: "list",
        props: {
          rowHeight: 64,
          clipsToBounds: 0,
          separatorColor: ui.color.boundary(),
          template: [
            {
              type: "image",
              props: {
                id: "image",
                bgcolor: $color("clear")
              },
              layout: (make, view) => {
                make.left.top.bottom.inset(10);
                make.width.equalTo(view.height);
              }
            },
            {
              type: "label",
              props: {
                id: "picker-name-label",
                font: $font("bold", 18),
                textColor: ui.color.primary
              },
              layout: (make, view) => {
                make.left.equalTo(view.prev.right).offset(10);
                make.top.equalTo(view.prev);
              }
            },
            {
              type: "label",
              props: {
                id: "picker-id-label",
                textColor: ui.color.primary
              },
              layout: (make, view) => {
                make.left.equalTo(view.prev);
                make.top.equalTo(view.prev.bottom);
                make.right.inset(10);
              }
            }
          ],
          data: items.map(({ name, type, image }) => {
            let props = {
              "picker-name-label": { text: name },
              "picker-id-label": { text: type }
            };
            if (image.size) props["image"] = { image };
            return props;
          })
        },
        layout: builder.pushViewListLayout(),
        events: {
          didSelect: (_, indexPath) => {
            const { name, type } = items[indexPath.row];
            handler(name, `compose://?id=${type}`);
            $ui.pop();
          }
        }
      },
      builder.createPushView("分享扩展")
    ]
  });
}

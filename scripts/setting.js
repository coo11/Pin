let today = $cache.get("today") || [[0, 1], 0, 12, 6, 0, 0];
let builder = require("./builder");
let ui = require("./ui");

const cv = 2.93;
const textColor = ui.color.primary;
const COLOR = $color(...$cache.get("theme"));

function show() {
  return {
    type: "list",
    props: {
      hidden: 1,
      id: "settings",
      tintColor: COLOR,
      separatorColor: ui.color.boundary(),
      indicatorInsets: $insets(44, 0, 50, 0),
      header: { type: "view", props: { height: 44 } },
      footer: {
        type: "view",
        props: { height: 100 },
        views: [
          {
            type: "label",
            props: {
              text: `Modified by coo11\nVersion ${cv}`,
              lines: 0,
              font: $font(12),
              align: $align.center,
              textColor: $color("#a2a2a2")
            },
            layout: (make, view) => {
              make.top.equalTo(0);
              make.centerX.equalTo(view.super);
            }
          }
        ]
      },
      template: [
        {
          type: "label",
          props: { id: "setTitle", textColor },
          layout: (make, view) => {
            make.centerY.equalTo(view.super);
            make.left.inset(15);
          }
        }
      ],
      data: [
        {
          title: "通用",
          rows: [
            { setTitle: { text: "清空记录列表" } },
            rowForSetTheme("主题颜色", 0),
            rowForSetTheme("主题颜色（深色模式)", 1),
            rowForTabOptions({
              title: "搜索引擎",
              items: ["默认", "谷歌", "必应", "百度"],
              index: today[1],
              handler: view => {
                today[1] = view.index;
                $cache.set("today", today);
              }
            }),
            rowForTabOptions({
              title: "iCloud 同步",
              items: ["关闭", "手动", "自动"],
              index: $cache.get("sync"),
              handler: view => {
                const i = view.index;
                $cache.set("sync", i);
                $cache.set("list", 0);
                if (i !== 0) {
                  let path = "drive://Pin+/text-items.json";
                  if (!$file.exists(path)) {
                    $file.mkdir("drive://Pin+/");
                    $file.write({
                      data: $data({ string: "[]" }),
                      path: path
                    });
                  }
                }
                $addin.restart();
              }
            })
          ]
        },
        {
          title: "通知中心",
          rows: [
            rowForTabOptions({
              title: "底栏滚动方式",
              items: ["滑动", "分页", "禁用"],
              index: today[0][1] ? (today[0][0] ? 0 : 1) : 2,
              handler: view => {
                today[0][0] = view.index ? 1 : 0;
                today[0][1] = view.index == 2 ? 0 : 1;
                $cache.set("today", today);
              }
            }),
            rowForTabOptions({
              title: "搜索引擎",
              items: ["默认", "谷歌", "必应", "百度"],
              idnex: today[1],
              handler: view => {
                today[1] = view.index;
                $cache.set("today", today);
              }
            }),
            rowForStepperOptions("字体大小", 2, [12, 16]),
            rowForStepperOptions("底栏图标列数", 3, [3, 30]),
            {
              props: { accessoryType: today[4] },
              setTitle: { text: "隐藏底栏" }
            },
            {
              props: { accessoryType: today[5] },
              setTitle: { text: "隐藏同步图标" }
            }
          ]
        },
        {
          title: "其他",
          rows: [
            { setTitle: { text: "重置" } },
            { setTitle: { text: "支持鼓励" } },
            { setTitle: { text: "使用说明" } },
            { setTitle: { text: "检查更新" } }
          ]
        }
      ]
    },
    layout: $layout.fillSafeArea,
    events: {
      didSelect: async (sender, indexPath) => {
        const { section, row } = indexPath;
        const cell = sender.cell(indexPath);
        switch (section) {
          case 0:
            switch (row) {
              case 0:
                builder.delTextItems();
                break;
              case 1:
              case 2:
                ui.blink(cell.views[0].views[0]);
                await setThemeColor(row - 1);
                break;
            }
            break;
          case 1:
            switch (row) {
              case 4:
              case 5:
                $device.taptic(1);
                today[row] = today[row] ? 0 : 3;
                $cache.set("today", today);
                cell.ocValue().$setAccessoryType(today[row]);
                break;
            }
            break;
          case 2:
            switch (row) {
              case 0:
                $ui.menu(["确认"]).then(() => {
                  $device.taptic(2);
                  $cache.clear();
                });
                break;
              case 1:
                support();
                break;
              case 2:
                readme();
                break;
              case 3:
                check();
                break;
            }
        }
      }
    }
  };
}

function rowForSetTheme(text, i) {
  const theme = $cache.get("theme");
  return {
    type: "view",
    layout: $layout.fill,
    views: [
      {
        type: "label",
        props: { text, textColor },
        layout: (make, view) => {
          make.centerY.equalTo(view.super);
          make.left.inset(15);
        }
      },
      {
        type: "button",
        props: {
          titleColor: COLOR,
          font: $font("Courier", 15),
          title: theme[i] || theme[0],
          userInteractionEnabled: false,
          contentEdgeInsets: $insets(4, 8, 4, 8),
          bgcolor: $color("systemTertiaryFill", "tertiarySurface")
        },
        layout: (make, view) => {
          make.centerY.equalTo(view.super);
          make.right.inset(15);
        }
      }
    ]
  };
}

function rowForTabOptions({ title, items, index, handler }) {
  return {
    type: "view",
    layout: $layout.fill,
    views: [
      {
        type: "label",
        props: { text: title, textColor },
        layout: (make, view) => {
          make.centerY.equalTo(view.super);
          make.left.inset(15);
        }
      },
      {
        type: "tab",
        props: { items, index },
        layout: (make, view) => {
          make.centerY.equalTo(view.prev);
          make.right.inset(15);
          ui.setSegmentTextColor(view);
        },
        events: { changed: handler }
      }
    ]
  };
}

function rowForStepperOptions(text, index, range) {
  return {
    type: "vew",
    layout: $layout.fill,
    views: [
      {
        type: "label",
        props: { text, textColor },
        layout: (make, view) => {
          make.centerY.equalTo(view.super);
          make.left.inset(15);
        }
      },
      {
        type: "stepper",
        props: {
          min: range[0],
          max: range[1],
          value: today[index],
          tintColor: COLOR
        },
        layout: (make, view) => {
          make.centerY.equalTo(view.super);
          make.right.inset(15);
          //BUG: https://forums.developer.apple.com/thread/121495
          const _view = view.ocValue();
          _view.$setIncrementImage_forState(
            _view.$incrementImageForState(0),
            0
          );
          _view.$setDecrementImage_forState(
            _view.$decrementImageForState(0),
            0
          );
        },
        events: {
          changed: sender => {
            sender.next.text = sender.value;
            today[index] = sender.value;
            $cache.set("today", today);
          }
        }
      },
      {
        type: "label",
        props: {
          text: String(today[index]),
          textColor: COLOR
        },
        layout: (make, view) => {
          make.centerY.equalTo(view.super);
          make.right.equalTo(view.prev.left).offset(-10);
        }
      }
    ]
  };
}

async function setThemeColor(i) {
  let value = $cache.get("theme");
  const { index } = await $ui.menu(["跟随应用", "自定义"]);
  if (index === 0) {
    value[i] = "tint";
    $cache.set("theme", value);
  } else if (index === 1) {
    let text = await $input.text({
      type: $kbType.ascii,
      text: value[i],
      placeholder: "输入 HEX 颜色值或语义化颜色字符串"
    });
    if (!text || text === value[i]) return;
    text = text.replace(/^#/, "");
    const isNamed = text in $color("namedColors");
    const isHex = /^[0-9A-F]{3}([0-9A-F]{3})?$/i.test(text);
    if (!isNamed && !isHex) ui.toast({ text: "输入有误", icon: "225" });
    text = isHex ? `#${text.toUpperCase()}` : text;
    value[i] = text;
    $cache.set("theme", value);
  }
  $addin.restart();
}

function support() {
  $ui.push({
    type: "view",
    props: {
      id: "_view",
      navBarHidden: 1,
      statusBarStyle: 0
    },
    layout: $layout.fill,
    views: [
      {
        type: "view",
        props: { bgcolor: $color("white") },
        layout: builder.pushViewListLayout(),
        views: [
          {
            type: "image",
            props: {
              src: "assets/support/bg.png"
            },
            layout: (make, view) => {
              let l = $device.info.screen.width;
              make.right.left.inset(0);
              make.size.equalTo(l, l);
              make.top.equalTo(view.super.top).offset(-44);
            }
          },
          {
            type: "label",
            props: {
              text: "Pin+",
              font: $font(72),
              align: $align.right
            },
            layout: make => {
              make.top.left.inset(30);
            }
          },
          {
            type: "label",
            props: {
              text: "感谢使用与支持。",
              font: $font("bold", 36),
              align: $align.right
            },
            layout: (make, view) => {
              make.top.equalTo(view.prev.bottom);
              make.left.inset(30);
            }
          },
          {
            type: "label",
            props: {
              id: "_label",
              text: "打赏列表",
              font: $font("bold", 24),
              align: $align.right
            },
            layout: (make, view) => {
              make.top.equalTo(view.prev.bottom).offset(10);
              make.left.inset(30);
            }
          },
          {
            type: "list",
            props: {
              id: "_list",
              showsVerticalIndicator: 0,
              bgcolor: $color("clear"),
              rowHeight: 28,
              cornerRadius: 10,
              template: {
                props: {
                  textColor: $color("black"),
                  bgcolor: $color("clear"),
                  font: $font(12)
                }
              }
            },
            layout: (make, view) => {
              make.top.equalTo(view.prev.bottom).offset(10);
              make.left.inset(30);
              make.width.equalTo(100);
              make.height.equalTo(168);
            },
            events: {
              ready: sender => {
                sender.data = $cache.get("thx");
                $http.download({
                  url: "https://cdn.jsdelivr.net/gh/coo11/Pin@master/thxlist",
                  handler: resp => {
                    let data = JSON.parse(resp.data.string);
                    sender.data = data;
                    $cache.set("thx", data);
                  }
                });
              }
            }
          },
          {
            type: "lottie",
            props: {
              src: "assets/support/ani.json",
              loop: 1,
              userInteractionEnabled: 0
            },
            layout: make => {
              make.centerY.equalTo($("_label"));
              make.centerX.equalTo($("_label").right).offset(30);
              make.size.equalTo(200, 200);
            },
            events: {
              ready: sender => sender.play()
            }
          },
          {
            type: "button",
            props: {
              bgcolor: $color("clear"),
              src: "assets/support/wx.png"
            },
            layout: (make, view) => {
              make.left.equalTo($("_list").left);
              make.size.equalTo($size(110, 40));
              view.ocValue().$imageView().$setContentMode(1);
              make.top.equalTo($("_list").bottom).offset(10);
            },
            events: {
              tapped(sender) {
                $ui.alert({
                  title: "打开微信扫码支持一下",
                  message: "\n保存赞赏码到相册?",
                  actions: [
                    {
                      title: "好的",
                      handler: () => {
                        $photo.save({
                          data: $file.read("assets/support/wx.jpg"),
                          handler: async success => {
                            if (success) {
                              let { index } = await $ui.alert({
                                message: "已保存到相册，打开微信扫码？",
                                actions: ["是", "否"]
                              });
                              if (index === 0)
                                $app.openURL("weixin://scanqrcode");
                            }
                          }
                        });
                      }
                    },
                    { title: "算了" }
                  ]
                });
              }
            }
          }
        ]
      },
      builder.createPushView("支持鼓励")
    ]
  });
}

async function check() {
  ui.guide(5, "检查中，请勿连续点击…");
  let res = await $http.get("http://t.cn/AiWvsbMn");
  let ver = res.data.pinp;
  if (ver <= cv) {
    ui.toast({ text: "您这是最新版本^_^" });
    return;
  }
  $("toastView") && $("toastView").remove();
  let { index } = await $ui.alert({
    title: "更新提示",
    message: `发现新版本 ${ver}，是否升级？`,
    actions: ["否", "是"]
  });
  if (index == 0) return;
  let url = "http://t.cn/Ai0mhtx6";
  let { displayName, name } = $addin.current;
  $http.download({
    url: url,
    showsProgress: 1,
    handler: res => {
      let code = res.response.statusCode;
      if (code == 200) {
        let time = new Date().valueOf();
        let url = `jsbox://run?name=${encodeURIComponent(
          displayName
        )}&bak=${time}`;
        $file.copy({
          src: "/assets/text-items.json",
          dst: `shared://${time}-items.json`
        }) &&
          $addin.save({
            name: name,
            data: res.data,
            handler: success => {
              if (success) {
                ui.toast({ text: "升级完毕" });
                $device.taptic(2);
                $delay(0.6, () => $app.openURL(url));
              }
            }
          });
      } else ui.toast({ text: `更新失败 ${code}` });
    }
  });
}

function readme() {
  $ui.push({
    props: {
      navBarHidden: 1,
      statusBarStyle: 0
    },
    layout: $layout.fill,
    views: [
      {
        type: "markdown",
        props: {
          clipsToBounds: 0,
          content: $file.read("README.md").string
        },
        layout: builder.pushViewListLayout()
      },
      builder.createPushView("使用说明")
    ]
  });
}

module.exports = { show: show };
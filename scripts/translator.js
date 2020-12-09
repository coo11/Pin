const languageKv = {
    "de-DE": "de",
    "en-US": "en",
    "en-GB": "en",
    "es-ES": "es",
    "fr-FR": "fr",
    "ja-JP": "ja",
    "ko-KR": "ko",
    "pt-PT": "pt",
    "ru-RU": "ru",
    "zh-CN": "zh-CN",
    "zh-HK": "zh-HK",
    "zh-TW": "zh-TW"
  },
  transClang = Object.keys(languageKv),
  transClangCN = [
    "德语",
    "英语(美国)",
    "英语(英国)",
    "西班牙语",
    "法语",
    "日语",
    "韩语",
    "葡萄牙语",
    "俄语",
    "简体中文",
    "繁中(香港)",
    "繁中(台湾)"
  ],
  env = $app.env,
  origClang = ["auto", ...transClang],
  origClangCN = ["自动", ...transClangCN],
  unitPixel = 1.0 / $device.info.screen.scale,
  COLOR = $color(...$cache.get("theme"));

let ui = require("./ui"),
  origLg,
  transLg,
  origPD,
  transPD,
  timer,
  isBack; //解决返回主视图时动画不自然的问题

function transUI() {
  if (env == 2) {
    $widget.height = 400;
    isBack = 0;
  }
  $ui.render({
    props: { id: "mainbg" },
    events: {
      layoutSubviews: () => {
        $delay(0.0, () => {
          const v = $("iptvw"),
            w = v.frame.width,
            h = v.frame.height;
          if (isBack) return;
          else if (env == 2) {
            v.views[0].frame = $rect(0, 0, w, h / 2);
            v.views[1].frame = $rect(0, h / 2, w, h / 2);
          } else if (env == 3) {
            v.views[0].frame = $rect(0, 0, w / 2, h);
            v.views[1].frame = $rect(w / 2, 0, w / 2, h);
          }
        });
      }
    },
    views: [
      {
        type: "view",
        props: {
          borderColor: ui.color.boundary(false),
          bgcolor: ui.color.widget,
          id: "mainvw",
          borderWidth: unitPixel,
          cornerRadius: 10,
          alpha: 0
        },
        layout: make => make.edges.inset(4),
        events: {
          ready: () => {
            if (env == 3) {
              timer = $timer.schedule({
                interval: 1,
                handler: () => {
                  let x = $keyboard.selectedText || "";
                  if (x == "" || x == $("originput").text) return;
                  else {
                    $("originput").text = x;
                    translate();
                  }
                }
              });
            }
          },
          themeChanged: sender =>{
            sender.borderColor = ui.color.boundary(false)
          }
        },
        views: [
          ui.button({
            name: "x",
            layout: (make, view) => {
              ui.shadow(view);
              make.size.equalTo(20, 20);
              make.right.inset(6);
              make.top.inset(4);
            },
            tap: () => {
              isBack = 1;
              if (env == 2) $widget.height = 180;
              if (env == 3) timer.invalidate();
              ui.back();
            }
          }),
          {
            type: "label",
            props: {
              textColor: COLOR,
              text: "谷歌翻译",
              font: $font("bold", 16),
              bgcolor: $color("clear"),
              align: $align.center
            },
            layout: (make, view) => {
              ui.shadow(view);
              make.centerX.equalTo(view.super);
              make.top.inset(4);
            },
            events: {
              tapped: () => translate()
            }
          },
          {
            type: "view",
            props: { id: "iptvw" },
            layout: make => make.edges.equalTo($insets(28, 0, 28, 0)),
            events: {
              ready: () => {
                $delay(0.0, () => {
                  $ui.window.ocValue().$layoutSubviews();
                });
              }
            },
            views: [
              {
                type: "view",
                props: {
                  id: "originputbg",
                  bgcolor: $rgba(200, 200, 200, 0.25)
                },
                views: [
                  {
                    type: "text",
                    props: {
                      id: "originput",
                      font: $font(12),
                      editable: env != 3,
                      insets: $insets(5, 0, 5, 0),
                      bgcolor: $color("clear"),
                      textColor: ui.color.primary
                    },
                    layout: $layout.fill,
                    events: {
                      didChange: () => {
                        if ($("originput").text === undefined) {
                          $("origbtn").title = "自动";
                          origLg = "auto";
                        } else translate();
                      }
                    }
                  }
                ]
              },
              {
                type: "view",
                props: { bgcolor: $rgba(0, 0, 0, 0.25) },
                views: [
                  {
                    type: "text",
                    props: {
                      id: "transinput",
                      editable: 0,
                      selectable: 1,
                      font: $font(12),
                      insets: $insets(5, 0, 5, 0),
                      bgcolor: $color("clear"),
                      textColor: ui.color.primary
                    },
                    layout: $layout.fill
                  }
                ]
              }
            ]
          },
          {
            type: "view",
            props: { frame: $rect(0, -28, 0, 28), flex: "WT" },
            views: [
              ui.button({
                name: "trash",
                layout: (make, view) => {
                  make.left.inset(4);
                  make.centerY.equalTo(view.super);
                  make.size.equalTo(20);
                  ui.shadow(view);
                },
                tap: () => {
                  $device.taptic(0);
                  $("originput").text = "";
                  $("transinput").text = "";
                },
                props: { circular: 0 }
              }),
              ui.button({
                name: "copy",
                layout: (make, view) => {
                  make.right.inset(4);
                  make.centerY.equalTo(view.super);
                  make.size.equalTo(20);
                  ui.shadow(view);
                },
                tap: () => {
                  let text = $("transinput").text;
                  if (text) {
                    let dataManager = require("./data-manager");
                    dataManager.addTextItems(text, false);
                    ui.toast({ text: "翻译结果已复制", inset: 36 });
                  }
                },
                props: { circular: 0 }
              }),
              ui.button({
                name: "convert",
                layout: (make, view) => {
                  ui.shadow(view);
                  make.center.equalTo(view.super);
                  make.size.equalTo(20);
                },
                tap: () => {
                  let switchLg = $("origbtn").title;
                  $("origbtn").title = $("transbtn").title;
                  $("transbtn").title = switchLg;
                  let switchText = $("originput").text;
                  $("originput").text = $("transinput").text;
                  $("transinput").text = switchText;
                  let switchTextlg = origLg;
                  origLg = transLg;
                  transLg = switchTextlg;
                }
              }),
              {
                type: "button",
                props: {
                  id: "origbtn",
                  font: $font("bold", 14),
                  titleColor: COLOR,
                  bgcolor: $color("clear")
                },
                layout: (make, view) => {
                  ui.shadow(view);
                  make.centerY.equalTo(view.super);
                  make.right.equalTo(view.prev.left).inset(10);
                },
                events: {
                  tapped() {
                    $("lgPVBg").hidden = 0;
                  }
                }
              },
              {
                type: "button",
                props: {
                  id: "transbtn",
                  font: $font("bold", 14),
                  titleColor: COLOR,
                  bgcolor: $color("clear")
                },
                layout: (make, view) => {
                  ui.shadow(view);
                  make.centerY.equalTo(view.super);
                  make.left.equalTo(view.prev.prev.right).inset(10);
                },
                events: { tapped: () => ($("lgPVBg").hidden = 0) }
              }
            ]
          },
          {
            type: "view",
            props: {
              id: "lgPVBg",
              bgcolor: $color("clear"),
              style: 4,
              hidden: 1
            },
            events: {
              tapped: () => {
                $("lgPVBg").hidden = 1;
              }
            },
            views: [
              {
                type: "blur",
                props: {
                  frame: $rect(0, -150, 0, 150),
                  borderColor: ui.color.boundary(),
                  borderWidth: unitPixel,
                  id: "lgPickBg",
                  cornerRadius: 10,
                  flex: "WT",
                  style: 4
                },
                views: [
                  {
                    type: "picker",
                    props: {
                      id: "lgPick",
                      items: [origClangCN, ["翻译为"], transClangCN]
                    },
                    layout: (make, view) => {
                      make.left.right.inset(20);
                      make.bottom.inset(0);
                      make.height.equalTo(view.super).multipliedBy(0.9);
                    },
                    events: {
                      changed: sender => {
                        $device.taptic(0);
                        for (let i in origClangCN) {
                          if (origClangCN[i] === sender.data[0])
                            origPD = origClang[i];
                        }
                        for (let i in transClangCN) {
                          if (transClangCN[i] === sender.data[2])
                            transPD = transClang[i];
                        }
                      }
                    }
                  },
                  {
                    type: "button",
                    props: {
                      title: "取消",
                      font: $font(14),
                      titleColor: ui.color.primary,
                      bgcolor: $color("clear")
                    },
                    layout: make => {
                      make.top.inset(2);
                      make.left.inset(8);
                    },
                    events: {
                      tapped() {
                        $device.taptic(0);
                        $("lgPVBg").hidden = 1;
                      }
                    }
                  },
                  {
                    type: "button",
                    props: {
                      title: "完成",
                      font: $font(14),
                      titleColor: ui.color.primary,
                      bgcolor: $color("clear")
                    },
                    layout: make => {
                      make.right.inset(8);
                      make.top.inset(2);
                    },
                    events: {
                      tapped: () => {
                        $device.taptic(0);
                        langPick();
                        translate();
                      }
                    }
                  }
                ]
              }
            ],
            layout: $layout.fill
          },
          {
            type: "label",
            props: {
              frame: $rect(0, 28, 0, unitPixel),
              bgcolor: ui.color.boundary(),
              flex: "WB"
            }
          },
          {
            type: "label",
            props: {
              frame: $rect(0, -28, 0, unitPixel),
              bgcolor: ui.color.boundary(),
              flex: "WT"
            }
          }
        ]
      }
    ]
  });
  ui.back(1);
}

function gtrans(text) {
  transUI();
  if (text) {
    $("originput").text = text;
    origLg = "auto";
    transLg = cnTest();
    translate();
  } else {
    origLg = "en-US";
    transLg = "zh-CN";
    $("origbtn").title = getZhTitle(origLg);
    $("transbtn").title = getZhTitle(transLg);
  }
}

function cnTest() {
  let translang;
  let cn = new RegExp("[\u4e00-\u9fa5]+");
  let slang = cn.test($("originput").text);
  if (slang) translang = "en-US";
  else translang = "zh-CN";
  return translang;
}

function translate() {
  $http.request({
    method: "POST",
    url: "http://translate.google.cn/translate_a/single",
    header: {
      "User-Agent": "iOSTranslate",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: {
      dt: "t",
      q: $("originput").text,
      tl: transLg,
      ie: "UTF-8",
      sl: origLg,
      client: "ia",
      dj: "1"
    },
    handler: resp => {
      let data = resp.data.sentences,
        orig = "",
        trans = "";
      data.forEach(e => {
        orig = orig.concat(e.orig + "\n");
        trans = trans.concat(e.trans + "\n");
      });
      let src = resp.data.src || data.src;
      if (src == "en" || src == "es" || src == "fr" || src == "pt") {
        if (origLg == "auto") {
          origLg = getKeyByValue(src);
          $("origbtn").title = getZhTitle(origLg);
        }
      } else {
        origLg = getKeyByValue(src);
        $("origbtn").title = getZhTitle(origLg) || "自动";
      }
      $("transinput").text = trans.trim();
      $("transbtn").title = getZhTitle(transLg);
    }
  });
}

function langPick() {
  origLg = origPD || "auto";
  $("origbtn").title = getZhTitle(origLg) || "自动";
  transLg = transPD || "de-DE";
  $("transbtn").title = getZhTitle(transLg);
  $("lgPVBg").hidden = 1;
}

const getKeyByValue = val => {
  for (let i in languageKv) {
    if (languageKv[i] == val) {
      return i;
    }
  }
};

const getZhTitle = key => transClangCN[transClang.indexOf(key)];

module.exports = {
  gtrans: gtrans
};

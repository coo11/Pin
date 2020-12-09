let ui = require("./ui"),
  timer;

const searchEngines = [
  {
    name: "M-W",
    pattern: "http://merriam-webster.com/dictionary/"
  },
  {
    name: "Oxford",
    pattern: "https://www.oxfordlearnersdictionaries.com/us/definition/english/"
  },
  {
    name: "Collins",
    pattern: "https://www.collinsdictionary.com/dictionary/english/"
  },
  {
    name: "Free Dictionary",
    pattern: "http://idioms.thefreedictionary.com/"
  },
  {
    name: "Urban",
    pattern: "https://www.urbandictionary.com/define.php?term="
  },
  {
    name: "Bing",
    pattern: "http://cn.bing.com/dict/search?q="
  }
];
const env = $app.env;
const COLOR = $color(...$cache.get("theme"));

function show() {
  if (env == 3) $keyboard.height = 267;
  const unitPixel = 1.0 / $device.info.screen.scale;
  $ui.window.add({
    type: "view",
    props: { id: "bg", alpha: 0 },
    layout: (make, view) => {
      make.left.right.bottom.inset(0);
      make.top.inset(0.2);
    },
    events: {
      ready: () => {
        if (env == 3) {
          timer = $timer.schedule({
            interval: 2,
            handler: () => {
              let x = $keyboard.selectedText || "";
              if (x == "") return;
              else translate(x);
            }
          });
        }
      }
    },
    views: [
      {
        type: "view",
        props: {
          borderColor: ui.color.boundary(false),
          bgcolor: ui.color.widget,
          borderWidth: unitPixel,
          cornerRadius: 10
        },
        layout: make => {
          make.edges.inset(4);
        },
        events: {
          themeChanged: sender => {
            sender.borderColor = ui.color.boundary(false);
            sender.views[2].borderColor = ui.color.boundary(false);
          }
        },
        views: [
          ui.button({
            name: "x",
            layout: (make, view) => {
              ui.shadow(view);
              make.size.equalTo(24, 24);
              make.top.left.inset(5);
            },
            tap: () => {
              ui.appear(0);
              $device.taptic(0);
              if (env == 3) {
                $keyboard.height = 314;
                timer.invalidate();
              }
            }
          }),
          ui.button({
            name: "copy",
            layout: (make, view) => {
              ui.shadow(view);
              make.size.equalTo(24, 24);
              make.right.top.inset(5);
            },
            tap: () => {
              if ($("result").text != "") {
                let dataManager = require("./data-manager");
                dataManager.addTextItems($("result").text);
                ui.toast({ text: "翻译结果已复制", inset: 42 });
              } else return;
            },
            props: { circular: 0 }
          }),
          {
            type: "input",
            props: {
              attributedPlaceholder: ui.placeholder("输入单词或词语查询…"),
              darkKeyboard: $device.isDarkMode,
              borderColor: ui.color.boundary(false),
              textColor: ui.color.primary,
              bgcolor: ui.color.todaybg,
              id: "wordsearch",
              hidden: env == 3,
              font: $font(12),
              borderWidth: unitPixel,
              cornerRadius: 10
            },
            layout: (make, view) => {
              if (env == 3) return;
              make.top.inset(5.5);
              make.height.equalTo(24);
              make.left.inset(39);
              make.width.equalTo(view.super.width).dividedBy(2);
            },
            events: {
              returned: sender => {
                sender.blur();
                translate(sender.text);
              },
              changed: sender => translate(sender.text)
            }
          },
          {
            type: "button",
            props: {
              id: "name",
              title: "英汉词典",
              font: $font("bold", 18),
              bgcolor: $color("clear"),
              titleColor: COLOR
            },
            layout: (make, view) => {
              ui.shadow(view);
              if (env == 3) {
                make.centerX.equalTo(view.super);
                make.height.equalTo(34);
              } else {
                make.right.inset(39);
                make.left.equalTo(view.prev.right).offset(10);
              }
              make.centerY.equalTo(view.prev.prev.centerY);
            },
            events: {
              tapped() {
                if (env == 3) return;
                if ($("wordsearch").editing) {
                  if ($("wordsearch").text == "") return;
                  else translate($("wordsearch").text);
                } else {
                  $("wordsearch").text = "";
                  $("result").text = "";
                }
              }
            }
          },
          {
            type: "view",
            props: { bgcolor: ui.color.todaybg },
            layout: make => make.edges.equalTo($insets(34, 0, 0, 0)),
            views: [
              {
                type: "text",
                props: {
                  font: $font(12),
                  id: "result",
                  editable: 0,
                  textColor: ui.color.primary,
                  bgcolor: $color("clear")
                },
                layout: make => make.edges.equalTo($insets(0, 4, 30, 4))
              },
              {
                type: "tab",
                props: {
                  bgcolor: $color("clear"),//ui.color.todaybtn,
                  tintColor: COLOR, //iOS 12
                  font: $font(14),
                  index: Number($cache.get("engine")) || 0,
                  items: ["有道", "扇贝", "金山", "谷歌"]
                },
                layout: (make, view) => {
                  make.left.bottom.inset(4);
                  make.height.equalTo(22);
                  make.width.equalTo(view.super).multipliedBy(0.5);
                },
                events: {
                  changed: sender => {
                    $cache.set("engine", sender.index);
                    $cache.remove("textSound");
                    $("result").text = "";
                    if ($("wordsearch").text === "") return;
                    else translate($("wordsearch").text);
                  }
                }
              },
              ui.button({
                name: "safari",
                layout: (make, view) => {
                  make.right.inset(6);
                  make.centerY.equalTo(view.prev);
                  ui.shadow(view);
                  make.size.equalTo(24);
                },
                tap: async () => {
                  if ($("wordsearch").text != "")
                    searchMore($("wordsearch").text);
                  else {
                    let text = await $input.text();
                    if (text) searchMore(text);
                    else return;
                  }
                }
              }),
              ui.button({
                name: "volume",
                layout: (make, view) => {
                  ui.shadow(view);
                  make.size.equalTo(24, 24);
                  make.centerY.equalTo(view.prev);
                  make.right.inset(39);
                },
                tap: () => {
                  $device.taptic(0);
                  let sound = $cache.get("textSound");
                  if (sound && sound.length == 2)
                    $audio.play({
                      url: sound[0],
                      events: {
                        didPlayToEndTime: () => $audio.play({ url: sound[1] })
                      }
                    });
                  else {
                    if ($("result").text == "") return;
                    else {
                      ui.toast({ text: "系统TTS", isnet: 42 });
                      speechText($("wordsearch").text);
                    }
                  }
                }
              })
            ]
          },
          {
            type: "label",
            props: {
              frame: $rect(0, 34, 0, unitPixel),
              bgcolor: ui.color.boundary(),
              flex: "WB"
            }
          }
        ]
      }
    ]
  });
  ui.appear(1);
}

//TTS
function speechText(text) {
  let lan = whichLan(text),
    rate = 0.5;
  if (lan == "en") {
    lan = "en-US";
    rate = 0.4;
  }
  $text.speech({ text: text, rate: rate, language: lan });
}

function translate(text) {
  $cache.remove("textSound");
  let engine = $cache.get("engine") || 0;
  if (engine == 0) youdaotrans(text);
  else if (engine == 1) shanbeitrans(text);
  else if (engine == 2) kingsofttrans(text);
  else googletrans(text);
}

//有道词典
function youdaotrans(text) {
  let url =
    "https://dict.youdao.com/jsonapi?le=eng&q=" +
    text +
    "&keyfrom=dataserver&doctype=json&jsonversion=2";
  let codeUrl = encodeURI(url);
  $http.request({
    method: "GET",
    url: codeUrl,
    timeout: 5,
    handler: resp => {
      let data = resp.data;
      if (Object.keys(data).length == 0) {
        $("result").text = "";
        return;
      }
      let dic = data.meta.dicts,
        meanText = "";
      if (dic.includes("urg")) {
        let ugc = data.ugc;
        if (!ugc.success) $ui.error(ugc.reason);
      } else if (dic.includes("ec")) {
        let ec = data.ec.word[0];
        if (ec.ukphone != "" && ec.ukphone !== undefined) {
          meanText = "BrE /" + ec.ukphone + "/   AmE /" + ec.usphone + "/\n";
          let prou = "http://dict.youdao.com/dictvoice?audio=";
          $cache.set("textSound", [prou + ec.ukspeech, prou + ec.usspeech]);
        }
        if (ec.hasOwnProperty("wfs"))
          meanText +=
            ec.wfs
              .map(({ wf: { name, value } }) => `${name}: ${value}`)
              .join(" ") + "\n";
        meanText += ec.trs.map(i => i.tr[0].l.i[0]).join("\n");
      } else if (dic.includes("ce")) {
        let ce = data.ce.word[0];
        if (ce.hasOwnProperty("phone")) meanText = "[" + ce.phone + "]" + "\n";
        meanText += ce.trs
          .map(j => {
            return j.tr[0].l.i
              .map(k => {
                if (k != "" && k != " ") k = k["#text"];
                return k;
              })
              .join("");
          })
          .join("\n");
      } else if (dic.includes("fanyi")) meanText = data.fanyi.tran;
      $("result").text = meanText;
    }
  });
}
//扇贝接口
function shanbeitrans(text) {
  $http.request({
    method: "GET",
    url: "https://api.shanbay.com/bdc/search/?word=" + text,
    timeout: 5,
    handler: resp => {
      let data = resp.data;
      if (data == "")
        ui.toast({
          text: "请检查待查询内容,该API不支持汉译英",
          inset: 42,
          icon: "225"
        });
      else if (data.msg != "SUCCESS") $("result").text = data.msg;
      else {
        $("result").text =
          "BrE /" +
          data.data.pronunciations.uk +
          "/   AmE /" +
          data.data.pronunciations.us +
          "/\n" +
          data.data.definition;
      }
      let uss = data.data.audio_addresses.us[0],
        uks = data.data.audio_addresses.uk[0];
      $cache.set("textSound", [uks, uss]);
    }
  });
}
//金山词霸
function kingsofttrans(text) {
  let url =
      "http://dict-mobile.iciba.com/interface/index.php?c=word&m=getsuggest&nums=1&client=6&is_need_mean=1&word=" +
      text,
    codeUrl = encodeURI(url);
  $http.get({
    url: codeUrl,
    timeout: 5,
    handler: resp => {
      let data = resp.data.message[0];
      if (resp.data.status == 1) {
        let length = data.means.length,
          meanText = "";
        for (let i = 0; i < length; i++) {
          meanText += data.means[i].part;
          meanText += " ";
          let meansLength = data.means[i].means.length;
          for (let j = 0; j < meansLength; j++) {
            meanText += data.means[i].means[j];
            meanText += "; ";
          }
          if (i < length - 1) meanText += "\n";
        }
        if ($("wordsearch").text == data.key || env == 3)
          $("result").text = meanText;
        else if (env == 2)
          $("result").text =
            "提示:查询到与键入内容不符的单词 [ " + data.key + " ]\n" + meanText;
      } else ui.toast({ text: "请检查待查询内容", inset: 42, icon: "225" });
    }
  });
}
//谷歌翻译
function googletrans(text) {
  let sl = whichLan(text);
  let tl = "";
  if (sl == "en") {
    tl = "zh-CN";
  } else {
    tl = "en";
  }
  $http.request({
    method: "POST",
    url: "http://translate.google.cn/translate_a/single",
    timeout: 5,
    header: {
      "User-Agent": "iOSTranslate",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: {
      dt: "t",
      q: text,
      tl: tl,
      ie: "UTF-8",
      sl: sl,
      client: "ia",
      dj: "1"
    },
    showsProgress: 0,
    handler: resp => {
      let data = resp.data;
      let length = data.sentences.length;
      if (length != undefined) {
        let meanText = " ";
        for (let i = 0; i < length; i++) {
          meanText += data.sentences[i].trans;
          if (i < length - 1) meanText += "\n";
        }
        $("result").text = meanText;
      }
    }
  });
}

function whichLan(text) {
  let englishChar = text.match(/[a-zA-Z]/g),
    englishNumber = !englishChar ? 0 : englishChar.length,
    chineseChar = text.match(/[\u4e00-\u9fff\uf900-\ufaff]/g),
    chineseNumber = !chineseChar ? 0 : chineseChar.length,
    tl = "en";
  if (chineseNumber * 2 >= englishNumber) tl = "zh-CN";
  else tl = "en";
  return tl;
}

function searchMore(text) {
  $ui.menu({
    items: searchEngines.map(i => i.name),
    handler: (_, idx) => {
      text = encodeURIComponent(text);
      $app.openURL(`${searchEngines[idx].pattern}${text}`);
    }
  });
}

function dic(text) {
  $cache.remove("textSound");
  show();
  $("wordsearch").text = text || "";
  translate(text);
}

module.exports = { dic: dic };
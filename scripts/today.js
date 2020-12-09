let _sync = $cache.get("sync");
let _list = $cache.get("list");
let _prefs = $cache.get("today") || [[0, 1], 0, 12, 6, 0, 0];

let dataManager = require("./data-manager"),
  builder = require("./builder"),
  helper = require("./helper"),
  ui = require("./ui");

const dark = Number($device.isDarkMode);
const COLOR = $color(...$cache.get("theme"));
const unitPixel = 1 / $device.info.screen.scale;
const ver = parseInt($device.info.version.split(".")[0]) - 12;

const layout = (make, view, name) => {
  const image = view.ocValue().$imageView();
  image.$setContentMode(1);
  //  ui.shadow(view, COLOR);
  if (name === "x") make.right.inset(8);
  else make.right.equalTo(view.prev.left).offset(-4);
  make.top.inset(2);
  make.size.equalTo(22.4);
};

function init() {
  let views = [
    ui.button({
      name: "x",
      tap: () => {
        $("i2clip").text = "";
        $clipboard.clear();
        ui.toast({ text: "剪贴板已清空", inset: 7 });
        $device.taptic(0);
      },
      long: () => builder.delTextItems(),
      layout
    }),
    ui.button({
      name: "share",
      tap: () => {
        $device.taptic(0);
        if ($("i2clip").text !== undefined && $("i2clip").text != "")
          $share.sheet($("i2clip").text);
        else ui.blink($("i2clip"));
      },
      long: () => {
        let items = dataManager.getTextItems();
        if (items == "") {
          ui.toast({ text: "记录列表为空", inset: 7 });
          $device.taptic(0);
        } else $share.sheet(items.join("\n"));
      },
      layout
    }),
    ui.button({
      name: "cloud",
      tap: createSyncView,
      layout
    }),
    ui.button({
      name: "trans",
      tap: () => {
        $device.taptic(0);
        let ptext = $("i2clip").text || "";
        if (ptext.length > 0) {
          let translator = require("./translator");
          translator.gtrans(ptext);
        } else ui.blink($("i2clip"));
        $("i2clip").blur();
      },
      long: () => {
        let ptext = $("i2clip").text,
          dic = require("./dictionary");
        dic.dic(ptext);
        $("i2clip").blur();
      },
      layout
    }),
    ui.button({
      name: "search",
      tap: () => {
        $device.taptic(0);
        let t = $("i2clip").text;
        if (t == "") ui.blink($("i2clip"));
        else {
          let widgetPreview = require("./preview");
          widgetPreview.show(t);
          $("i2clip").blur();
        }
      },
      long: () => {
        let t = $("i2clip").text;
        if (t == "") ui.blink($("i2clip"));
        else if ($detector.link(t) != "") $app.openURL($detector.link(t)[0]);
        else if ($detector.phoneNumber(t) != "")
          $app.openURL("tel:" + $detector.phoneNumber(t));
        else if (t) {
          const urls = [
            "x-web-search://?",
            "https://www.google.com/search?q=",
            "http://cn.bing.com/search?q=",
            "https://m.baidu.com/s?word="
          ];
          $app.openURL(urls[_prefs[1]] + encodeURIComponent(t));
        }
      },
      layout
    }),
    {
      type: "input",
      props: {
        attributedPlaceholder: ui.placeholder("剪贴板无内容"),
        borderColor: ui.color.boundary(false),
        textColor: ui.color.primary,
        bgcolor: ui.color.todaybg,
        font: $font(_prefs[2]),
        borderWidth: unitPixel,
        align: $align.left,
        darkKeyboard: dark,
        id: "i2clip",
        cornerRadius: 10
      },
      layout: (make, view) => {
        make.top.inset(1);
        make.left.inset(8);
        make.height.equalTo(24.4);
        make.right.equalTo(view.prev.left).offset(-8);
      },
      events: {
        returned: saveTextFromInput,
        changed: saveTextFromInput, // $input 方法 Bug
        themeChanged: sender => {
          sender.borderColor = ui.color.boundary(false);
        }
      }
    },
    builder.createClipboardView(),
    createActionView(),
    {
      type: "label",
      props: {
        frame: $rect(0, 30, 0, unitPixel),
        bgcolor: ui.color.boundary(),
        flex: "WB"
      }
    },
    {
      type: "label",
      props: {
        frame: $rect(0, -30 - unitPixel, 0, unitPixel),
        bgcolor: ui.color.boundary(),
        flex: "WT"
      }
    }
  ];
  if (ver) delete views[5].events.returned;
  else delete views[5].events.changed;
  _prefs[4] && views.splice(-3, 1);
  _prefs[5] && views.splice(2, 1);
  $ui.render({
    props: { id: "main" },
    views: views,
    events: {
      appeared: () => {
        dataManager.init();
        $("i2clip").text = $clipboard.text || "";
      }
    }
  });
  !_prefs[4] && initActionButtons();
}

function saveTextFromInput(sender) {
  let text = sender.text;
  dataManager.addTextItems(text);
}

function createActionView() {
  return {
    type: "scroll",
    props: {
      id: "actionview",
      bgcolor: ver ? $color("clear") : ui.rgba(255, 0.28),
      pagingEnabled: _prefs[0][0],
      scrollEnabled: _prefs[0][1],
      alwaysBounceVertical: 0,
      showsHorizontalIndicator: 0,
      showsVerticalIndicator: 0,
      frame: $rect(0, -30 - unitPixel, 0, 30 + unitPixel),
      flex: "WT"
    }
  };
}

function initActionButtons() {
  let actionView = $("actionview"),
    actions = $cache.get("actions")[0],
    length = actions.length,
    columns = Math.min(length, _prefs[3]);
  for (let i = 0; i < length; i++) {
    const { icon, pattern, noenc } = actions[i],
      button = {
        type: "button",
        props: {
          bgcolor: $color("clear"),
          icon: $icon(icon, COLOR, $size(18, 18)),
          info: { pattern, noenc }
        },
        layout: (make, view) => {
          if (i) make.left.equalTo(view.prev.right);
          else make.left.equalTo(0);
          make.top.inset(0);
          make.height.equalTo(30);
          make.width.equalTo(view.super).dividedBy(columns);
        },
        events: {
          tapped(sender) {
            $device.taptic(0);
            helper.runAction(sender.info);
          }
        }
      };
    actionView.add(button);
  }
  actionView.relayout();
  const width = ((actionView.frame.width - 16) / columns) * length;
  actionView.contentSize = $size(width, 30);
}

function createSyncView() {
  $device.taptic(0);
  $ui.window.add({
    type: "view",
    props: { id: "bg" },
    layout: $layout.fill,
    events: {
      tapped: sender => {
        if ($("modeMenu")) menuAnimate($("modeMenu"));
        if ($("manuallyMenu")) menuAnimate($("manuallyMenu"));
        sender.remove();
      }
    }
  });
  $ui.window.add(_sync == 1 ? manuallySyncMenu() : syncMenu());
  menuAnimate(_sync == 1 ? $("manuallyMenu") : $("modeMenu"));
}

function manuallySyncMenu() {
  const data = [
    "查看本地记录",
    "查看云端记录",
    "同步云端记录至本地",
    "同步本地记录至云端",
    "更改同步模式"
  ];
  data.splice(_list, 1);
  return {
    type: "list",
    props: {
      id: "manuallyMenu",
      data: data,
      ...menuProps()
    },
    layout: make => {
      make.top.inset(30);
      make.right.inset(8);
      make.size.equalTo($size(138, 120));
    },
    events: {
      didSelect: (sender, indexPath) => {
        $device.taptic(0);
        let idx = indexPath.row;
        if (idx == 0) {
          _list = Number(!_list);
          $cache.set("list", _list);
          dataManager.init();
          ui.toast({ text: `已显示${_list ? "云端" : "本地"}记录`, inset: 7 });
          $("bg").remove();
        } else if (idx == 3) {
          $ui.window.add(syncMenu());
          menuAnimate($("modeMenu"));
        } else {
          idx = idx - 1;
          let local = dataManager.getTextItems(0),
            cloud = dataManager.getTextItems(1),
            all = local.concat(cloud);
          all = dataManager.mergeTextItems(all);
          dataManager.setTextItems(all, idx);
          if (_list == idx) dataManager.init();
          ui.toast({ text: `已同步至${idx ? "云端" : "本地"}`, inset: 7 });
          $("bg").remove();
        }
        menuAnimate(sender);
      }
    }
  };
}

function syncMenu() {
  const data = ["关闭", "手动", "自动"].map((i, j) => {
    return { props: { text: i, accessoryType: _sync == j ? 3 : 0 } };
  });
  return {
    type: "list",
    props: {
      id: "modeMenu",
      data: data,
      ...menuProps()
    },
    layout: make => {
      make.right.top.inset(30);
      make.size.equalTo($size(104, 90));
    },
    events: {
      didSelect: (_, indexPath) => {
        $device.taptic(0);
        let i = indexPath.row;
        if (i != _sync) {
          _sync = i;
          $cache.set("sync", i);
          if (i !== 0) {
            let path = "drive://Pin+/text-items.json";
            if (!$file.exists(path)) {
              $file.mkdir("drive://Pin+/");
              $file.write({
                data: $data({ string: JSON.stringify([]) }),
                path: path
              });
            }
          } else {
            $cache.set("list", 0);
            _list = 0;
          }
          dataManager.init();
          let toast =
            i == 0 ? "已关闭同步功能" : `已变更为${i == 1 ? "手" : "自"}动同步`;
          ui.toast({ text: toast, inset: 7 });
        }
        menuAnimate($("bg"));
        menuAnimate($("modeMenu"));
      }
    }
  };
}

function menuProps() {
  return {
    bgcolor: $color(ui.rgba(255, 0.8), ui.rgba(50, 0.8)),
    separatorColor: ui.color.boundary(),
    borderColor: ui.color.boundary(),
    showsVerticalIndicator: 0,
    borderWidth: unitPixel,
    tintColor: COLOR,
    rowHeight: 30,
    cornerRadius: 10,
    hidden: 1,
    alpha: 0,
    template: {
      props: {
        textColor: ui.color.primary,
        font: $font(_prefs[2])
      }
    }
  };
}

function menuAnimate(view) {
  if (!view.hidden) {
    $ui.animate({
      duration: 0.3,
      animation: () => (view.alpha = 0),
      completion: () => view.remove()
    });
  } else {
    view.hidden = 0;
    $ui.animate({
      duration: 0.3,
      animation: () => (view.alpha = 1)
    });
  }
}

module.exports = { init: init };

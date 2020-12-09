exports.apart = async content => {
  const ui = require("./ui"),
    unitPixel = 1.0 / $device.info.screen.scale,
    tokens = await $text.tokenize({ text: content }),
    tIndex = Array.from({ length: tokens.length }, (v, k) => k);

  let mode = $cache.get("apartMode") || 0,
    index = [],
    results = [];

  function init() {
    if (mode === 0) {
      index = [];
      results = [];
    } else {
      index = [...tIndex];
      results = [...tokens];
    }
  }

  init();

  $ui.render({
    props: {
      navBarHidden: 1,
      statusBarStyle: 0
    },
    views: [
      {
        type: "view",
        props: {
          alpha: 0,
          cornerRadius: 10,
          bgcolor: ui.color.todaybg,
          borderWidth: unitPixel,
          borderColor: ui.color.boundary(false)
        },
        layout: (make, view) => {
          make.edges.equalTo(view.super.safeArea).inset(4);
        },
        events: {
          themeChanged: sender => {
            sender.borderColor = ui.color.boundary(false);
          }
        },
        views: [
          ui.button({
            name: "x",
            layout: make => {
              make.size.equalTo(22);
              make.top.left.inset(5);
            },
            tap: () => ui.back()
          }),
          {
            type: "label",
            props: {
              font: $font("bold", 16),
              text: mode === 1 ? "分词:剔除模式" : "分词:常规",
              textColor: $color(...$cache.get("theme"))
            },
            layout: (make, view) => {
              ui.shadow(view);
              make.centerX.equalTo(view.super);
              make.centerY.equalTo(view.prev);
            },
            events: {
              tapped(sender) {
                if (mode === 0) {
                  $cache.set("apartMode", 1);
                  sender.text = "分词:剔除模式";
                  mode = 1;
                } else {
                  $cache.set("apartMode", 0);
                  sender.text = "分词:常规";
                  mode = 0;
                }
                reset(true);
                ui.toast({
                  text: "模式已改变",
                  inset: $app.env == 3 ? 38 : 34,
                  icon: "009"
                });
              }
            }
          },
          ui.button({
            name: "copy",
            layout: make => {
              make.size.equalTo(22, 22);
              make.top.right.inset(5);
            },
            tap: () => {
              $device.taptic(0);
              if (results.length > 0) {
                const dataManager = require("./data-manager");
                dataManager.addTextItems(results.join(""), false);
                const text = `选中内容已${mode == 0 ? "复制" : "剔除"}`;
                ui.toast({ text, inset: $app.env == 3 ? 38 : 34 });
                reset(false);
              }
            },
            props: { circular: 0 }
          }),
          {
            type: "matrix",
            props: {
              spacing: 4,
              bgcolor: $color("clear"),
              scrollEnabled: 1,
              template: [
                {
                  type: "label",
                  props: {
                    id: "tile",
                    bgcolor: $rgba(100, 100, 100, 0.25),
                    cornerRadius: 8,
                    font: $font(12),
                    align: $align.center,
                    borderWidth: unitPixel,
                    borderColor: ui.color.boundary()
                  },
                  layout: $layout.fill
                }
              ],
              data: tokens.map(i => {
                return { tile: { text: i } };
              })
            },
            layout: make => {
              make.left.right.bottom.inset(0.2);
              make.top.inset(30);
            },
            events: {
              didSelect: (sender, indexPath) => {
                $device.taptic(0);
                let cell = sender.cell(indexPath),
                  row = indexPath.row,
                  label = cell.get("tile");
                if (mode === 0) {
                  let i = index.indexOf(row);
                  if (i > -1) {
                    results.splice(i, 1);
                    index.splice(i, 1);
                    deselected(label);
                  } else {
                    results.push(label.text);
                    index.push(row);
                    selected(label);
                  }
                } else {
                  let i = index.indexOf(row);
                  if (i > -1) {
                    results.splice(i, 1);
                    index.splice(i, 1);
                    selected(label);
                  } else {
                    index.push(i);
                    index.sort((a, b) => a - b);
                    results.splice(index.indexOf(i), 0, label.text);
                    deselected(label);
                  }
                }
              },
              didLongPress: (sender, indexPath) => {
                let text = sender.cell(indexPath).get("tile").text;
                let dataManager = require("./data-manager");
                dataManager.addTextItems(text, false);
                $device.taptic(0);
                ui.toast({
                  text: "已复制",
                  inset: $app.env == 3 ? 38 : 34
                });
              },
              itemSize: (sender, indexPath) => {
                let data = sender.object(indexPath),
                  { width } = $text.sizeThatFits({
                    text: data.tile.text,
                    width: 320,
                    font: $font(12)
                  });
                return $size(width + 12, $app.env == 2 ? 20 : 24);
              },
              forEachItem: (view, indexPath) => {
                let { row } = indexPath;
                let tile = view.get("tile");
                if (mode == 0) {
                  if (index.indexOf(row) > -1) selected(tile);
                  else deselected(tile);
                } else {
                  if (index.indexOf(row) > -1) deselected(tile);
                  else selected(tile);
                }
              }
            }
          },
          {
            type: "label",
            props: {
              frame: $rect(0, 30, 0, unitPixel),
              bgcolor: ui.color.boundary(),
              flex: "WB"
            }
          }
        ]
      }
    ]
  });
  ui.back(1);

  function reset(switching) {
    $device.taptic(0);
    if ((!switching && mode === 0) || (switching && mode === 1)) {
      for (let i of index) {
        let cell = $("matrix").cell($indexPath(0, i));
        deselected(cell.get("tile"));
      }
    } else {
      for (let i of tIndex) {
        if (index.indexOf(i) < 0) {
          let cell = $("matrix").cell($indexPath(0, i));
          deselected(cell.get("tile"));
        }
      }
    }
    init();
  }

  function selected(label) {
    label.bgcolor = $color(ui.rgba(100), ui.rgba(50));
  }

  function deselected(label) {
    label.bgcolor = ui.rgba(200);
  }
};
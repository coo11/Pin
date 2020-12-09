const ui = require("./ui");
const COLOR = $color(...$cache.get("theme"));

const layout = (make, view, name) => {
  make.width.equalTo(view.super).dividedBy(4);
  if (name == "arrowl") make.left.equalTo(0);
  else make.left.equalTo(view.prev.right);
  ui.shadow(view);
  make.height.equalTo(20);
  make.bottom.inset(3);
  view
    .ocValue()
    .$imageView()
    .$setContentMode(1);
};

exports.show = text => {
  if ($app.env == 2) $widget.height = 400;
  else if ($app.env == 32) $keyboard.height = 400;
  const engines = $cache.get("actions")[1];
  const link = $detector.link(text)[0];
  if (link) engines.unshift({ name: "链接", pattern: "link" });
  const targetUrl = index => {
    const { pattern, noenc } = engines[index];
    if (pattern === "link") return link;
    else {
      const keyword = noenc ? text : encodeURIComponent(text);
      return pattern.replace("%@", keyword);
    }
  };
  $ui.window.add({
    type: "view",
    props: { id: "bg", alpha: 0 },
    views: [
      {
        type: "tab",
        props: {
          tintColor: COLOR,
          items: engines.map(i => i.name)
        },
        layout: make => {
          make.left.right.inset(6);
          make.top.inset(4);
          make.height.equalTo(22);
        },
        events: {
          changed: sender => ($("web").url = targetUrl(sender.index))
        }
      },
      {
        type: "view",
        props: {
          cornerRadius: 10,
          bgcolor: ui.color.widget,
          borderColor: ui.color.boundary(false),
          borderWidth: 1.0 / $device.info.screen.scale
        },
        layout: make => make.edges.equalTo($insets(30, 4, 4, 4)),
        events: {
          themeChanged: sender => {
            sender.borderColor = ui.color.boundary(false);
          }
        },
        views: [
          ui.button({
            name: "x",
            layout: (make, view) => {
              ui.shadow(view, COLOR);
              make.left.top.inset(3);
              make.size.equalTo(22, 22);
            },
            tap: () => {
              ui.appear(0);
              $device.taptic(0);
              if ($app.env == 2) $widget.height = 180;
              else if ($app.env == 32) $keyboard.height = 314;
            }
          }),
          ui.button({
            name: "safari",
            layout: (make, view) => {
              ui.shadow(view, COLOR);
              make.right.top.inset(3);
              make.size.equalTo(22);
            },
            tap: () => $app.openURL($("web").url)
          }),
          {
            type: "label",
            props: {
              textColor: ui.color.primary,
              bgcolor: $color("clear"),
              font: $font("bold", 12),
              align: $align.center
            },
            layout: (make, view) => {
              make.width.equalTo(view.super).multipliedBy(0.5);
              ui.shadow(view, view.textColor);
              make.centerX.equalTo(view.super);
              make.top.inset(6);
            }
          },
          {
            type: "web",
            props: {
              id: "web",
              url: targetUrl(0)
            },
            layout: make => make.edges.equalTo($insets(28, 0, 28, 0)),
            events: {
              didStart: sender => (sender.prev.text = sender.url),
              didFinish: sender => (sender.prev.text = sender.url)
            }
          },
          ui.button({ name: "arrowl", layout, tap: () => $("web").goBack() }),
          ui.button({
            name: "arrowr",
            layout,
            tap: () => $("web").goForward()
          }),
          ui.button({
            name: "share1",
            layout,
            tap: () => $share.sheet($("web").url)
          }),
          ui.button({ name: "refresh", layout, tap: () => $("web").reload() })
        ]
      }
    ],
    layout: $layout.fillSafeArea
  });
  ui.appear(1);
};

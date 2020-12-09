const ver = parseInt($device.info.version.split(".")[0]) - 12;
const env = $app.env.toString().slice(0, 1) - 1;
const COLOR = $color(...$cache.get("theme"));

const rgba = (n, a = 0.25) => $rgba(n, n, n, a);
exports.rgba = rgba;

const baseColor = {
  fill: $color("systemTertiaryFill", "secondarySurface"),
  placeholder: $color("systemPlaceholderText"),
  grouped: $color("groupedBackground"),
  cell: $color("secondarySurface"),
  primary: $color("primaryText"),
  bg: $color("backgroundColor"),
  widget: $color(rgba(200), rgba(150)),
  todaybg: $color(rgba(200), rgba(100)),
  todaybtn: $color(rgba(255), rgba(200)),
  boundary: function(isDynamic = true) {
    //BUG: In today's extension, borderColor may be shows incorrectly after rerendered.
    if ($app.env === 1) return $color("systemSeparator");
    else if ($app.env === 2) {
      if (isDynamic) return $color(rgba(100), rgba(100, 0.8));
      else return $device.isDarkMode ? rgba(100, 0.8) : rgba(100);
    }
  }
};
exports.color = baseColor;

const shadow = (view, color = COLOR, opacity = 0.4) => {
  const layer = view.ocValue().$layer();
  color = color.ocValue().$CGColor();
  layer.$setShadowOpacity(opacity);
  layer.$setShadowOffset($size(2, 0));
  layer.$setShadowColor(color);
};
exports.shadow = shadow;

const image = name => {
  const path = `./assets/src/${name}.png`;
  return $image(path).alwaysTemplate;
};
exports.image = image;

exports.button = ({ name, layout, tap, long, props = { circular: true } }) => {
  return {
    type: "button",
    props: {
      tintColor: COLOR,
      bgcolor: $color("clear"),
      image: image(name),
      ...props
    },
    layout: (make, view) => layout(make, view, name),
    events: { tapped: tap, longPressed: long }
  };
};

const hideMainView = (hidden, p) => {
  if (env == 0) {
    for (let i of $("main").views) {
      let needsHidden =
        (i.ocValue().__clsName == "BBBlurView" && i.id != "bg") || i.id == p;
      needsHidden && (i.hidden = hidden);
    }
  } else {
    for (let i of $("main").views) i.id != "bg" && (i.hidden = hidden);
  }
  !ver &&
    env == 1 &&
    ($("main").bgcolor = hidden ? rgba(255, 0.28) : $color("clear"));
};

exports.appear = (isAppear = 1, p = "actionlist") => {
  isAppear && hideMainView(1, p);
  $ui.animate({
    duration: 0.4,
    animation: () => ($("bg").alpha = isAppear),
    completion: () => {
      if (!isAppear) {
        $("bg").remove();
        hideMainView(0, p);
      }
    }
  });
};

exports.back = (isRender = 0) => {
  !isRender && $device.taptic(0);
  $ui.animate({
    duration: 0.4,
    animation: () => {
      for (let i of $ui.window.views) i.alpha = isRender;
    },
    completion: () => {
      if (isRender) return;
      let main = ["app", "today", "keyboard"];
      let module = require("./" + main[env]);
      module.init();
    }
  });
};

exports.placeholder = text => {
  const str = $objc("NSMutableAttributedString")
    .$alloc()
    .$initWithString(text);
  str.$addAttribute_value_range(
    "NSColor",
    $color("systemSecondaryLabel").ocValue(),
    $range(0, text.length)
  );
  return str.jsValue();
};

exports.setSegmentTextColor = view => {
  const attri = NSMutableDictionary.$new();
  attri.$setObject_forKey(COLOR.ocValue(), "NSColor");
  view.ocValue().$setTitleTextAttributes_forState(attri, 0);
};

const toast = ({ text, inset = 9, icon = "064", time = 0.6 }) => {
  inset = inset > 10 ? inset : [44 + inset, 34, 52][env];

  let t = new Date().getTime();
  //  if (time === undefined) time = text.length / 5;
  $("toastView") && $("toastView").remove();

  $ui.window.add({
    type: "blur",
    props: {
      info: t,
      style: 6,
      alpha: 0,
      cornerRadius: 8,
      id: "toastView",
      borderColor: rgba(100),
      bgcolor: $color("clear"),
      userInteractionEnabled: 0,
      borderWidth: 1 / $device.info.screen.scale
    },
    layout: (make, view) => {
      let { width } = $text.sizeThatFits({
        text: text,
        width: view.super.frame.width,
        font: $font(14)
      });
      make.centerX.equalTo(view.super);
      make.top.equalTo(view.super.safeArea).offset(0);
      make.width.equalTo(width + 60);
      make.height.equalTo(30);
    },
    views: [
      {
        type: "image",
        props: { icon: $icon(icon, COLOR) },
        layout: (make, view) => {
          make.centerY.equalTo(view.super);
          make.size.equalTo($size(16, 16));
          make.left.inset(10);
        }
      },
      {
        type: "view",
        layout: (make, view) => {
          make.centerY.equalTo(view.super);
          make.left.equalTo(view.prev.right);
          make.right.inset(10);
          make.height.equalTo(view.super);
        },
        views: [
          {
            type: "label",
            props: {
              bgcolor: $color("clear"),
              textColor: baseColor.primary,
              font: $font(15),
              text
            },
            layout: (make, view) => {
              shadow(view, "black", 0.2);
              make.center.equalTo(view.super);
            }
          }
        ]
      }
    ]
  });

  $delay(0.05, () => {
    let tView = $("toastView");
    if (!tView) return;
    tView.updateLayout((make, view) => {
      make.top.equalTo(view.super.safeArea).offset(inset);
    });
    $ui.animate({
      duration: 0.4,
      animation: () => {
        tView.alpha = 1;
        tView.relayout();
      },
      completion: () => {
        $delay(time, () => {
          let tView = $("toastView");
          if (!tView || tView.info != t) return;
          tView.updateLayout((make, view) =>
            make.top.equalTo(view.super.safeArea).offset(0)
          );
          $ui.animate({
            duration: 0.4,
            animation: () => {
              tView.alpha = 0.0;
              tView.relayout();
            },
            completion: () => tView && tView.remove()
          });
        });
      }
    });
  });
};
exports.toast = toast;

exports.guide = (x, text) => {
  let cacheName = `tip-${x}`;
  if (!$cache.get(cacheName)) {
    toast({ text, time: text.length / 5 });
    $cache.set(cacheName, true);
  }
};

const p = Math.PI;

//🔺🔻
exports.triangle = function(id, n = 10) {
  return {
    type: "canvas",
    props: { id: id },
    layout: (make, view) => {
      shadow(view);
      make.edges.inset(0);
    },
    events: {
      draw: (view, ctx) => {
        let cX = view.frame.width * 0.5,
          cY = view.frame.height * 0.5,
          s = n * 0.5,
          t = n * Math.sqrt(3 / 16);
        ctx.fillColor = COLOR;
        ctx.moveToPoint(cX + s, cY - t);
        ctx.addLineToPoint(cX - s, cY - t);
        ctx.addLineToPoint(cX, cY + t);
        ctx.fillPath();
      }
    }
  };
};

exports.earth = function() {
  return [
    {
      type: "canvas",
      props: { userInteractionEnabled: 0 },
      layout: $layout.fill,
      events: {
        draw: (view, ctx) => {
          let r = 10;
          let _r = r * 0.95;
          let s = r / Math.SQRT2;
          let cX = view.frame.width * 0.5;
          let cY = view.frame.height * 0.5;
          ctx.setLineWidth(1.2);
          ctx.strokeColor = COLOR;
          ctx.addArc(cX, cY, r, 0, p * 2, 0);
          ctx.moveToPoint(cX, cY - _r);
          ctx.addQuadCurveToPoint(cX - r, cY, cX, cY + _r);
          ctx.addLineToPoint(cX, cY - _r);
          ctx.addQuadCurveToPoint(cX + r, cY, cX, cY + _r);
          ctx.moveToPoint(cX - r, cY);
          ctx.addLineToPoint(cX + r, cY);
          ctx.moveToPoint(cX - s, cY - s);
          ctx.addQuadCurveToPoint(cX, cY, cX + s, cY - s);
          ctx.moveToPoint(cX + s, cY + s);
          ctx.addQuadCurveToPoint(cX, cY, cX - s, cY + s);
          ctx.strokePath();
        }
      }
    }
  ];
};

exports.enter = function() {
  return [
    {
      type: "canvas",
      props: { userInteractionEnabled: 0 },
      layout: $layout.fill,
      events: {
        draw: (view, ctx) => {
          let cX = view.frame.width * 0.5,
            cY = view.frame.height * 0.5,
            n = 5.4,
            m = n / 2;
          ctx.strokeColor = $color("white");
          ctx.setLineJoin(1);
          ctx.setLineCap(1);
          ctx.setLineWidth(1.8);
          ctx.moveToPoint(cX - m, cY - n);
          ctx.addLineToPoint(cX + m * -3, cY);
          ctx.addLineToPoint(cX - m, cY + n);
          ctx.moveToPoint(cX + m * -3, cY);
          ctx.addLineToPoint(cX + m * 3, cY);
          ctx.addLineToPoint(cX + m * 3, cY - n);
          ctx.strokePath();
        }
      }
    }
  ];
};

exports.del = function() {
  return [
    {
      type: "canvas",
      props: { userInteractionEnabled: 0 },
      layout: $layout.fill,
      events: {
        draw: (view, ctx) => {
          let cX = view.frame.width * 0.5,
            cY = view.frame.height * 0.5,
            n = 14,
            r = (n * 2) / 5,
            s = (n - r) / 2,
            m = n / 4,
            xa = cX - m * 3,
            xbe = cX - m,
            xcd = cX + m * 3,
            ybc = cY - n / 2,
            yde = cY + n / 2,
            xpq = cX + s - m,
            ypm = cY - r / 2,
            xmn = cX + s + r - m,
            yqn = cY + r / 2;
          ctx.strokeColor = COLOR;
          ctx.setLineWidth(1.8);
          ctx.setLineCap(1);
          ctx.setLineJoin(1);
          ctx.moveToPoint(xa, cY);
          ctx.addLineToPoint(xbe, ybc);
          ctx.addLineToPoint(xcd, ybc);
          ctx.addLineToPoint(xcd, yde);
          ctx.addLineToPoint(xbe, yde);
          ctx.addLineToPoint(xa, cY);
          ctx.moveToPoint(xpq, yqn);
          ctx.addLineToPoint(xmn, ypm);
          ctx.moveToPoint(xpq, ypm);
          ctx.addLineToPoint(xmn, yqn);
          ctx.strokePath();
        }
      }
    }
  ];
};

exports.fillSafeArea = () => {
  return (make, view) => {
    make.left.right.inset(4);
    make.top.equalTo(view.super.safeAreaTop);
    make.bottom.equalTo(view.super.safeAreaBottom).inset(4);
  };
};

exports.blink = view => {
  const origin = view.bgcolor;
  $ui.animate({
    duration: 0.2,
    animation: () => {
      //      (view.bgcolor = dark && env == 1 ? $color("clear") : rgba(100)),
      if ($app.env === 1) view.bgcolor = $color("insetGroupedBackground", "#2E2E2E")
      else view.bgcolor = $color(rgba(100), rgba(200));
    },
    completion: () => {
      $ui.animate({
        duration: 0.2,
        animation: () => (view.bgcolor = origin)
      });
    }
  });
};

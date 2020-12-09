const kb = {
  hans: {
    key: [
      "零",
      "壹",
      "贰",
      "叁",
      "肆",
      "伍",
      "陆",
      "柒",
      "捌",
      "玖",
      "元",
      "万",
      "亿",
      "拾",
      "佰",
      "仟",
      "角",
      "分",
      "整",
      ""
    ],
    col: 5
  },
  hex: {
    key: [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      ".",
      ""
    ],
    col: 6
  },
  dec: {
    key: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ".", ""],
    col: 4
  },
  oct: {
    key: ["1", "2", "3", "4", "5", "6", "7", "0", ".", ""],
    col: 5
  },
  bin: {
    key: ["0", "1", ".", ""],
    col: 4
  }
};

exports.init = (
  type,
  view,
  handler,
  isNeedDot = true,
  switchHandler,
  prevViewHeight = 176
) => {
  const COLOR = $color(...$cache.get("theme"));
  const ui = require("../ui");
  const { key, col } = kb[type];
  const len = key.length;
  const kbHeight = (len / col) * 30;
  const data = key.map(i => {
    if (i == "." && !isNeedDot)
      return {
        x: {
          title: "",
          image: ui.image("keyboard"),
          tintColor: COLOR,
          imageEdgeInsets: $insets(5, 0, 5, 0)
        }
      };
    else if (i == "")
      return {
        x: {
          title: "",
          image: ui.image("del"),
          tintColor: COLOR,
          imageEdgeInsets: $insets(3, 0, 3, 0)
        }
      };
    else return { x: { title: i } };
  });
  return {
    type: "matrix",
    props: {
      columns: col,
      itemHeight: 26,
      bgcolor: $color("clear"),
      spacing: 4,
      info: view,
      scrollEnabled: 0,
      template: [
        {
          type: "button",
          props: {
            id: "x",
            cornerRadius: 8,
            titleColor: ui.color.primary,
            bgcolor: ui.color.todaybg,
            borderColor: ui.color.boundary(),
            userInteractionEnabled: false,
            borderWidth: 1.0 / $device.info.screen.scale
          },
          layout: (make, view) => {
            make.edges.inset(0);
            const image = view.ocValue().$imageView();
            image.$setContentMode(1);
            ui.shadow(image.jsValue());
          }
        }
      ],
      data
    },
    layout: make => {
      make.left.right.bottom.inset(0);
      make.top.equalTo($("mainView").bottom);
    },
    events: {
      ready: sender =>
        $delay(0, () => {
          $widget.height = kbHeight + 4 + prevViewHeight;
        }),
      didSelect: (_, { row }, data) => {
        $device.taptic(0);
        let i = $(view);
        if (row == len - 1) i.text = i.text.slice(0, -1);
        else if (row == len - 2 && !isNeedDot) {
          switchHandler();
        } else i.text += data.x.title;
        handler();
      },
      didLongPress: (_, { row }) => {
        if (row == len - 1) {
          $(view).text = "";
          $device.taptic(0);
          handler();
        }
      }
    }
  };
};

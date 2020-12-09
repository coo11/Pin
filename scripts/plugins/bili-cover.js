exports.run = str => {
  const ui = require("../ui");
  const regex = [
    /https?:\/\/live\.bilibili\.com\/(\d+)/i,
    /https?:\/\/live\.bilibili\.com\/.*?\/(\d+)/i,
    /https?:\/\/(?:m|www)\.bilibili\.com\/[a-zA-Z0-9]+?\/(av(\d+)|(BV\w+))/i,
    /https?:\/\/(?:b23|acg)\.tv\/(av(\d+)|(BV\w+))?/i,
    /^(av|cv)?(\d{1,8})$/i,
    /^(BV)\w+$/i,
    /https?:\/\/www\.bilibili\.com\/read\/(?:mobile\/|cv)(\d+)/i,
    /https?:\/\/mp\.weixin\.qq\.com\/s(?:\/|\?)(.*)\#?/i
  ];

  let matched,
    i = 0;
  while (!(matched = str.match(regex[i]))) i++;
  console.log(i);
  function getCover(id, key = "live") {
    const prefix =
      key === "live"
        ? "https://api.live.bilibili.com/xlive/web-room/v1/index/getH5InfoByRoom?room_id="
        : key === "article"
        ? "https://api.bilibili.com/x/article/viewinfo?id="
        : `https://api.bilibili.com/x/web-interface/view?${key}=`;
    $http.get({
      url: `${prefix}${id}`,
      handler: async resp => {
        try {
          let info = resp.data.data;

          let url =
            key === "live"
              ? info.room_info.cover
              : key === "article"
              ? info.origin_image_urls[0]
              : info.pic;
          console.log(url);
          save(url);
        } catch (e) {
          ui.toast({ text: "封面保存失败", icon: "225" });
        }
      }
    });
  }

  switch (i) {
    case 0:
    case 1:
      getCover(matched[1]);
      break;
    case 2:
    case 3:
      if (matched[2]) getCover(matched[2], "aid");
      else if (matched[3]) getCover(matched[3], "bvid");
      else if (i === 3) {
        $http.get(str).then(resp => {
          matched = resp.response.url.match(regex[2]);
          getCover(matched[3], "bvid");
        });
      }
      break;
    case 4:
      if (matched[1])
        getCover(matched[2], matched[1] === "av" ? "aid" : "article");
      else
        $ui.menu({
          items: ["视频", "直播", "文章"],
          handler: (_, i) => {
            getCover(
              matched[2],
              i === 0 ? "aid" : i === 1 ? "live" : "article"
            );
          }
        });
      break;
    case 5:
      getCover(matched[0], "bvid");
      break;
    case 6:
      getCover(matched[1], "article");
      break;
    case 7:
      (async () => {
        let str = matched[1];
        if (
          /^[-0-9A-Za-z]{22}/.test(str) ||
          (str.indexOf("__biz") > -1 &&
            str.indexOf("mid") > -1 &&
            str.indexOf("idx") > -1 &&
            str.indexOf("sn") > -1)
        ) {
          let { response, data } = await $http.get(matched[0]);
          if (response && response.statusCode === 200) {
            let _matched = data.match(/og:image.*?(http.*?)"/);
            if (_matched && _matched[1]) save(_matched[1]);
          }
        } else ui.toast({ text: "URL 输入有误", icon: "225" });
      })();
      break;
    default:
      ui.toast({ text: "URL 或者内容输入有误", icon: "225" });
  }

  async function save(url) {
    console.log(url);
    let { data } = await $http.download(url);
    if (!data) ui.toast({ text: "下载失败", icon: "225" });
    else
      $photo.save({
        data: data,
        handler: success => {
          if (success) ui.toast({ text: "封面保存成功" });
          else ui.toast({ text: "封面保存失败", icon: "225" });
        }
      });
  }
};
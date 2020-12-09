exports.run = str => {
  const ui = require("../ui");
  const alphabet =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const regex = [
    /https?:\/\/weibointl\.api\.weibo.*?weibo_id=(\d+)/i,
    /https?:\/\/(?:(?:m\.)?weibo\.c(?:n|om))\/tv\/v\/(\w+)/i,
    /https?:\/\/(?:(?:m\.)?weibo\.c(?:n|om))\/s\/video\/.*?blog_mid=(\w+)/i,
    /https?:\/\/(?:m\.weibo\.cn|weibo\.com)\/([a-zA-Z0-9]+\/?(\w+))/i,
    /https?:\/\/\w.*?\.sinaimg\.cn\/[\w.]*?\/(\w*?)\./i,
    /^\d+$/,
    /^[A-Za-z0-9]+$/
  ];

  let matched,
    exp,
    id,
    i = 0;
  while (!(matched = str.match(regex[i]))) i++;

  /**
   * mid字符转换为id
   * @param {String} mid - 微博mid，Base62，如 "wr4mOFqpbO"
   * @returns {String} id - 微博id，如 "201110410216293360"
   */
  function mid2id(mid) {
    let id = "";
    for (
      let i = mid.length - 4;
      i > -4;
      i = i - 4 //从最后往前以4字节为一组读取URL字符
    ) {
      let offset1 = i < 0 ? 0 : i,
        offset2 = i + 4,
        str = mid.substring(offset1, offset2);

      str = decodeBase62(str).toString();
      if (offset1 > 0) {
        //若不是第一组则不足7位补0
        while (str.length < 7) {
          str = "0" + str;
        }
      }
      id = str + id;
    }
    return id;
  }
  /**
   * id转换为mid字符
   * @param {string} id - 微博id，如 "201110410216293360"
   * @returns {string} mid - 微博mid，Base62，如 "wr4mOFqpbO"
   */
  function id2mid(id) {
    let mid = "";
    for (
      let i = id.length - 7;
      i > -7;
      i = i - 7 //从最后往前以7字节为一组读取id
    ) {
      let offset1 = i < 0 ? 0 : i,
        offset2 = i + 7,
        num = id.substring(offset1, offset2);
      num = encodeBase62(num);
      if (offset1 > 0) {
        //若不足4位补0
        while (num.length < 4) {
          num = "0" + num;
        }
      }
      mid = num + mid;
    }
    return mid;
  }

  function encodeBase62(int10) {
    let s62 = "",
      r = 0;
    while (int10 != 0) {
      r = int10 % 62;
      s62 = alphabet[r] + s62;
      int10 = Math.floor(int10 / 62);
    }
    return s62;
  }

  function decodeBase62(number) {
    let out = 0,
      len = number.length - 1;
    for (let t = 0; t <= len; t++) {
      out = out + alphabet.indexOf(number.substr(t, 1)) * Math.pow(62, len - t);
    }
    return out;
  }

  function findUidBySinaimg(id) {
    let userStr = id.substr(0, 8);
    if (userStr.startsWith("00")) return decodeBase62(userStr);
    else return parseInt(userStr, 16);
  }

  function openClientByUid(id) {
    $http.get({
      url: `https://m.weibo.cn/api/container/getIndex?type=uid&value=${id}`,
      handler: resp => {
        let data = resp.data.data.userInfo;
        let urlWeico = "weibointernational://search?keyword=";
        if (!$app.openURL(urlWeico + data.screen_name))
          $app.openURL("sinaweibo://userinfo?uid=" + id);
      }
    });
  }

  function saveToClipboard(url) {
    let dataManager = require("../data-manager");
    dataManager.addTextItems(url);
    ui.toast({ text: "Copied Success!" });
  }

  function convertWeiboUrl(id) {
    /\D/.test(id) && (id = mid2id(id));
    $ui.alert({
      title: "Open or Convert it?",
      message: "Open it in Client or convert it to desktop link",
      actions: [
        {
          title: "Client",
          style: "Cancel",
          handler: () => {
            let link = `weibointernational://detail?weiboid=${id}`;
            if (!$app.openURL(link))
              $app.openURL(`sinaweibo://detail?mblogid=${id}`);
          }
        },
        {
          title: "Convert",
          handler: () => {
            $http.get(`https://m.weibo.cn/status/${id}`).then(resp => {
              id = id2mid(id);
              let uid = resp.data.match(/"id": (\d{10})/);
              saveToClipboard(`https://weibo.com/${uid[1]}/${id}`);
            });
          }
        }
      ]
    });
  }

  switch (i) {
    case 0:
      str = `https://m.weibo.cn/status/${matched[1]}`;
      $ui.alert({
        title: "Copy or Open it?",
        message: str,
        actions: [
          {
            title: "Safari",
            style: "Cancel",
            handler: () => $app.openURL(str)
          },
          {
            title: "Copy",
            handler: () => saveToClipboard(str)
          }
        ]
      });
      break;
    case 1:
    case 2:
      convertWeiboUrl(matched[1]);
      break;
    case 3:
      exp = /\D/.test(matched[1]);
      id = exp ? matched[2] : matched[1];
      //- BUG: link 'https://weibo.com/non-numberID' cannot be recognized
      if (/\/u\/|\/profile\//.test(str) || !exp) openClientByUid(id);
      else convertWeiboUrl(id);
      break;
    case 4:
      id = findUidBySinaimg(matched[1]);
      $ui.alert({
        title: "Copy or Open it?",
        message: `Original User URL is \nhttps://weibo.com/u/${id}`,
        actions: [
          {
            title: "Client",
            style: "Cancel",
            handler: () => openClientByUid(id)
          },
          {
            title: "Copy",
            handler: () => saveToClipboard(`https://weibo.com/u/${id}`)
          }
        ]
      });
      break;
    case 5:
      saveToClipboard(id2mid(str));
      break;
    case 6:
      saveToClipboard(mid2id(str));
      break;
    default:
      if (i > 6) {
        if ($detector.link(str) != "")
          ui.toast({ text: "Not target URL!", icon: "225" });
        else {
          str = encodeURIComponent(str);
          if (!$app.openURL(`weibointernational://search?keyword=${str}`))
            $app.openURL(`sinaweibo://searchall?q=${str}`);
        }
        return;
      }
  }
};

"user strict";

let _sync, _list;

const local = "assets/text-items.json";
const cloud = "drive://Pin+/text-items.json";

const getTextItems = (isCloud = _list) =>
  JSON.parse($file.read(isCloud ? cloud : local).string);

const setTextItems = (data, isCloud = _list) =>
  $file.write({
    data: $data({ string: JSON.stringify(data) }),
    path: isCloud ? cloud : local
  });

const saveTextItems = data => {
  setTextItems(data, _list);
  _sync == 2 && setTextItems(data, !_list);
};

/**
 * @param {array} data -  An array has duplicate element
 */
function deduplicate(data) {
  let arr = [],
    obj = {};
  for (let i of data) {
    if (!obj[i]) {
      arr.push(i);
      obj[i] = 1;
    }
  }
  return arr;
}

function init() {
  _sync = $cache.get("sync");
  _list = $cache.get("list");
  let current = getTextItems(_list);
  let text = $clipboard.text;
  if (_sync === 2) {
    let another = getTextItems(!_list);
    current = current.concat(another);
  }
  if (text) current.unshift(text);
  current = deduplicate(current);
  saveTextItems(current);
  fillTextItems(current);
}

function fillTextItems(data) {
  $("itemlist").data = [];
  data = data.map(i => {
    return { itemtext: { text: i } };
  });
  $("itemlist").data = data;
}

/**
 * Add a new piece of text to items list
 * @param {boolean} textFieldShowing - Whether the textField used for displaying clipboard plain text is showing
 */
function addTextItems(dataToAdd, textFieldShowing = $app.env === 2) {
  if (dataToAdd.length === 0) return;
  const list = $("itemlist");
  let items = getTextItems();
  if (Array.isArray(dataToAdd)) {
    items = dataToAdd.concat(items);
    const string = $clipboard.text;
    if (string) items.unshift(string);
    items = deduplicate(items);
    saveTextItems(items);
    fillTextItems(items);
  } else {
    $clipboard.set({ type: "public.plain-text", value: dataToAdd });
    textFieldShowing && ($("i2clip").text = dataToAdd);
    const index = items.indexOf(dataToAdd);
    items.slice(index, 1);
    items.unshift(dataToAdd);
    saveTextItems(items);
    if (list) {
      if (index === -1)
        list.insert({ index: 0, value: { itemtext: { text: dataToAdd } } });
      else if (index === 0) return;
      else if (index > 0)
        list
          .ocValue()
          .$moveRowAtIndexPath_toIndexPath(
            $indexPath(0, index),
            $indexPath(0, 0)
          );
    }
  }
}

module.exports = {
  init: init,
  addTextItems: addTextItems,
  mergeTextItems: deduplicate,
  getTextItems: getTextItems,
  setTextItems: setTextItems,
  saveTextItems: saveTextItems
};

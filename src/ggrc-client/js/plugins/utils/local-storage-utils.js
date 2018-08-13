/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

function getAll(obj) {
  let allData = window.localStorage.getItem(`${obj._shortName}:ids`);
  let returns = new can.Model.List();

  if (allData) {
    can.each(JSON.parse(allData), (id) => {
      let data;
      data = window.localStorage.getItem(`${obj._shortName}:${id}`);

      if (data) {
        data = obj.store[id] || JSON.parse(data);
        returns.push(obj.model(data));
      }
    });
  }

  return returns;
}

function add(obj, params) {
  if (params.serialize) {
    params = params.serialize();
  }

  let item;
  let key = [obj._shortName, 'ids'].join(':');
  let data = window.localStorage.getItem( key );
  let newkey = 1;

  // add to list
  if (data) {
    data = JSON.parse(data);
    // newkey = Math.max.apply(Math, data.concat([0])) + 1;
    newkey = Math.max(0, ...data) + 1;
    data.push(newkey);
  } else {
    data = [newkey];
  }
  window.localStorage.setItem(key, JSON.stringify(data));

  // create new
  key = [obj._shortName, newkey].join(':');
  item = obj.model(can.extend({id: newkey}, params));
  window.localStorage.setItem(key, JSON.stringify(item.serialize()));

  return item;
}

function update(obj, params) {
  let item;
  let key = [obj._shortName, params.id].join(':');
  let data = window.localStorage.getItem( key );

  data = JSON.parse(data);

  if (params._removedKeys) {
    can.each(params._removedKeys, function (key) {
      if (!params[key]) {
        delete data[key];
      }
    });
  }

  delete params._removedKeys;
  can.extend(data, params);
  item = obj.model({}).attr(data);
  window.localStorage.setItem(key, JSON.stringify(item.serialize()));

  return item;
}

function remove(obj, id) {
  let key = [obj._shortName, id].join(':');
  let data;

  if (window.localStorage.getItem(key)) {
    window.localStorage.removeItem(key);

    // remove from list
    key = [obj._shortName, 'ids'].join(':');
    data = window.localStorage.getItem( key );

    data = JSON.parse(data);
    data.splice(can.inArray(id, data), 1);
    window.localStorage.setItem(key, JSON.stringify(data));
  }
}

function clearAll() {
  window.localStorage.clear();
}

export {
  getAll,
  add,
  update,
  remove,
  clearAll,
};

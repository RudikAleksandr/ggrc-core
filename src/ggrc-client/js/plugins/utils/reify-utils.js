/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

function reify(obj) {
  if (obj instanceof can.List) {
    return _reifyList(obj);
  }

  return _reify(obj);
}

function hasReify(obj) {
  return obj instanceof can.Map || obj instanceof can.List;
}

function _reify(obj) {
  const model = obj.constructor;

  if (!model) {
    console.warn('`reify()` called with unrecognized type', obj);
  } else {
    return model.model(obj);
  }
}

function _reifyList(obj) {
  return new can.List(can.map(obj, function (item) {
    return _reify(item);
  }));
}

export {
  reify,
  hasReify,
};

/*
Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as businessModels from '../../models/business-models';
import * as serviceModels from '../../models/service-models';

const allModels = {
  ...businessModels,
  ...serviceModels,
};

function reify(obj) {
  if (obj instanceof can.List) {
    return reifyList(obj);
  }

  if (obj instanceof can.Map) {
    return reifyMap(obj);
  }
}

function isReifiable(obj) {
  return obj instanceof can.Map;
}

function reifyMap(obj) {
  const type = obj.type;
  const model = allModels[type];

  if (obj instanceof can.Model) {
    return obj;
  }

  if (!model) {
    console.warn('`reifyMap()` called with unrecognized type', obj);
  } else {
    return model.model(obj);
  }
}

function reifyList(obj) {
  return new can.List(can.map(obj, function (item) {
    return reifyMap(item);
  }));
}

export {
  reify,
  reifyMap,
  reifyList,
  isReifiable,
};

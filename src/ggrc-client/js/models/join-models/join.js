/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import RefreshQueue from '../refresh_queue';
import Cacheable from '../cacheable';
import Stub from '../stub';
import {getInstance} from '../../plugins/utils/models-utils';
import {reify, hasReify} from '../../plugins/utils/reify-utils';

export default Cacheable('can.Model.Join', {
  join_keys: null,
  setup: function () {
    this._super(...arguments);
  },
  init: function () {
    if (this._super) {
      this._super(...arguments);
    }
    function reinit(ev, instance) {
      let refreshQueue;
      if (instance instanceof can.Model.Join) {
        instance.reinit();
        refreshQueue = new RefreshQueue();
        can.each(instance.constructor.join_keys, function (cls, key) {
          let obj;
          if (instance[key]) {
            if (hasReify(instance[key]) && reify(instance[key]).refresh) {
              obj = reify(instance[key]);
            } else {
              obj = cls.findInCacheById(instance[key].id);
            }
          }
          if (obj) {
            refreshQueue.enqueue(obj);
          }
        });
        refreshQueue.trigger();
      }
    }
    if (this === can.Model.Join) {
      this.bind('created', reinit);
      this.bind('destroyed', reinit);
    }
  },
}, {
  reinit: function () {
    this.init_join_objects();
  },
  init_join_object_with_type: function (attr) {
    let objectId;
    let objectType;
    if (this[attr] instanceof can.Model) {
      return;
    }

    objectId = this[attr + '_id'] || (this[attr] || {}).id;
    objectType = this[attr + '_type'] || (this[attr] || {}).type;

    if (objectId && objectType && typeof objectType === 'string') {
      this.attr(attr, getInstance(
        objectType,
        objectId,
        this[attr]
      ) || this[attr]);
    } else if (objectId) {
      this.attr(attr, getInstance(this[attr]));
    }
  },

  init_join_object: function (attr, modelName) {
    let objectId = this[attr + '_id'] || (this[attr] || {}).id;

    if (objectId) {
      this.attr(
        attr,
        new Stub(getInstance(
          modelName, objectId, this[attr]
        )) || this[attr]
      );
    }
  },

  init_join_objects: function () {
    let that = this;

    can.each(this.constructor.join_keys, function (model, attr) {
      if (model === Cacheable) {
        that.init_join_object_with_type(attr);
      } else {
        that.init_join_object(attr, model.shortName);
      }
    });
  },
});

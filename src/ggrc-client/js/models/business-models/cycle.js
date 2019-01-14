/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';
import Permission from '../../permission';
import isOverdue from '../mixins/is-overdue';
import Stub from '../stub';
import Workflow from './workflow';

function refreshAttr(instance, attr) {
  let result;
  const model = Workflow.findInCacheById(instance.attr(`${attr}.id`));

  if (model.selfLink) {
    result = model.refresh();
  } else {
    result = $.Deferred().resolve();
  }

  return result;
}

function refreshAttrWrap(attr) {
  return function (ev, instance) {
    if (instance instanceof this) {
      Permission.refresh();
      refreshAttr(instance, attr);
    }
  };
}

export default Cacheable('CMS.Models.Cycle', {
  root_object: 'cycle',
  root_collection: 'cycles',
  category: 'workflow',
  findAll: 'GET /api/cycles',
  findOne: 'GET /api/cycles/{id}',
  create: 'POST /api/cycles',
  update: 'PUT /api/cycles/{id}',
  destroy: 'DELETE /api/cycles/{id}',
  mixins: [isOverdue],
  attributes: {
    workflow: Stub,
    modified_by: Stub,
    context: Stub,
  },
  tree_view_options: {
    attr_list: [{
      attr_title: 'Title',
      attr_name: 'title',
      order: 10,
    }, {
      attr_title: 'State',
      attr_name: 'status',
      order: 15,
    }, {
      attr_title: 'End Date',
      attr_name: 'end_date',
      order: 20,
    }],
    mandatory_attr_name: ['title', 'status', 'end_date'],
    disable_columns_configuration: true,
  },
  init: function () {
    this._super(...arguments);
    this.bind('created', refreshAttrWrap('workflow').bind(this));
  },
}, {
  init: function () {
    this._super(...arguments);
  },
});

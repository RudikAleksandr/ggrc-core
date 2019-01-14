/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Cacheable from '../cacheable';
import Person from './person';
import contactable from '../mixins/contactable';
import Stub from '../stub';

export default Cacheable('CMS.Models.TaskGroup', {
  root_object: 'task_group',
  root_collection: 'task_groups',
  category: 'workflow',
  findAll: 'GET /api/task_groups',
  findOne: 'GET /api/task_groups/{id}',
  create: 'POST /api/task_groups',
  update: 'PUT /api/task_groups/{id}',
  destroy: 'DELETE /api/task_groups/{id}',
  mixins: [contactable],
  attributes: {
    workflow: Stub,
    task_group_tasks: Stub.List,
    tasks: Stub.List,
    task_group_objects: Stub.List,
    objects: Stub.List,
    modified_by: Stub,
    context: Stub,
    end_date: 'date',
  },

  tree_view_options: {
    add_item_view: GGRC.mustache_path + '/task_groups/tree_add_item.mustache',
    mapper_attr_list: [
      {attr_title: 'Summary', attr_name: 'title'},
      {attr_title: 'Assignee', attr_name: 'assignee',
        attr_sort_field: 'contact'},
      {attr_title: 'Description', attr_name: 'description'},
    ],
    disable_columns_configuration: true,
  },

  init: function () {
    let that = this;
    if (this._super) {
      this._super(...arguments);
    }
    this.validateNonBlank('title');
    this.validateNonBlank('contact');
    this.validateNonBlank('workflow');
    this.validateContact(['_transient.contact', 'contact']);

    this.bind('updated', function (ev, instance) {
      if (instance instanceof that) {
        instance.refresh_all_force('workflow', 'context');
      }
    });
    this.bind('destroyed', function (ev, inst) {
      if (inst instanceof that) {
        inst.refresh_all_force('workflow', 'context');
      }
    });
  },
  validateContact: function (attrNames, options) {
    this.validate(attrNames, options, function (newVal) {
      let reifiedContact = newVal && newVal instanceof can.Map ?
        Person.findInCacheById(newVal.id) : false;
      let hasEmail = reifiedContact ? reifiedContact.email : false;
      options = options || {};

      // This check will not work until the bug introduced with commit 8a5f600c65b7b45fd34bf8a7631961a6d5a19638
      // is resolved.
      if (!hasEmail) {
        return options.message ||
          'No valid contact selected for assignee';
      }
    });
  },
}, {});

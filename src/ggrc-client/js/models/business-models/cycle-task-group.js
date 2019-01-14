/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';
import Person from './person';
import isOverdue from '../mixins/is-overdue';
import Stub from '../stub';

export default Cacheable('CMS.Models.CycleTaskGroup', {
  root_object: 'cycle_task_group',
  root_collection: 'cycle_task_groups',
  category: 'workflow',
  findAll: 'GET /api/cycle_task_groups',
  findOne: 'GET /api/cycle_task_groups/{id}',
  create: 'POST /api/cycle_task_groups',
  update: 'PUT /api/cycle_task_groups/{id}',
  destroy: 'DELETE /api/cycle_task_groups/{id}',
  mixins: [isOverdue],
  attributes: {
    cycle: Stub,
    task_group: Stub,
    cycle_task_group_tasks: Stub.List,
    modified_by: Stub,
    context: Stub,
  },

  init: function () {
    this._super(...arguments);
    this.validateNonBlank('contact');
    this.validateContact(['_transient.contact', 'contact']);
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

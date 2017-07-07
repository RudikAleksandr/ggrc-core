/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC, Mustache) {
  'use strict';

  var viewModel = can.Map.extend('GGRC.VM.DeletablePeopleGroup', {
    define: {
      emptyListMessage: {
        get: function () {
          return this.attr('showEmptyMessage') ? 'None' : '';
        }
      }
    },
    showEmptyMessage: true,
    required: '@',
    people: [],
    groupId: '@',
    canUnmap: true,
    instance: {},
    isLoading: false,
    withDetails: false,
    unmapablePerson: function () {
      var required;
      var peopleLength;

      if (!this.attr('canUnmap')) {
        return false;
      }

      required = this.attr('required');
      peopleLength = this.attr('people.length');

      if (required) {
        if (peopleLength > 1) {
          return true;
        }
        return false;
      }
      return true;
    },
    unmap: function (person) {
      this.dispatch({
        type: 'unmap',
        person: person,
        groupId: this.attr('groupId')
      });
    }
  });

  GGRC.Components('deletablePeopleGroup', {
    tag: 'deletable-people-group',
    template: can.view(
      GGRC.mustache_path +
      '/components/people/deletable-people-group.mustache'
    ),
    viewModel: viewModel
  });
})(window.can, window.GGRC, can.Mustache);

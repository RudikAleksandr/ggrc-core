/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import '../related-objects/related-assessments';
import template from './show-related-assessments-button.mustache';
import {hasRelatedAssessments} from '../../plugins/utils/models-utils';

(function (can, GGRC) {
  'use strict';

  can.Component.extend({
    tag: 'show-related-assessments-button',
    template: template,
    viewModel: {
      define: {
        cssClasses: {
          type: String,
          get: function () {
            return !this.attr('resetStyles') ?
              'btn btn-lightBlue btn-position ' + this.attr('extraBtnCSS') : '';
          },
        },
        resetStyles: {
          type: Boolean,
          value: false,
        },
        showTitle: {
          type: Boolean,
          value: true,
        },
        showIcon: {
          type: Boolean,
          value: false,
        },
        title: {
          type: String,
          get: function () {
            return this.attr('text') || 'Assessments';
          },
        },
      },
      instance: null,
      state: {
        open: false,
      },
      extraBtnCSS: '@',
      text: '@',
      modalTitle: 'Related Assessments',
      showRelatedAssessments: function () {
        this.attr('state.open', true);
      },
      // Temporary put this logic on the level of Component itself
      isAllowedToShow: function () {
        return hasRelatedAssessments(this.attr('instance.type'));
      },
    },
  });
})(window.can, window.GGRC);

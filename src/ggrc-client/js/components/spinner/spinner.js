/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import template from './spinner.mustache';

export default can.Component.extend({
  tag: 'spinner',
  template,
  scope: {
    extraCssClass: '@',
    size: '@',
    toggle: null,
  },
});

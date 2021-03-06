/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './model-loader.mustache';

export default can.Component.extend({
  tag: 'model-loader',
  template,
  viewModel: {
    define: {
      loadedModel: {
        get(last, set) {
          let path = this.attr('path');
          import(`../../models/${path}`).then((model) => set(model.default));
        },
      },
    },
    path: '',
  },
});

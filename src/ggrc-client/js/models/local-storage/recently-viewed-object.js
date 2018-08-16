/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

export default can.Model('GGRC.Models.RecentlyViewedObject', {
  newInstance: function (attrs) {
    if (attrs instanceof can.Model) {
      let title = (attrs.title && attrs.title.trim()) ||
        (attrs.name && attrs.name.trim()) ||
        (attrs.email && attrs.email.trim());

      return new this({
        type: attrs.constructor.shortName,
        model: attrs.constructor,
        viewLink: attrs.viewLink,
        title: title,
      });
    } else {
      return this._super(attrs);
    }
  },
}, {
  init: function () {
    this.attr('model', GGRC.Models[this.type] || CMS.Models[this.type]);
  },
  stub: function () {
    return can.extend(this._super(), {
      title: this.title,
      viewLink: this.viewLink,
    });
  },
});

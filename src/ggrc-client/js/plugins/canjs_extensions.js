/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/
(function ($, can) {
  // Returns a function which will be halted unless `this.element` exists
  // - useful for callbacks which depend on the controller's presence in the DOM
  can.Control.prototype._ifNotRemoved = function (fn) {
    let isPresent = this.element;
    return function () {
      return isPresent ? fn.apply(this, arguments) : null;
    };
  },

  // a few core CanJS extensions below.
  // Core validation for fields not being "blank", i.e.
  // having no content when outside spaces are trimmed away.
  can.Model.validationMessages.non_blank =
    can.Map.validationMessages.non_blank = 'cannot be blank';

  can.Model.validateNonBlank =
    can.Map.validateNonBlank = function (attrNames, options) {
      this.validate(attrNames, options, function (value) {
        if (_.isUndefined(value) ||
            _.isNull(value) ||
            _.isFunction(value.trim) && value.trim() === '') {
          return this.constructor.validationMessages.non_blank;
        }
      });
    };

  /**
   * Validate an autocomplete list field to be not blank.
   *
   * It checks in the field contains either a false-value, or a
   * non-constructor, or a constructor that builds an empty object and if so,
   * returns a non_blank error message.
   *
   * @param {String} listFieldName - the name of the field with the
   * autocomplete list
   * @param {Function} condition - a zero-parameter function; the validation
   * will be fired only if condition returns true or is undefined
   * @param {Object} options - a CanJS options argument passed to CanJS
   * validate function
   *
   */
  can.Model.validateListNonBlank =
    can.Map.validateListNonBlank = function (listFieldName, condition,
      options) {
      this.validate(listFieldName, options, function (newVal, prop) {
        if (_.isUndefined(condition) || condition.call(this)) {
          if (!newVal ||
              !_.isFunction(newVal.attr) ||
              _.isEmpty(newVal.attr())) {
            return this.constructor.validationMessages.non_blank;
          }
        }
      });
    };

  // Turn camelCase or snake-case strings into Camel Space strings
  can.spaceCamelCase = function (string) {
    if (!_.isString(string)) {
      throw new TypeError('Invalid type, string required.');
    }

    return can.underscore(string)
      .split('_')
      .map(can.capitalize)
      .join(' ');
  };
  can.camelCaseToUnderscore = function (string) {
    if (!_.isString(string)) {
      throw new TypeError('Invalid type, string required.');
    }
    return _.snakeCase(string);
  };
  can.camelCaseToDashCase = function (string) {
    if (!_.isString(string)) {
      return '';
    }
    return string.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  };
})(jQuery, can);

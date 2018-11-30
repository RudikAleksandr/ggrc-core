/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {reify, hasReify} from '../plugins/utils/reify-utils';

(function ($, can) {
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
  can.Model.validateContact =
    can.Map.validateContact = function (attrNames, options) {
      this.validate(attrNames, options, function (newVal, prop) {
        let reifiedContact = newVal && hasReify(newVal) ? reify(newVal) : false;
        let hasEmail = reifiedContact ? reifiedContact.email : false;
        options = options || {};

        // This check will not work until the bug introduced with commit 8a5f600c65b7b45fd34bf8a7631961a6d5a19638
        // is resolved.
        if (!hasEmail) {
          return options.message ||
            'No valid contact selected for assignee';
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

  // Adding reduce, a generally useful array comprehension.
  //  Bitovi decided against including it in core CanJS, but
  //  adding it here for easy universal use across can.List
  //  as well as arrays.
  if (!can.reduce) {
    can.reduce = function (ctx, arg1, arg2) {
      if (_.isNull(ctx)) {
        return null;
      }
      return [].reduce.apply(ctx, arguments.length < 3 ? [arg1] : [arg1, arg2]);
    };
  }

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

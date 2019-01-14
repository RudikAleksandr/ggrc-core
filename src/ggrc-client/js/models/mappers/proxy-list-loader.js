/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import RefreshQueue from '../refresh_queue';
import {reify} from '../../plugins/utils/reify-utils';

(function (GGRC, can) {
  /*  ProxyListLoader
   *  - handles relationships across join tables
   *
   *  - listens to:
   *      - join_model.created
   *      - join_model.destroyed
   *      - not implemented:
   *        - join_instance.change(object_attr)
   *        - join_instance.change(option_attr)
   */
  GGRC.ListLoaders.BaseListLoader('GGRC.ListLoaders.ProxyListLoader', {}, {
    init: function (modelName, objectAttr, optionAttr, objectJoinAttr,
      optionModelName) {
      this._super();

      this.model_name = modelName;
      this.object_attr = objectAttr;
      this.option_attr = optionAttr;
      this.object_join_attr = objectJoinAttr;
      this.option_model_name = optionModelName;
    },
    init_listeners: function (binding) {
      let self = this;
      let model = CMS.Models[this.model_name];
      let objectJoinValue = binding.instance[this.object_join_attr];

      binding.instance.bind(this.object_join_attr, function (ev, _new, _old) {
        if (binding._refresh_stubs_deferred &&
          binding._refresh_stubs_deferred.state() !== 'pending') {
          self._refresh_stubs(binding);
        }
      });

      if (objectJoinValue) {
        objectJoinValue.bind('length', function (ev, _new, _old) {
          self._refresh_stubs(binding);
        });
      }

      model.bind('created', function (ev, mapping) {
        if (mapping instanceof model) {
          self.filter_and_insert_instances_from_mappings(binding, [mapping]);
        }
      });

      model.bind('destroyed', function (ev, mapping) {
        if (mapping instanceof model) {
          self.remove_instance_from_mapping(binding, mapping);
        }
      });

      //  FIXME: This is only needed in DirectListLoader, right?
      model.bind('orphaned', function (ev, mapping) {
        if (mapping instanceof model) {
          self.remove_instance_from_mapping(binding, mapping);
        }
      });
    },
    is_valid_mapping: function (binding, mapping) {
      let model = CMS.Models[this.model_name];
      let objectModel = binding.instance.constructor;
      let optionModel = CMS.Models[this.option_model_name];

      return (mapping.constructor === model && mapping[this.object_attr] &&
      (reify(mapping[this.object_attr]) === binding.instance ||
      (reify(mapping[this.object_attr]).constructor === objectModel &&
      mapping[this.object_attr].id === binding.instance.id)) &&
      (!optionModel || (mapping[this.option_attr] &&
      reify(mapping[this.option_attr]) instanceof optionModel)));
    },
    filter_and_insert_instances_from_mappings: function (binding, mappings) {
      let self = this;
      let matchingMappings;

      matchingMappings = can.map(can.makeArray(mappings), function (mapping) {
        if (self.is_valid_mapping(binding, mapping)) {
          return mapping;
        }
      });
      return this.insert_instances_from_mappings(binding, matchingMappings);
    },
    insert_instances_from_mappings: function (binding, mappings) {
      let self = this;
      let newResults;

      newResults = can.map(can.makeArray(mappings), function (mapping) {
        return self.get_result_from_mapping(binding, mapping);
      });
      this.insert_results(binding, newResults);
    },
    remove_instance_from_mapping: function (binding, mapping) {
      let instance;
      let result;
      if (this.is_valid_mapping(binding, mapping)) {
        instance = this.get_instance_from_mapping(binding, mapping);
        result = this.find_result_from_mapping(binding, mapping);
        if (instance) {
          this.remove_instance(binding, instance, result);
        }
      }
    },
    get_result_from_mapping: function (binding, mapping) {
      return this.make_result({
        instance: reify(mapping[this.option_attr]),
        mappings: [{
          instance: mapping,
          mappings: [{
            instance: true,
            mappings: [],
            binding: binding,
          }],
          binding: binding,
        }],
      });
    },
    get_instance_from_mapping: function (binding, mapping) {
      return mapping[this.option_attr] && reify(mapping[this.option_attr]);
    },
    find_result_from_mapping: function (binding, mapping) {
      let mapInd;
      let result;
      let resultInd;
      let mappingResult;

      for (resultInd = 0; resultInd < binding.list.length; resultInd++) {
        result = binding.list[resultInd];
        for (mapInd = 0; mapInd < result.mappings.length; mapInd++) {
          mappingResult = result.mappings[mapInd];
          if (mappingResult.instance === mapping) {
            return mappingResult;
          }
        }
      }
    },
    _refresh_stubs: function (binding) {
      let model = CMS.Models[this.model_name];
      let refreshQueue = new RefreshQueue();
      let objectJoinAttr = this.object_join_attr || model.table_plural;

      // These properties only exist if the user has read access
      if (binding.instance[objectJoinAttr]) {
        _.forEach(reify(binding.instance[objectJoinAttr]), function (mapping) {
          refreshQueue.enqueue(mapping);
        });
      }

      return refreshQueue.trigger()
        .then(this.proxy('filter_for_valid_mappings', binding))
        .then(this.proxy('insert_instances_from_mappings', binding));
    },
    filter_for_valid_mappings: function (binding, mappings) {
      // Remove incomplete mappings, including those not in our context
      //   (which the server refused to provide).
      let i;
      let validMappings = [];

      for (i = 0; i < mappings.length; i++) {
        if (mappings[i][this.option_attr]) {
          validMappings.push(mappings[i]);
        }
      }
      return validMappings;
    },
  });
})(window.GGRC, window.can);

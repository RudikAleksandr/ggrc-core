/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import SummaryWidgetController from '../controllers/summary_widget_controller';
import DashboardWidget from '../controllers/dashboard_widget_controller';
import InfoWidget from '../controllers/info_widget_controller';
import {isDashboardEnabled} from '../plugins/utils/dashboards-utils';
import {
  getWidgetConfig,
} from '../plugins/utils/object-versions-utils';
import {inferObjectType} from '../plugins/utils/models-utils';
import {getPageInstance} from '../plugins/utils/current-page-utils';
import Role from '../models/service-models/role';
import * as businessModels from '../models/business-models/index';

(function (can, $) {
  let CoreExtension = {};

  CoreExtension.name = 'core"';
  GGRC.extensions.push(CoreExtension);
  _.assign(CoreExtension, {
    object_type_decision_tree: function () {
      return {
        program: businessModels.Program,
        audit: businessModels.Audit,
        contract: businessModels.Contract,
        policy: businessModels.Policy,
        standard: businessModels.Standard,
        regulation: businessModels.Regulation,
        org_group: businessModels.OrgGroup,
        vendor: businessModels.Vendor,
        project: businessModels.Project,
        facility: businessModels.Facility,
        product: businessModels.Product,
        data_asset: businessModels.DataAsset,
        document: businessModels.Document,
        evidence: businessModels.Evidence,
        access_group: businessModels.AccessGroup,
        market: businessModels.Market,
        metric: businessModels.Metric,
        system: businessModels.System,
        process: businessModels.Process,
        control: businessModels.Control,
        assessment: businessModels.Assessment,
        assessment_template: businessModels.AssessmentTemplate,
        issue: businessModels.Issue,
        objective: businessModels.Objective,
        requirement: businessModels.Requirement,
        person: businessModels.Person,
        product_group: businessModels.ProductGroup,
        role: Role,
        technology_environment: businessModels.TechnologyEnvironment,
        threat: businessModels.Threat,
        risk: businessModels.Risk,
        vulnerability: businessModels.Vulnerability,
        template: businessModels.Template,
      };
    },
    init_widgets: function () {
      let baseWidgetsByType = GGRC.tree_view.base_widgets_by_type;
      let widgetList = new GGRC.WidgetList('ggrc_core');
      let objectClass = inferObjectType(GGRC.page_object);
      let objectTable = objectClass && objectClass.table_plural;
      let object = getPageInstance();
      let path = GGRC.mustache_path;
      let infoWidgetViews;
      let summaryWidgetViews;
      let modelNames;
      let possibleModelType;
      let farModels;
      let extraDescriptorOptions;
      let extraContentControllerOptions;

      // TODO: Really ugly way to avoid executing IIFE - needs cleanup
      if (!GGRC.page_object) {
        return;
      }
      // Info and summary widgets display the object information instead of listing
      // connected objects.
      summaryWidgetViews = {
        audits: path + '/audits/summary.mustache',
      };
      if (summaryWidgetViews[objectTable]) {
        widgetList.add_widget(object.constructor.shortName, 'summary', {
          widget_id: 'summary',
          content_controller: SummaryWidgetController,
          instance: object,
          widget_view: summaryWidgetViews[objectTable],
          order: 3,
          uncountable: true,
        });
      }
      if (isDashboardEnabled(object)) {
        widgetList.add_widget(object.constructor.shortName, 'dashboard', {
          widget_id: 'dashboard',
          content_controller: DashboardWidget,
          instance: object,
          widget_view: path + '/base_objects/dashboard_widget.mustache',
          order: 6,
          uncountable: true,
        });
      }
      infoWidgetViews = {
        programs: path + '/programs/info.mustache',
        audits: path + '/audits/info.mustache',
        people: path + '/people/info.mustache',
        policies: path + '/policies/info.mustache',
        controls: path + '/controls/info.mustache',
        systems: path + '/systems/info.mustache',
        processes: path + '/processes/info.mustache',
        products: path + '/products/info.mustache',
        assessments: path + '/assessments/info.mustache',
        assessment_templates:
          path + '/assessment_templates/info.mustache',
        issues: path + '/issues/info.mustache',
        evidence: path + '/evidence/info.mustache',
        documents: path + '/documents/info.mustache',
      };
      widgetList.add_widget(object.constructor.shortName, 'info', {
        widget_id: 'info',
        content_controller: InfoWidget,
        instance: object,
        widget_view: infoWidgetViews[objectTable],
        order: 5,
        uncountable: true,
      });
      modelNames = can.Map.keys(baseWidgetsByType);
      modelNames.sort();
      possibleModelType = modelNames.slice();
      can.each(modelNames, function (name) {
        let w_list;
        let child_model_list = [];
        let widgetConfig = getWidgetConfig(name);
        name = widgetConfig.name;
        GGRC.tree_view.basic_model_list.push({
          model_name: name,
          display_name: widgetConfig.widgetName,
        });

        // Initialize child_model_list, and child_display_list each model_type
        w_list = baseWidgetsByType[name];

        can.each(w_list, function (item) {
          let childConfig;
          if (possibleModelType.indexOf(item) !== -1) {
            childConfig = getWidgetConfig(name);
            child_model_list.push({
              model_name: childConfig.name,
              display_name: childConfig.widgetName,
            });
          }
        });
        GGRC.tree_view.sub_tree_for.attr(name, {
          model_list: child_model_list,
          display_list: CMS.Models[name].tree_view_options.child_tree_display_list || w_list,
        });
      });

      function apply_mixins(definitions) {
        let mappings = {};

        // Recursively handle mixins
        function reify_mixins(definition) {
          let final_definition = {};
          if (definition._mixins) {
            can.each(definition._mixins, function (mixin) {
              if (typeof (mixin) === 'string') {
                // If string, recursive lookup
                if (!definitions[mixin]) {
                  console.debug('Undefined mixin: ' + mixin, definitions);
                } else {
                  can.extend(
                    final_definition,
                    reify_mixins(definitions[mixin])
                  );
                }
              } else if (can.isFunction(mixin)) {
                // If function, call with current definition state
                mixin(final_definition);
              } else {
                // Otherwise, assume object and extend
                can.extend(final_definition, mixin);
              }
            });
          }
          can.extend(final_definition, definition);
          delete final_definition._mixins;
          return final_definition;
        }

        can.each(definitions, function (definition, name) {
          // Only output the mappings if it's a model, e.g., uppercase first letter
          if (name[0] === name[0].toUpperCase()) {
            mappings[name] = reify_mixins(definition);
          }
        });

        return mappings;
      }

      // the assessments_view only needs the Assessments widget
      if (/^\/assessments_view/.test(window.location.pathname)) {
        farModels = ['Assessment'];
      } else {
        farModels = baseWidgetsByType[object.constructor.shortName];
      }

      // here we are going to define extra descriptor options, meaning that
      //  these will be used as extra options to create widgets on top of

      extraDescriptorOptions = {
        all: (function () {
          let all = {
            Evidence: {
              treeViewDepth: 0,
            },
            Person: {
              widget_icon: 'person',
            },
          };

          let defOrder = GGRC.tree_view.attr('defaultOrderTypes');
          Object.keys(defOrder).forEach(function (type) {
            if (!all[type]) {
              all[type] = {};
            }
            all[type].order = defOrder[type];
          });

          return all;
        })(),
        Program: {
          Person: {
            widget_id: 'person',
            widget_name: 'People',
            widget_icon: 'person',
          },
        },

        // An Audit has a different set of object that are more relevant to it,
        // thus these objects have a customized priority. On the other hand,
        // the object otherwise prioritized by default (e.g. Regulation) have
        // their priority lowered so that they fit nicely into the alphabetical
        // order among the non-prioritized object types.
        Audit: {
          Assessment: {
            order: 7,
          },
          Issue: {
            order: 8,
          },
          Evidence: {
            order: 9,
          },
          program: {
            widget_id: 'program',
            widget_name: 'Program',
            widget_icon: 'program',
          },
          Person: {
            widget_id: 'person',
            widget_name: 'People',
            widget_icon: 'person',
            // NOTE: "order" not overridden
            content_controller_options: {
              allow_mapping: false,
              allow_creating: false,
            },
          },
        },
      };

      extraContentControllerOptions = apply_mixins({
        objectives: {
          Objective: {
            draw_children: true,
            add_item_view: path + '/snapshots/tree_add_item.mustache',
          },
        },
        controls: {
          Control: {
            draw_children: true,
            add_item_view: path + '/snapshots/tree_add_item.mustache',
          },
        },
        business_objects: {
          Audit: {
            draw_children: true,
            allow_mapping: true,
            add_item_view: path + '/audits/tree_add_item.mustache',
          },
          AccessGroup: {
            draw_children: true,
          },
          DataAsset: {
            draw_children: true,
          },
          Facility: {
            draw_children: true,
          },
          Market: {
            draw_children: true,
          },
          Metric: {
            draw_children: true,
          },
          OrgGroup: {
            draw_children: true,
          },
          Vendor: {
            draw_children: true,
          },
          Process: {
            draw_children: true,
          },
          Product: {
            draw_children: true,
          },
          ProductGroup: {
            draw_children: true,
          },
          Project: {
            draw_children: true,
          },
          System: {
            draw_children: true,
          },
          Assessment: {
            draw_children: true,
          },
          Person: {
            draw_children: true,
          },
          Program: {
            draw_children: true,
          },
          Risk: {
            draw_children: true,
          },
          TechnologyEnvironment: {
            draw_children: true,
          },
          Threat: {
            draw_children: true,
          },
        },
        issues: {
          Issue: {
            draw_children: true,
          },
        },
        governance_objects: {
          Regulation: {
            draw_children: true,
            add_item_view: path + '/snapshots/tree_add_item.mustache',
          },
          Contract: {
            draw_children: true,
          },
          Policy: {
            draw_children: true,
            add_item_view: path + '/snapshots/tree_add_item.mustache',
          },
          Standard: {
            draw_children: true,
            add_item_view: path + '/snapshots/tree_add_item.mustache',
          },
          Control: {
            draw_children: true,
          },
          Objective: {
            draw_children: true,
          },
          Requirement: {
            draw_children: true,
          },
        },
        Program: {
          _mixins: [
            'governance_objects', 'objectives', 'controls',
            'business_objects', 'issues',
          ],
          Audit: {
            allow_mapping: true,
            draw_children: true,
            add_item_view: path + '/audits/tree_add_item.mustache',
          },
          Person: {
            parent_instance: getPageInstance(),
            allow_reading: true,
            allow_mapping: true,
            allow_creating: true,
            model: businessModels.Person,
            draw_children: true,
          },
        },
        Audit: {
          _mixins: ['issues', 'governance_objects', 'business_objects'],
          Program: {
            parent_instance: getPageInstance(),
            draw_children: true,
            model: businessModels.Program,
            allow_mapping: false,
            allow_creating: false,
          },
          Requirement: {
            draw_children: true,
          },
          Threat: {
            draw_children: true,
          },
          Risk: {
            draw_children: true,
          },
          Assessment: {
            parent_instance: getPageInstance(),
            allow_mapping: true,
            draw_children: true,
            model: businessModels.Assessment,
            add_item_view: path + '/assessments/tree_add_item.mustache',
          },
          AssessmentTemplate: {
            draw_children: false,
            allow_mapping: false,
            add_item_view: GGRC.mustache_path +
              '/assessment_templates/tree_add_item.mustache',
          },
          Person: {
            widget_id: 'person',
            widget_name: 'People',
            widget_icon: 'person',
            draw_children: true,
            content_controller_options: {
              allow_mapping: false,
              allow_creating: false,
            },
          },
        },
        directive: {
          _mixins: [
            'objectives', 'controls', 'business_objects',
          ],
          Requirement: {
            draw_children: true,
          },
          Audit: {
            draw_children: true,
          },
        },
        Regulation: {
          _mixins: ['directive', 'issues'],
        },
        Standard: {
          _mixins: ['directive', 'issues'],
        },
        Policy: {
          _mixins: ['directive', 'issues'],
        },
        Contract: {
          _mixins: ['directive', 'issues'],
        },
        Requirement: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
          Audit: {
            draw_children: true,
          },
        },
        Objective: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
          Audit: {
            draw_children: true,
          },
        },
        Control: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
          Audit: {
            draw_children: true,
          },
        },
        Assessment: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
          Audit: {
            draw_children: true,
            allow_creating: false,
            allow_mapping: true,
            add_item_view: path + '/audits/tree_add_item.mustache',
          },
          Requirement: {
            draw_children: true,
          },
        },
        AssessmentTemplate: {
          Audit: {
            draw_children: true,
            allow_creating: false,
            allow_mapping: true,
          },
        },
        Risk: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
          Threat: {
            draw_children: true,
          },
        },
        Threat: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
          Risk: {
            draw_children: true,
          },
        },
        Issue: {
          _mixins: ['governance_objects', 'business_objects'],
          Control: {
            draw_children: true,
            add_item_view: path + '/base_objects/tree_add_item.mustache',
          },
          Audit: {
            draw_children: true,
            add_item_view:
              GGRC.mustache_path + '/base_objects/tree_add_item.mustache',
          },
        },
        AccessGroup: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
        },
        DataAsset: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
        },
        Facility: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
        },
        Market: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
        },
        Metric: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
        },
        OrgGroup: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
        },
        Vendor: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
        },
        Process: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
        },
        Product: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
        },
        ProductGroup: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
        },
        Project: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
        },
        System: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
        },
        TechnologyEnvironment: {
          _mixins: ['governance_objects', 'business_objects', 'issues'],
        },
        Person: {
          _mixins: ['issues'],
          Program: {
            draw_children: true,
          },
          Regulation: {
            draw_children: true,
          },
          Contract: {
            draw_children: true,
          },
          Standard: {
            draw_children: true,
          },
          Policy: {
            draw_children: true,
          },
          Audit: {
            draw_children: true,
          },
          Requirement: {
            add_item_view:
              GGRC.mustache_path + '/base_objects/tree_add_item.mustache',
            draw_children: true,
          },
          Objective: {
            draw_children: true,
            add_item_view: path + '/base_objects/tree_add_item.mustache',
          },
          Control: {
            draw_children: true,
            add_item_view: path + '/base_objects/tree_add_item.mustache',
          },
          Issue: {
            draw_children: true,
          },
          AccessGroup: {
            draw_children: true,
          },
          DataAsset: {
            draw_children: true,
          },
          Facility: {
            draw_children: true,
          },
          Market: {
            draw_children: true,
          },
          Metric: {
            draw_children: true,
          },
          OrgGroup: {
            draw_children: true,
          },
          Vendor: {
            draw_children: true,
          },
          Process: {
            draw_children: true,
          },
          Product: {
            draw_children: true,
          },
          ProductGroup: {
            draw_children: true,
          },
          Project: {
            draw_children: true,
          },
          System: {
            draw_children: true,
          },
          Assessment: {
            draw_children: true,
            add_item_view: null,
          },
          Risk: {
            draw_children: true,
          },
          TechnologyEnvironment: {
            draw_children: true,
          },
          Threat: {
            draw_children: true,
          },
        },
      });

      // Disable editing on profile pages, as long as it isn't audits on the dashboard
      if (getPageInstance() instanceof businessModels.Person) {
        let person_options = extraContentControllerOptions.Person;
        can.each(person_options, function (options, model_name) {
          if (model_name !== 'Audit' || !/dashboard/.test(window.location)) {
            can.extend(options, {
              allow_creating: false,
              allow_mapping: true,
            });
          }
        });
      }

      can.each(farModels, function (model_name) {
        let widgetConfig = getWidgetConfig(model_name);
        model_name = widgetConfig.name;

        let far_model;
        let descriptor = {};
        let widget_id;

        far_model = CMS.Models[model_name];
        if (far_model) {
          widget_id = widgetConfig.widgetId;
          descriptor = {
            instance: object,
            far_model: far_model,
          };
        } else {
          widget_id = model_name;
        }

        // Custom overrides
        if (extraDescriptorOptions.all && extraDescriptorOptions.all[model_name]) {
          $.extend(descriptor, extraDescriptorOptions.all[model_name]);
        }

        if (extraDescriptorOptions[object.constructor.shortName] && extraDescriptorOptions[object.constructor.shortName][model_name]) {
          $.extend(descriptor, extraDescriptorOptions[object.constructor.shortName][model_name]);
        }

        if (extraContentControllerOptions[object.constructor.shortName] && extraContentControllerOptions[object.constructor.shortName][model_name]) {
          $.extend(true, descriptor, {
            content_controller_options: extraContentControllerOptions[object.constructor.shortName][model_name],
          });
        }
        descriptor.widgetType = 'treeview';
        widgetList.add_widget(object.constructor.shortName, widget_id, descriptor);
      });
    },
  });
})(window.can, window.can.$);

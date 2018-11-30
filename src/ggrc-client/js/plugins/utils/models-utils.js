/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {notifier} from './notifiers-utils';
import RefreshQueue from '../../models/refresh_queue';
import Stub from '../../models/stub';
import * as businessModels from '../../models/business-models';
import * as serviceModels from '../../models/service-models';
import * as joinModels from '../../models/join-models';

const allModels = Object.assign({},
  businessModels,
  serviceModels,
  joinModels);

const relatedAssessmentsTypes = Object.freeze(['Control', 'Objective']);

const objectTypeDecisionTree = Object.freeze({
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
  role: serviceModels.Role,
  technology_environment: businessModels.TechnologyEnvironment,
  threat: businessModels.Threat,
  risk: businessModels.Risk,
  workflow: businessModels.Workflow,
});

const getModelInstance = (id, type, requiredAttr) => {
  const promise = new Promise((resolve, reject) => {
    let modelInstance;

    if (!id || !type || !requiredAttr) {
      reject();
    }

    modelInstance = allModels[type].findInCacheById(id) || {};

    if (modelInstance && modelInstance.hasOwnProperty(requiredAttr)) {
      resolve(modelInstance);
    } else {
      modelInstance = new allModels[type]({id: id});
      new RefreshQueue()
        .enqueue(modelInstance)
        .trigger()
        .done((data) => {
          data = Array.isArray(data) ? data[0] : data;
          resolve(data);
        })
        .fail(function () {
          notifier('error', `Failed to fetch data for ${type}: ${id}.`);
          reject();
        });
    }
  });

  return promise;
};

const inferObjectType = (data) => {
  if (!data) {
    return null;
  } else {
    return can.reduce(Object.keys(data), (a, b) =>
      a || objectTypeDecisionTree[b] || null, null);
  }
};

/**
 * Check the model has Related Assessments
 * @param {String} type - model type
 * @return {Boolean}
 */
const hasRelatedAssessments = (type) => {
  return _.includes(relatedAssessmentsTypes, type);
};

const getInstance = (objectType, objectId, paramsOrObject) => {
  let model;
  let params = {};
  let instance;
  let href;

  if (typeof objectType === 'object' || objectType instanceof Stub) {
    // assume we only passed in params_or_object
    paramsOrObject = objectType;
    if (!paramsOrObject) {
      return null;
    }
    if (paramsOrObject instanceof can.Model) {
      objectType = paramsOrObject.constructor.shortName;
    } else if (paramsOrObject instanceof Stub) {
      objectType = paramsOrObject.type;
    } else if (!paramsOrObject.selfLink && paramsOrObject.type) {
      objectType = paramsOrObject.type;
    } else {
      href = paramsOrObject.selfLink || paramsOrObject.href;
      objectType = can.map(
        window.cms_singularize(/^\/api\/(\w+)\//.exec(href)[1]).split('_'),
        can.capitalize
      ).join('');
    }
    objectId = paramsOrObject.id;
  }

  model = allModels[objectType];

  if (!model) {
    return null;
  }

  if (!objectId) {
    return null;
  }

  if (paramsOrObject) {
    if (_.isFunction(paramsOrObject.serialize)) {
      $.extend(params, paramsOrObject.serialize());
    } else {
      $.extend(params, paramsOrObject || {});
    }
  }

  instance = model.findInCacheById(objectId);
  if (!instance) {
    if (params.selfLink) {
      params.id = objectId;
      instance = new model(params);
    } else {
      instance = new model({
        id: objectId,
        type: objectType,
        href: (paramsOrObject || {}).href,
      });
    }
  }
  return instance;
};

function isScopeModel(type) {
  const model = businessModels[type];

  return model && model.category === 'scope';
}

/**
 * Return Model Constructor Instance
 * @param {String} type - Model type
 * @return {CMS.Model.Cacheble|null} - Return Model Constructor
 */
const getModelByType = (type) => {
  if (!type || typeof type !== 'string') {
    console.warn('Type is not provided or has incorrect format.',
      'Value of Type is:', type);
    return null;
  }
  return allModels[type];
};

/**
 * Returns models with custom roles
 * @return {Array} list of models
 */
function getRoleableModels() {
  return Object.keys(businessModels)
    .filter((modelName) => businessModels[modelName].isRoleable)
    .map((modelName) => businessModels[modelName]);
}

/**
 * Returns models with custom roles
 * @return {Array} list of models
 */
function getCustomAttributableModels() { // eslint-disable-line
  return Object.keys(businessModels)
    .filter((modelName) => businessModels[modelName].is_custom_attributable)
    .map((modelName) => businessModels[modelName]);
}

export {
  getModelInstance,
  hasRelatedAssessments,
  relatedAssessmentsTypes,
  inferObjectType,
  getInstance,
  isScopeModel,
  getModelByType,
  getRoleableModels,
  getCustomAttributableModels,
};

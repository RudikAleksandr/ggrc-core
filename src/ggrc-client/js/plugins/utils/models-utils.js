/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {notifier} from './notifiers-utils';
import RefreshQueue from '../../models/refresh_queue';
import * as businessModels from '../../models/business-models';
import * as serviceModels from '../../models/service-models';

const allModels = {
  ...businessModels,
  ...serviceModels,
};

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
    let obj = _.find(Object.keys(data), (key) => objectTypeDecisionTree[key]);
    return objectTypeDecisionTree[obj];
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

const getInstance = (objectType, objectId) => {
  let model = allModels[objectType];

  if (!model) {
    return null;
  }

  if (!objectId) {
    return null;
  }

  let instance = model.findInCacheById(objectId);
  if (!instance) {
    instance = new model({
      id: objectId,
      type: objectType,
    });
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

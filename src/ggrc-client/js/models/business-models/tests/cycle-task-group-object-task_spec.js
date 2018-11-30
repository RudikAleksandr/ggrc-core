/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import CycleTaskGroupObjectTask from '../cycle-task-group-object-task';
import Workflow from '../workflow';
import {makeFakeInstance} from '../../../../js_specs/spec_helpers';
import * as Reify from '../../../plugins/utils/reify-utils';

describe('CycleTaskGroupObjectTask model', function () {
  let fakeCTModelCreator;

  beforeEach(function () {
    fakeCTModelCreator = makeFakeInstance({
      model: CycleTaskGroupObjectTask,
    });
  });

  describe('responseOptionsEditable method', function () {
    let instance;
    let method; // the method under test
    let Model;
    let origCycleConfig;

    beforeAll(function () {
      Model = CycleTaskGroupObjectTask;

      // override the Task's cycle attribute config to disable the magic that
      // happens when trying to manually set a mocked Cycle on a Task instance
      origCycleConfig = Model.attributes.cycle;
      delete Model.attributes.cycle;
    });

    afterAll(function () {
      Model.attributes.cycle = origCycleConfig;
    });

    beforeEach(function () {
      instance = fakeCTModelCreator({
        status: 'Assigned',
        cycle: {
          is_current: false,
        },
      });

      spyOn(Reify, 'reify').and.returnValue(instance.cycle);

      method = Model.prototype.responseOptionsEditable.bind(instance);
    });

    it('returns false if the Task\'s Cycle is not current for ' +
      'a non-finished task',
    function () {
      let isEditable;
      instance.attr('status', 'In Progress');
      instance.cycle.attr('is_current', false);

      isEditable = method();

      expect(isEditable).toBe(false);
    }
    );

    it('returns false if a Task in a current cycle is completed', function () {
      let END_STATES = ['Verified', 'Finished'];
      let isEditable;

      instance.cycle.attr('is_current', true);

      END_STATES.forEach(function (state) {
        instance.attr('status', state);
        isEditable = method();
        expect(isEditable).toBe(false);
      });
    });

    it('returns true if a Task is in a current cycle and not completed',
      function () {
        let isEditable;
        instance.cycle.attr('is_current', true);
        instance.attr('status', 'In Progress');

        isEditable = method();

        expect(isEditable).toBe(true);
      }
    );
  });

  describe('form_preload method', function () {
    let instance;

    beforeEach(function () {
      instance = fakeCTModelCreator({
        status: 'Assigned',
        cycle: {
          is_current: false,
        },
      });
    });

    it('populates the workflow and related objects ' +
      'when creating new task from workflow page',
    function () {
      let cycles = [{
        id: 'cycle id',
        is_current: true}];

      let workflow = makeFakeInstance({model: Workflow})({
        id: 'workflow id',
        context: {
          id: 'context id',
        },
        cycles: cycles,
      });

      spyOn(workflow, 'refresh_all').and
        .returnValue(can.Deferred().resolve(cycles));

      instance.form_preload(true, {workflow: workflow});

      expect(instance.attr('workflow.id')).toEqual('workflow id');
      expect(instance.attr('workflow.type')).toEqual('Workflow');
      expect(instance.attr('context.id')).toEqual('context id');
      expect(instance.attr('context.type')).toEqual('Context');
      expect(instance.attr('cycle.id')).toEqual('cycle id');
      expect(instance.attr('cycle.type')).toEqual('Cycle');
    });
  });
});

/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../deferred-mapper';
import {getComponentVM} from '../../../js_specs/spec_helpers';

import * as ReifyUtils from '../../plugins/utils/reify-utils';
import * as MapperUtils from '../../plugins/utils/mapper-utils';
import {
  REFRESH_MAPPING,
  REFRESH_SUB_TREE,
  DEFERRED_MAP_OBJECTS,
} from '../../events/eventTypes';
import * as CurrentPageUtils from '../../plugins/utils/current-page-utils';
import * as SnapshotUtils from '../../plugins/utils/snapshot-utils';

describe('deferred-mapper component', function () {
  let vm;

  beforeEach(function () {
    vm = getComponentVM(Component);
    vm.attr('instance', {});
  });

  describe('setter of "instance"', () => {
    it('sets new instance', () => {
      const newInstance = new can.Map({});
      vm.attr('instance', newInstance);

      expect(vm.attr('instance')).toEqual(newInstance);
    });

    it('assigns empty array to _pendingJoins of instance ' +
    'if it is not defined', () => {
      const newInstance = new can.Map({});
      vm.attr('instance', newInstance);

      expect(vm.attr('instance._pendingJoins').serialize()).toEqual([]);
    });
  });

  describe('setter of "preMappedObjects"', () => {
    let objects;

    beforeEach(() => {
      objects = new can.List([1, 2, 3]);
      spyOn(vm, 'addMappings');
      spyOn(vm, 'updateListWith');
    });

    it('sets new objects', () => {
      vm.attr('preMappedObjects', []);
      vm.attr('preMappedObjects', objects);

      expect(vm.attr('preMappedObjects')).toEqual(objects);
    });

    it('calls addMappings with objects', () => {
      vm.attr('preMappedObjects', objects);

      expect(vm.addMappings).toHaveBeenCalledWith(objects);
    });

    it('calls updateListWith with objects', () => {
      vm.attr('preMappedObjects', objects);

      expect(vm.updateListWith).toHaveBeenCalledWith(objects);
    });

    it('does not call addMappings if objects are empty', () => {
      vm.attr('preMappedObjects', []);

      expect(vm.addMappings).not.toHaveBeenCalledWith(objects);
    });

    it('does not call updateListWith if objects are empty', () => {
      vm.attr('preMappedObjects', []);

      expect(vm.updateListWith).not.toHaveBeenCalledWith(objects);
    });
  });

  describe('setter of "mappedObjects"', () => {
    let objects;

    beforeEach(() => {
      objects = new can.List([1, 2, 3]);
      spyOn(vm, 'updateListWith');
    });

    it('sets new objects', () => {
      vm.attr('mappedObjects', []);
      vm.attr('mappedObjects', objects);

      expect(vm.attr('mappedObjects')).toEqual(objects);
    });

    it('calls updateListWith with objects', () => {
      vm.attr('mappedObjects', objects);

      expect(vm.updateListWith).toHaveBeenCalledWith(objects);
    });

    it('does not call updateListWith if objects are empty', () => {
      vm.attr('mappedObjects', []);

      expect(vm.updateListWith).not.toHaveBeenCalledWith(objects);
    });
  });

  describe('performMapActions(instance, objects) method', function () {
    beforeEach(() => {
      spyOn(MapperUtils, 'mapObjects')
        .and.returnValue($.Deferred().resolve());
    });

    it('calls MapperUtils.mapObjects with specified arguments', (done) => {
      const instance = {};
      const objects = [
        new can.Map({id: 0}),
        new can.Map({id: 1}),
      ];
      vm.attr('useSnapshots', {});

      vm.performMapActions(instance, objects)
        .then(() => {
          expect(MapperUtils.mapObjects).toHaveBeenCalledWith(
            instance,
            objects,
            {useSnapshots: vm.attr('useSnapshots')}
          );
          done();
        });
    });

    it('does not call MapperUtils.mapObjects if no objects to map', (done) => {
      vm.performMapActions({}, []).then(() => {
        expect(MapperUtils.mapObjects).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('performUnmapActions(instance, objects) method', () => {
    beforeEach(() => {
      spyOn(MapperUtils, 'unmapObjects')
        .and.returnValue($.Deferred().resolve());
    });

    it('calls MapperUtils.unmapObjects with specified arguments', (done) => {
      const instance = {};
      const objects = [
        new can.Map({id: 0}),
        new can.Map({id: 1}),
      ];

      vm.performUnmapActions(instance, objects)
        .then(() => {
          expect(MapperUtils.unmapObjects)
            .toHaveBeenCalledWith(instance, objects);
          done();
        });
    });

    it('does not call MapperUtils.mapObjects if no objects to unmap',
      (done) => {
        vm.performUnmapActions({}, []).then(() => {
          expect(MapperUtils.unmapObjects).not.toHaveBeenCalled();
          done();
        });
      });
  });

  describe('afterDeferredUpdate(objects) method', () => {
    let instance;
    let pageInstance;

    beforeEach(() => {
      instance = new can.Map({
        type: 'instanceType',
      });
      vm.attr('instance', instance);
      spyOn(instance, 'dispatch');

      pageInstance = new can.Map({
        id: 711,
        type: 'pageInstanceType',
      });
      spyOn(pageInstance, 'dispatch');
      spyOn(CurrentPageUtils, 'getPageInstance')
        .and.returnValue(pageInstance);
    });

    it('dispatches REFRESH_MAPPING event once for each type of objects',
      () => {
        const objects = [
          {
            type: 'type1',
          },
          {
            type: 'type1',
          },
          {
            type: 'type2',
          },
        ];
        const objectTypes = _.uniq(objects
          .map((object) => object.type)
        );

        vm.afterDeferredUpdate(objects);

        objectTypes.forEach((objectType) => {
          let callsArgs = instance.dispatch.calls.allArgs()
            .map((args) => args[0]);
          let callCount = callsArgs.filter((args) =>
            args.type === REFRESH_MAPPING.type &&
            args.destinationType === objectType).length;

          expect(callCount).toBe(1);
        });
      });

    it('dispatches REFRESH_SUB_TREE event on instance', () => {
      vm.afterDeferredUpdate([]);

      expect(instance.dispatch).toHaveBeenCalledWith(REFRESH_SUB_TREE);
    });

    it('dispatches REFRESH_MAPPING event on pageInstance', () => {
      vm.afterDeferredUpdate([pageInstance]);

      expect(pageInstance.dispatch).toHaveBeenCalledWith({
        ...REFRESH_MAPPING,
        destinationType: instance.type,
      });
    });

    it('does not dispatch REFRESH_MAPPING event on pageInstance ' +
    'if it is not in "objects"', () => {
      vm.afterDeferredUpdate([{}]);

      expect(pageInstance.dispatch).not.toHaveBeenCalledWith({
        ...REFRESH_MAPPING,
        destinationType: instance.type,
      });
    });
  });

  describe('async deferredUpdate() method', () => {
    beforeEach(() => {
      vm.attr('instance', {});
      vm.attr('instance._pendingJoins', [
        {
          how: 'map',
          what: {},
        },
        {
          how: 'unmap',
          what: {},
        },
      ]);

      spyOn(vm, 'performMapActions').and.returnValue(Promise.resolve());
      spyOn(vm, 'performUnmapActions').and.returnValue(Promise.resolve());
      spyOn(vm, 'afterDeferredUpdate');
    });

    it('calls performMapActions for objects pending mapping', async (done) => {
      const objectsToMap =
        _.filter(vm.attr('instance._pendingJoins'), ({how}) => how === 'map')
          .map(({what}) => what);

      await vm.deferredUpdate();

      expect(vm.performMapActions).toHaveBeenCalledWith(
        vm.attr('instance'),
        objectsToMap
      );
      done();
    });

    it('calls performUnmapActions for objects pending mapping',
      async (done) => {
        const objectsToUnmap = _.filter(vm.attr('instance._pendingJoins'),
          ({how}) => how === 'unmap')
          .map(({what}) => what);

        await vm.deferredUpdate();

        expect(vm.performUnmapActions).toHaveBeenCalledWith(
          vm.attr('instance'),
          objectsToUnmap
        );
        done();
      });

    it('assigns empty array to _pendingJoins of instance', async (done) => {
      await vm.deferredUpdate();

      expect(vm.attr('instance._pendingJoins').serialize()).toEqual([]);
      done();
    });

    it('calls afterDeferredUpdate for all pending objects', async (done) => {
      const objects = _.map(vm.attr('instance._pendingJoins'),
        ({what}) => what);

      await vm.deferredUpdate();

      expect(vm.afterDeferredUpdate).toHaveBeenCalledWith(objects);
      done();
    });
  });

  describe('addMappings(objects) method', () => {
    let originalPendings;

    beforeEach(() => {
      originalPendings = [
        {
          how: 'map',
          what: {id: 1, type: 'type1'},
        },
        {
          how: 'unmap',
          what: {id: 2, type: 'type1'},
        },
      ];
      vm.attr('instance', {});
      vm.attr('instance._pendingJoins', originalPendings);

      spyOn(vm, 'addListItem');
    });

    it('adds map pending for object ' +
    'if unmap pending does not exist for this object', () => {
      const objects = [{id: 3, type: 'type1'}, {id: 4, type: 'type1'}];

      vm.addMappings(objects);

      const expected = originalPendings.concat(
        objects.map((obj) => ({what: obj, how: 'map'}))
      );

      expect(vm.attr('instance._pendingJoins').serialize()).toEqual(expected);
    });

    it('removes unmap pending for object if exists', () => {
      const objects = [
        {id: 3, type: 'type1'}, // should be added to originalPendings
        {id: 4, type: 'type1'}, // should be added to originalPendings
        {id: 2, type: 'type1'}, // should be removed from originalPendings
      ];

      vm.addMappings(objects);

      const expected = [
        {
          how: 'map',
          what: {id: 1, type: 'type1'},
        },
        {
          how: 'map',
          what: {id: 3, type: 'type1'},
        },
        {
          how: 'map',
          what: {id: 4, type: 'type1'},
        },
      ];

      expect(vm.attr('instance._pendingJoins').serialize()).toEqual(expected);
    });

    it('calls addListItem for all objects', () => {
      const objectsToAdd = [{id: 3, type: 'type1'}, {id: 4, type: 'type1'}];
      const objectsToRemove = [{id: 2, type: 'type1'}];

      vm.addMappings(objectsToAdd.concat(objectsToRemove));

      objectsToAdd.concat(objectsToRemove).forEach((obj) => {
        expect(vm.addListItem).toHaveBeenCalledWith(obj);
      });
    });
  });

  describe('removeMappings(obj) method', () => {
    let originalPendings;

    beforeEach(() => {
      originalPendings = [
        {
          how: 'map',
          what: {id: 1, type: 'type1'},
        },
        {
          how: 'unmap',
          what: {id: 2, type: 'type1'},
        },
      ];
      vm.attr('instance', {});
      vm.attr('instance._pendingJoins', originalPendings);
      vm.attr('list', [{id: 1, type: 'type1'}]);
    });

    it('adds unmap pending for object ' +
    'if map pending does not exist for this object', () => {
      let obj = {id: 3, type: 'type1'};

      vm.removeMappings(obj);

      let expected = originalPendings.concat([{
        what: obj,
        how: 'unmap',
      }]);

      expect(vm.attr('instance._pendingJoins').serialize()).toEqual(expected);
    });

    it('removes map pending for object if exists', () => {
      let obj = {id: 1, type: 'type1'};

      vm.removeMappings(obj);

      let expected = originalPendings.filter(
        ({what}) => !(what.id === obj.id && what.type === obj.type)
      );

      expect(vm.attr('instance._pendingJoins').serialize()).toEqual(expected);
    });

    it('removes object from "list"', () => {
      let obj = {id: 1, type: 'type1'};

      let expected = vm.attr('list').serialize()
        .filter(({id, type}) => !(id === obj.id && type === obj.type));

      vm.removeMappings(obj);

      expect(vm.attr('list').serialize()).toEqual(expected);
    });
  });

  describe('addListItem(item) method', () => {
    let isSnapshotTypeSpy;

    beforeEach(() => {
      isSnapshotTypeSpy = spyOn(SnapshotUtils, 'isSnapshotType');
    });

    it('pushes reified "item" into "list" if "item" is not of snapshot type',
      () => {
        let reifiedItem = {id: 1};
        let item = new can.Map({});

        isSnapshotTypeSpy.and.returnValue(false);
        spyOn(ReifyUtils, 'isReifiable').and.returnValue(true);
        spyOn(ReifyUtils, 'reify').and.returnValue(reifiedItem);

        vm.attr('list', []);

        vm.addListItem(item);

        expect(vm.attr('list').serialize()).toEqual([reifiedItem]);
      });

    it('pushes specified "item" into "list" if "item" is of snapshot type',
      () => {
        isSnapshotTypeSpy.and.returnValue(true);
        let snapshotObject = {
          title: 'title',
          description: 'description',
          'class': 'class',
          originalLink: 'originalLink',
        };
        let item = {snapshotObject};
        vm.attr('list', []);

        vm.addListItem(new can.Map(item));

        let expected = jasmine.objectContaining({
          title: snapshotObject.title,
          description: snapshotObject.description,
          'class': snapshotObject.class,
          viewLink: snapshotObject.originalLink,
        });
        expect(vm.attr('list').serialize()).toEqual([expected]);
      });
  });

  describe('updateListWith(objects) method', () => {
    it('assigns empty array to "list" if no "objects" was passed', () => {
      vm.attr('list', [1, 2, 3]);

      vm.updateListWith();

      expect(vm.attr('list').serialize()).toEqual([]);
    });

    it('calls addListItem for each passed object', () => {
      spyOn(vm, 'addListItem');
      vm.attr('list', [1, 2, 3]);
      const objects = [4, 5, 6];

      vm.updateListWith(objects);

      objects.forEach((obj) =>
        expect(vm.addListItem).toHaveBeenCalledWith(obj));
    });
  });

  const events = Component.prototype.events;

  describe('"{instance} updated" event handler', () => {
    it('calls deferredUpdate of viewModel', () => {
      const handler = events['{instance} updated'].bind({
        viewModel: vm,
      });
      spyOn(vm, 'deferredUpdate');

      handler();

      expect(vm.deferredUpdate).toHaveBeenCalled();
    });
  });

  describe('"{instance} created" event handler', () => {
    it('calls deferredUpdate of viewModel', () => {
      const handler = events['{instance} created'].bind({
        viewModel: vm,
      });
      spyOn(vm, 'deferredUpdate');

      handler();

      expect(vm.deferredUpdate).toHaveBeenCalled();
    });
  });

  describe('"{instance} ${DEFERRED_MAP_OBJECTS.type}" event handler', () => {
    it('calls addMappings of viewModel for passed objects', () => {
      const handler = events[`{instance} ${DEFERRED_MAP_OBJECTS.type}`].bind({
        viewModel: vm,
      });
      spyOn(vm, 'addMappings');
      const objects = [1, 2, 3];

      handler({}, {objects});

      expect(vm.addMappings).toHaveBeenCalledWith(objects);
    });
  });

  describe('"removed" event handler', () => {
    let handler;

    beforeEach(() => {
      handler = events.removed.bind({
        viewModel: vm,
      });
    });

    it('removes "_pendingJoins" attr of instance', () => {
      vm.attr('instance', {
        _pendingJoins: [1, 2, 3],
      });

      handler();

      expect(vm.attr('instance._pendingJoins')).toBe(undefined);
    });

    it('works correctly if no instance in viewModel', () => {
      vm.attr('instance', null);

      expect(handler).not.toThrow(jasmine.any(Error));
    });
  });
});

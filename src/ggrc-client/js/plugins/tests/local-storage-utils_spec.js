/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as LocalStorage from '../utils/local-storage-utils';

describe('local-storage utils', function () {
  let model1 = {id: 1, foo: 'bar'};
  let model2 = {id: 2, foo: 'baz'};
  let SpecModel;

  beforeAll(function () {
    SpecModel = can.Model('SpecModel', {}, {});
  });

  beforeEach(function () {
    window.localStorage.setItem('spec_model:ids', '[1, 2]');
    window.localStorage.setItem('spec_model:1', JSON.stringify(model1));
    window.localStorage.setItem('spec_model:2', JSON.stringify(model2));
  });

  afterEach(function () {
    window.localStorage.removeItem('spec_model:ids');
    window.localStorage.removeItem('spec_model:1');
    window.localStorage.removeItem('spec_model:2');
  });
  describe('findAll() method', function () {
    it('returns all model instnances with model argument', function () {
      const list = LocalStorage.getAll(SpecModel);

      expect(list.length).toBe(2);
      expect(list instanceof can.Model.List).toBeTruthy();
      expect(list[0] instanceof SpecModel).toBeTruthy();
      expect(list[0].serialize()).toEqual(model1);
      expect(list[1].serialize()).toEqual(model2);
    });

    it('returns an empty list with no matches', function () {
      const list = LocalStorage.getAll({quux: 'thud'});

      expect(list instanceof can.Model.List).toBeTruthy();
      expect(list.length).toBe(0);
    });
  });

  describe('add() method', function () {
    beforeEach(function () {
      window.localStorage.removeItem('spec_model:ids');
      window.localStorage.removeItem('spec_model:1');
      window.localStorage.removeItem('spec_model:2');
    });

    it('creates and registers a model', function () {
      const item = LocalStorage.add(SpecModel, {foo: model1.foo});

      expect(item.id).toBeDefined();
      expect(item.foo).toEqual(model1.foo);

      let ids = JSON.parse(window.localStorage.getItem('spec_model:ids'));

      expect(ids.length).toEqual(1);
      expect(window.localStorage.getItem('spec_model:' + ids[0])).toBeDefined();
    });

    it('creates a model with an appropriate ID when the array of IDs is empty', function () {
      window.localStorage.setItem('spec_model:ids', '[]');

      const item = LocalStorage.add(SpecModel, {foo: model1.foo});

      expect(item.id + 1).not.toBe(item.id); // not infinity, not NaN
      expect(item.foo).toEqual(model1.foo);

      let ids = JSON.parse(window.localStorage.getItem('spec_model:ids'));

      expect(ids.length).toEqual(1);
      expect(window.localStorage.getItem('spec_model:' + ids[0])).toBeDefined();

      window.localStorage.removeItem('spec_model:-Infinity'); // the problem key
    });
  });

  describe('update() method', function () {
    it('updates model instance by id', function () {
      const model = {id: 1, foo: 'zxc'};
      const item = LocalStorage.update(SpecModel, model);

      expect(item instanceof SpecModel).toBeTruthy();
      expect(JSON.parse(window.localStorage.getItem('spec_model:1'))).toEqual(model);
    });
  });


  describe('remove() method', function () {
    it('remove model instance by id', function () {
      new SpecModel(model1);
      LocalStorage.remove(SpecModel, model1.id);

      expect(JSON.parse(window.localStorage.getItem('spec_model:1'))).toBeNull();

      let ids = JSON.parse(window.localStorage.getItem('spec_model:ids'));

      expect(ids.length).toBe(1);
      expect(ids[0]).not.toEqual(model1.id);
    });
  });
});

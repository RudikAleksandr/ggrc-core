/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as ReifyUtils from '../../utils/reify-utils';
import Audit from '../../../models/business-models/audit';
import {makeFakeInstance} from '../../../../js_specs/spec_helpers';

describe('reify-utils', () => {
  describe('reify() method', () => {
    it('should return passed obj when it is can.Model', () => {
      const obj = new can.Model({});
      const model = ReifyUtils.reify(obj);

      expect(model).toBe(obj);
    });

    it(`should return can.List with instances of required model
      when passed object is can.List`, () => {
      const objs = new can.List([]);
      const audits = new can.List([]);

      for (let i = 0; i < 3; i++) {
        objs.push(new can.Map({type: 'Audit', id: i}));
        audits.push(makeFakeInstance({model: Audit})(
          {id: i, data: `Test data ${i}`})
        );
      }

      spyOn(Audit, 'model').and.returnValues(...audits);

      const result = ReifyUtils.reify(objs);

      expect(result.serialize()).toEqual(audits.serialize());
    });

    it(`should return can.Model's instance
      when passed object is can.Map`, () => {
      const obj = new can.Map({type: 'Audit', id: 1});
      const audit = makeFakeInstance({model: Audit})(
        {id: 1, data: 'Test data'}
      );

      spyOn(Audit, 'model').and.returnValue(audit);

      const result = ReifyUtils.reify(obj);

      expect(result.serialize()).toEqual(audit.serialize());
    });
  });

  describe('isReifiable() method', () => {
    it('should return true when obj is the instance of can.Map', () => {
      const obj = new can.Model({});
      const result = ReifyUtils.isReifiable(obj);

      expect(result).toBe(true);
    });
  });

  describe('reifyMap() method', () => {
    it('should call console.warn when model is unrecognized type', () => {
      const obj = new can.Map({type: 'Object'});
      spyOn(console, 'warn');

      ReifyUtils.reifyMap(obj);

      expect(console.warn).toHaveBeenCalled();
    });

    it('should return instance can.Model when model is recognized type', () => {
      const obj = new can.Map({type: 'Audit', id: 1});
      const audit = makeFakeInstance({model: Audit})(
        {id: 1, data: 'Test data'}
      );

      spyOn(Audit, 'model').and.returnValue(audit);

      const result = ReifyUtils.reifyMap(obj);

      expect(result.serialize()).toEqual((audit.serialize()));
    });
  });

  describe('reifyList() method', () => {
    it('should return instance can.List with models', () => {
      const objs = new can.List([]);
      const audits = new can.List([]);

      for (let i = 0; i < 3; i++) {
        objs.push(new can.Map({type: 'Audit', id: i}));
        audits.push(makeFakeInstance({model: Audit})(
          {id: i, data: `Test data ${i}`}
        ));
      }

      spyOn(Audit, 'model').and.returnValues(...audits);

      const result = ReifyUtils.reifyList(objs);

      expect(result.serialize()).toEqual(audits.serialize());
    });
  });
});

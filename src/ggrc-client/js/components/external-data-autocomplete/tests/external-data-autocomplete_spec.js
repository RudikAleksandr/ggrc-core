/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../external-data-autocomplete';
import * as businessModels from '../../../models/business-models';
import * as Reify from '../../../plugins/utils/reify-utils';

describe('external-data-autocomplete component', () => {
  let viewModel;
  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('viewModel', () => {
    describe('renderResults get()', () => {
      describe('returns true', () => {
        it(`when "showResults" flag is turned on
            and "searchCriteria" length is greather than "minLength"`, () => {
          viewModel.attr('showResults', true);
          viewModel.attr('minLength', 2);
          viewModel.attr('searchCriteria', 'test');

          let result = viewModel.attr('renderResults');

          expect(result).toBe(true);
        });
      });

      describe('returns false', () => {
        it(`when "showResults" flag is turned off
            and "searchCriteria" length is greather than "minLength"`, () => {
          viewModel.attr('showResults', false);
          viewModel.attr('minLength', 2);
          viewModel.attr('searchCriteria', 'test');

          let result = viewModel.attr('renderResults');

          expect(result).toBe(false);
        });

        it(`when "showResults" flag is turned on
            and "searchCriteria" length is less than "minLength"`, () => {
          viewModel.attr('showResults', true);
          viewModel.attr('minLength', 2);
          viewModel.attr('searchCriteria', '');

          let result = viewModel.attr('renderResults');

          expect(result).toBe(false);
        });

        it(`when "showResults" flag is turned off
            and "searchCriteria" length is less than "minLength"`, () => {
          viewModel.attr('showResults', false);
          viewModel.attr('minLength', 2);
          viewModel.attr('searchCriteria', '');

          let result = viewModel.attr('renderResults');

          expect(result).toBe(false);
        });
      });
    });

    describe('openResults() method', () => {
      it('turnes on "showResults" flag', () => {
        viewModel.attr('showResults', false);

        viewModel.openResults();

        expect(viewModel.attr('showResults')).toBe(true);
      });
    });

    describe('closeResults() method', () => {
      it('turnes off "showResults" flag', () => {
        viewModel.attr('showResults', true);

        viewModel.closeResults();

        expect(viewModel.attr('showResults')).toBe(false);
      });
    });

    describe('setSearchCriteria() method', () => {
      let element = {
        val: jasmine.createSpy().and.returnValue('criteria'),
      };

      it('updates "searchCriteria" property', (done) => {
        viewModel.attr('searchCriteria', null);

        viewModel.setSearchCriteria(element);

        setTimeout(() => {
          expect(viewModel.attr('searchCriteria')).toBe('criteria');
          done();
        }, 600);
      });

      it('dispatches "criteriaChanged" event', (done) => {
        spyOn(viewModel, 'dispatch');

        viewModel.setSearchCriteria(element);

        setTimeout(() => {
          expect(viewModel.dispatch).toHaveBeenCalledWith({
            type: 'criteriaChanged',
            value: 'criteria',
          });
          done();
        }, 600);
      });
    });

    describe('onItemPicked() method', () => {
      let item;
      let created;

      beforeEach(() => {
        item = {
          test: true,
        };
        created = Promise.resolve(item);
        spyOn(viewModel, 'createOrGet').and.returnValue(created);
      });

      it('turns on "saving" flag', () => {
        viewModel.attr('saving', false);

        viewModel.onItemPicked(item);

        expect(viewModel.attr('saving')).toBe(true);
      });

      it('call createOrGet() method', () => {
        viewModel.onItemPicked(item);

        expect(viewModel.createOrGet).toHaveBeenCalledWith(item);
      });

      it('dispatches event when istance was saved', (done) => {
        spyOn(viewModel, 'dispatch');

        viewModel.onItemPicked(item);

        created.then(() => {
          expect(viewModel.dispatch).toHaveBeenCalledWith({
            type: 'itemSelected',
            selectedItem: item,
          });
          done();
        });
      });

      it('turns off "saving" flag', (done) => {
        viewModel.attr('saving', true);

        viewModel.onItemPicked(item);

        created.then().finally(() => {
          expect(viewModel.attr('saving')).toBe(false);
          done();
        });
      });

      it('cleans search criteria if "autoClean" is turned on', (done) => {
        viewModel.attr('searchCriteria', 'someText');
        viewModel.attr('autoClean', true);

        viewModel.onItemPicked(item);

        created.then(() => {
          expect(viewModel.attr('searchCriteria')).toBe('');
          done();
        });
      });

      it('does not clean search criteria if "autoClean" is turned on',
        (done) => {
          viewModel.attr('searchCriteria', 'someText');
          viewModel.attr('autoClean', false);

          viewModel.onItemPicked(item);

          created.then(() => {
            expect(viewModel.attr('searchCriteria')).toBe('someText');
            done();
          });
        });
    });

    describe('createOrGet() method', () => {
      let item;
      let model;

      beforeEach(() => {
        item = new can.Map({test: true});
        viewModel.attr('type', 'TestType');
        model = {
          id: 'testId',
        };

        let response = [[201,
          {
            test: model,
          },
        ]];
        businessModels.TestType = can.Map.extend({
          create: jasmine.createSpy()
            .and.returnValue(Promise.resolve(response)),
          root_object: 'test',
          cache: {},
        }, {});
      });

      afterEach(() => {
        businessModels.TestType = null;
      });

      it('make call to create model', () => {
        viewModel.createOrGet(item);

        expect(businessModels.TestType.create).toHaveBeenCalledWith(item);
      });

      it('creates model with empty context', () => {
        item.attr('context', 'test');
        viewModel.createOrGet(item);

        let model = businessModels.TestType.create.calls.argsFor(0)[0];
        expect(model.attr('context')).toBe(null);
      });

      it('creates model with "external" flag', () => {
        item.attr('external', false);
        viewModel.createOrGet(item);

        let model = businessModels.TestType.create.calls.argsFor(0)[0];
        expect(model.attr('external')).toBe(true);
      });

      it('returns new model if there is no value in cache', (done) => {
        viewModel.createOrGet(item)
          .then((resultModel) => {
            expect(resultModel.attr('id')).toBe('testId');
            expect(resultModel instanceof businessModels.TestType).toBe(true);
            done();
          });
      });

      it('returns cached model if there is value in cache', (done) => {
        businessModels.TestType.cache['testId'] = {cached: true};

        viewModel.createOrGet(item)
          .then((resultModel) => {
            expect(resultModel).toBe(businessModels.TestType.cache['testId']);
            done();
          });
      });

      it('calls model reify', (done) => {
        spyOn(Reify, 'reify').and.returnValue(model);
        spyOn(Reify, 'hasReify').and.returnValue(true);

        viewModel.createOrGet(item)
          .then(() => {
            expect(Reify.reify).toHaveBeenCalled();
            done();
          });
      });
    });
  });
});

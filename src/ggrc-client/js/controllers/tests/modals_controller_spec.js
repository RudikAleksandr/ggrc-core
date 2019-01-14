/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import ModalsController from '../modals/modals_controller';
import * as NotifiersUtils from '../../plugins/utils/notifiers-utils';
import Person from '../../models/business-models/person';
import * as ReifyUtils from '../../plugins/utils/reify-utils';

describe('ModalsController', function () {
  let Ctrl; // the controller under test
  let cacheBackup;

  beforeAll(function () {
    Ctrl = ModalsController;
    cacheBackup = Person.cache;
    Person.cache = {};
  });

  afterAll(function () {
    Person.cache = cacheBackup;
  });

  describe('init() method', function () {
    let ctrlInst; // fake controller instance
    let init; // the method under tests

    beforeEach(function () {
      let html = [
        '<div>',
        '  <div class="modal-body"></div>',
        '</div>',
      ].join('');

      let $el = $(html);

      ctrlInst = {
        options: new can.Map({}),
        element: $el,
        after_preload: jasmine.createSpy(),
      };

      init = Ctrl.prototype.init.bind(ctrlInst);
    });

    it('waits until current user is pre-fetched if not yet in cache',
      function () {
        let userId = GGRC.current_user.id;
        let dfdFetch = new $.Deferred();
        let fetchedUser = new can.Map({id: userId, email: 'john@doe.com'});

        spyOn(Person, 'findOne').and.returnValue(dfdFetch.promise());
        delete Person.cache[userId];

        init();

        expect(ctrlInst.after_preload).not.toHaveBeenCalled();
        dfdFetch.resolve(fetchedUser);
        expect(ctrlInst.after_preload).toHaveBeenCalled();
      }
    );

    it('waits until current user is pre-fetched if only partially in cache',
      function () {
        let userId = GGRC.current_user.id;
        let dfdRefresh = new $.Deferred();
        let fetchedUser = new can.Map({id: userId, email: 'john@doe.com'});

        let partialUser = new can.Map({
          id: userId,
          email: '', // simulate user object only partially loaded
          refresh: jasmine.createSpy().and.returnValue(dfdRefresh.promise()),
        });

        spyOn(ReifyUtils, 'reify').and.returnValue(partialUser);
        Person.cache[userId] = partialUser;

        init();

        expect(ctrlInst.after_preload).not.toHaveBeenCalled();
        dfdRefresh.resolve(fetchedUser);
        expect(ctrlInst.after_preload).toHaveBeenCalled();
      }
    );

    it('does not wait for fetching the current user if already in cache',
      function () {
        let dfdRefresh = new $.Deferred();
        let userId = GGRC.current_user.id;

        let fullUser = new can.Map({
          id: userId,
          email: 'john@doe.com',
          refresh: jasmine.createSpy().and.returnValue(dfdRefresh.promise()),
        });

        spyOn(ReifyUtils, 'reify').and.returnValue(fullUser);
        Person.cache[userId] = fullUser;

        init();

        // after_preload should have been called immediately
        expect(ctrlInst.after_preload).toHaveBeenCalled();
      }
    );
  });

  describe('save_error method', function () {
    let method;
    let foo;
    let ctrlInst;

    beforeEach(function () {
      ctrlInst = jasmine.createSpyObj(['disableEnableContentUI']);
      foo = jasmine.createSpy();
      spyOn(NotifiersUtils, 'notifier');
      spyOn(NotifiersUtils, 'notifierXHR')
        .and.returnValue(foo);
      spyOn(window, 'clearTimeout');
      method = Ctrl.prototype.save_error.bind(ctrlInst);
    });
    it('calls notifier with responseText' +
    ' if error status is not 409', function () {
      method({}, {status: 400, responseText: 'mockText'});
      expect(NotifiersUtils.notifier).toHaveBeenCalledWith('error', 'mockText');
    });
    it('clears timeout of error warning if error status is 409', function () {
      method({}, {status: 409, warningId: 999});
      expect(clearTimeout).toHaveBeenCalledWith(999);
    });
    it('calls notifier with specified text' +
    ' if error status is 409', function () {
      let error = {status: 409};
      method({}, error);
      expect(NotifiersUtils.notifierXHR)
        .toHaveBeenCalledWith('warning');
      expect(foo).toHaveBeenCalledWith(error);
    });

    it('calls "disableEnableContentUI" method', () => {
      method();
      expect(ctrlInst.disableEnableContentUI).toHaveBeenCalledWith(false);
    });
  });

  describe('reset_form() method', () => {
    let ctrlInst;
    let method;
    let instance;
    let setFieldsCb;

    beforeEach(function () {
      instance = new can.Map();
      ctrlInst = {
        wasDestroyed: jasmine.createSpy('wasDestroyed'),
        element: {
          trigger: jasmine.createSpy('trigger'),
        },
        options: {
          new_object_form: 'mock1',
          object_params: 'mock2',
        },
      };
      method = Ctrl.prototype.reset_form.bind(ctrlInst);
    });

    describe('if modal was not destroyed', () => {
      beforeEach(() => {
        ctrlInst.wasDestroyed.and.returnValue(false);
      });

      it('calls setFieldsCb() if it is function', (done) => {
        setFieldsCb = function () {
          done();
        };

        method(instance, setFieldsCb);
      });

      it('triggers loaded event', () => {
        method(instance);

        expect(ctrlInst.element.trigger).toHaveBeenCalledWith('loaded');
      });

      it('calls form_preload of instance if it is defined', () => {
        instance.form_preload = jasmine.createSpy();

        method(instance);

        expect(instance.form_preload).toHaveBeenCalledWith(
          ctrlInst.options.new_object_form,
          ctrlInst.options.object_params
        );
      });

      describe('if form_preload returns deferred', () => {
        let formPreloadDfd;

        beforeEach(() => {
          formPreloadDfd = $.Deferred();
          instance.backup = jasmine.createSpy('backup');
          instance.form_preload = jasmine.createSpy('form_preload').and
            .returnValue(formPreloadDfd);
        });

        it('calls instance.backup() when resolved', (done) => {
          method(instance);

          formPreloadDfd.done(() => {
            expect(instance.backup).toHaveBeenCalled();
            done();
          });

          formPreloadDfd.resolve();
        });

        it('returns formPreloadDfd', () => {
          expect(method(instance)).toBe(formPreloadDfd);
        });
      });

      it('returns resolved deferred if form_preload is not defined', (done) => {
        method(instance).done(() => {
          done();
        });
      });
    });

    it('sets new can.Map object into _transient ' +
    'if it is not defined', () => {
      instance.attr('_transient', undefined);

      method(instance);

      expect(instance.attr('_transient') instanceof can.Map).toBe(true);
      expect(instance.attr('_transient').serialize()).toEqual({});
    });

    it('does not change _transient if it is  defined', () => {
      let transient = 123;
      instance.attr('_transient', transient);

      method(instance);

      expect(instance.attr('_transient')).toBe(transient);
    });
  });

  describe('new_instance method', () => {
    let ctrlInst;
    let method;
    let newInstance;
    let resetFormDfd;

    beforeEach(function () {
      newInstance = new can.Map();
      resetFormDfd = $.Deferred();
      ctrlInst = {
        prepareInstance: jasmine.createSpy('prepareInstance').and
          .returnValue(newInstance),
        reset_form: jasmine.createSpy('reset_form').and
          .returnValue(resetFormDfd),
        proxy: jasmine.createSpy('proxy'),
        restore_ui_status: jasmine.createSpy('restore_ui_status'),
        options: new can.Map(),
      };
      method = Ctrl.prototype.new_instance.bind(ctrlInst);
    });

    it('calls reset_form() with new prepared instance', (done) => {
      resetFormDfd.resolve();

      method();

      expect(ctrlInst.reset_form).toHaveBeenCalledWith(
        newInstance, jasmine.any(Function));
      done();
    });

    it('assigns new prepared instance into controller options ' +
    'after reset_form()', (done) => {
      method();

      resetFormDfd.done(() => {
        expect(ctrlInst.options.attr('instance')).toBe(newInstance);
        done();
      });

      resetFormDfd.resolve();
    });

    it('calls proxy() with "apply_object_params"', (done) => {
      resetFormDfd.resolve();
      method();

      expect(ctrlInst.proxy).toHaveBeenCalledWith('apply_object_params');
      done();
    });

    it('calls proxy() with "serialize_form"', (done) => {
      resetFormDfd.resolve();
      method();

      expect(ctrlInst.proxy).toHaveBeenCalledWith('serialize_form');
      done();
    });

    it('calls proxy() with "autocomplete"', (done) => {
      resetFormDfd.resolve();
      method();

      expect(ctrlInst.proxy).toHaveBeenCalledWith('autocomplete');
      done();
    });
  });
});

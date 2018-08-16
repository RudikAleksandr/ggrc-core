/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  makeFakeInstance,
} from '../spec_helpers';
import DisplayPrefs from '../../js/models/local-storage/display-prefs';
import * as LocalStorage from '../../js/plugins/utils/local-storage-utils';

describe('display prefs model', function () {
  let display_prefs;
  let exp;
  beforeAll(function () {
    display_prefs = makeFakeInstance({model: DisplayPrefs})();
    exp = DisplayPrefs.exports;
  });

  afterEach(function () {
    display_prefs.removeAttr(window.location.pathname);
    display_prefs.isNew() || display_prefs.destroy();
  });

  describe('#init', function ( ) {
    it('sets autoupdate to true by default', function () {
      expect(display_prefs.autoupdate).toBe(true);
    });
  });

  describe('low level accessors', function () {
    beforeEach(function () {
      display_prefs.attr('foo', 'bar');
    });

    afterEach(function () {
      display_prefs.removeAttr('foo');
      display_prefs.removeAttr('baz');
    });

    describe('#makeObject', function () {

      it('returns the model itself with no args', function () {
        expect(display_prefs.makeObject()).toBe(display_prefs);
      });

      it('returns an empty can.Observe when the key does not resolve to an Observable', function () {
        expect(display_prefs.makeObject('foo')).not.toBe('bar');
        let newval = display_prefs.makeObject('baz');
        expect(newval instanceof can.Observe).toBeTruthy();
        expect(newval.serialize()).toEqual({});
      });

      it('makes a nested path of can.Observes when the key has multiple levels', function () {
        display_prefs.makeObject('baz', 'quux');
        expect(display_prefs.baz.quux instanceof can.Observe).toBeTruthy();
      });
    });

    describe('#getObject', function () {
      it('returns a set value whether or not the value is an Observe', function () {
        expect(display_prefs.getObject('foo')).toBe('bar');
        display_prefs.makeObject('baz', 'quux');
        expect(display_prefs.getObject('baz').serialize()).toEqual({quux: {}});
      });

      it('returns undefined when the key is not found', function () {
        expect(display_prefs.getObject('xyzzy')).not.toBeDefined();
      });
    });
  });

  describe('#setCollapsed', function () {
    afterEach(function () {
      display_prefs.removeAttr(exp.COLLAPSE);
      display_prefs.removeAttr(exp.path);
    });

    it('sets the collapse value for a widget', function () {
      display_prefs.setCollapsed('this arg is ignored', 'foo', true);

      expect(display_prefs.attr([exp.path, exp.COLLAPSE, 'foo'].join('.'))).toBe(true);
    });
  });

  function getSpecs(func, token, fooValue, barValue) {
    let fooMatcher = typeof fooValue === 'object' ? 'toEqual' : 'toBe';
    let barMatcher = typeof barValue === 'object' ? 'toEqual' : 'toBe';

    return function () {
      function getTest() {
        let fooActual = display_prefs[func]('unit_test', 'foo');
        let barActual = display_prefs[func]('unit_test', 'bar');

        expect(fooActual.serialize ? fooActual.serialize() : fooActual)[fooMatcher](fooValue);
        expect(barActual.serialize ? barActual.serialize() : barActual)[barMatcher](barValue);
      }

      let exp_token;
      beforeEach(function () {
        exp_token = exp[token]; // late binding b/c not available when describe block is created
      });

      // TODO: figure out why these fail, error is "can.Map: Object does not exist thrown"
      describe('when set for a page', function () {
        beforeEach(function () {
          display_prefs.makeObject(exp.path, exp_token).attr('foo', fooValue);
          display_prefs.makeObject(exp.path, exp_token).attr('bar', barValue);
        });
        afterEach(function () {
          display_prefs.removeAttr(exp.path);
        });

        it('returns the value set for the page', getTest);
      });

      describe('when not set for a page', function () {
        beforeEach(function () {
          display_prefs.makeObject(exp_token, 'unit_test').attr('foo', fooValue);
          display_prefs.makeObject(exp_token, 'unit_test').attr('bar', barValue);
        });
        afterEach(function () {
          display_prefs.removeAttr(exp.path);
          display_prefs.removeAttr(exp_token);
        });

        it('returns the value set for the page type default', getTest);

        it('sets the default value as the page value', function () {
          display_prefs[func]('unit_test', 'foo');
          let fooActual = display_prefs.attr([exp.path, exp_token, 'foo'].join('.'));
          expect(fooActual.serialize ? fooActual.serialize() : fooActual)[fooMatcher](fooValue);
        });
      });
    };
  }

  describe('#getCollapsed', getSpecs('getCollapsed', 'COLLAPSE', true, false));

  function setSpecs(func, token, fooValue, barValue) {
    return function () {
      let expToken;
      beforeEach(function () {
        expToken = exp[token];
      });
      afterEach(function () {
        display_prefs.removeAttr(expToken);
        display_prefs.removeAttr(exp.path);
      });


      it('sets the value for a widget', function () {
        display_prefs[func]('this arg is ignored', 'foo', fooValue);
        let fooActual = display_prefs.attr([exp.path, expToken, 'foo'].join('.'));
        expect(fooActual.serialize ? fooActual.serialize() : fooActual).toEqual(fooValue);
      });

      it('sets all values as a collection', function () {
        display_prefs[func]('this arg is ignored', {foo: fooValue, bar: barValue});
        let fooActual = display_prefs.attr([exp.path, expToken, 'foo'].join('.'));
        let barActual = display_prefs.attr([exp.path, expToken, 'bar'].join('.'));
        expect(fooActual.serialize ? fooActual.serialize() : fooActual).toEqual(fooValue);
        expect(barActual.serialize ? barActual.serialize() : barActual).toEqual(barValue);
      });
    };
  }

  describe('#getAll', function () {
    let dpNoversion;
    let dp2Outdated;
    let dp3Current;

    beforeEach(function () {
      const instanceCreator = makeFakeInstance({
        model: DisplayPrefs
      });

      dpNoversion = instanceCreator();
      dp2Outdated = instanceCreator({version: 1});
      dp3Current = instanceCreator({version: DisplayPrefs.version});

      spyOn(LocalStorage, 'getAll').and.returnValue([dpNoversion, dp2Outdated, dp3Current]);
      spyOn(LocalStorage, 'remove');
    });
    it('deletes any prefs that do not have a version set', function () {
      let dps = DisplayPrefs.getAll();

      expect(dps).not.toContain(dpNoversion);
      expect(LocalStorage.remove).toHaveBeenCalled();
    });
    it('deletes any prefs that have an out of date version', function () {
      let dps = DisplayPrefs.getAll();

      expect(dps).not.toContain(dp2Outdated);
      expect(LocalStorage.remove).toHaveBeenCalled();
    });
  });
});

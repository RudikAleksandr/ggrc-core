/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as issueTrackerUtils from '../../../plugins/utils/issue-tracker-utils';
import * as queryApiUtils from '../../../plugins/utils/query-api-utils';
import {makeFakeInstance} from '../../../../js_specs/spec_helpers';
import * as CurrentPageUtils from '../../../plugins/utils/current-page-utils';
import * as Reify from '../../../plugins/utils/reify-utils';
import assessmentIssueTracker from '../assessment-issue-tracker';
import Assessment from '../../business-models/assessment';

describe('assessmentIssueTracker mixin', () => {
  let Mixin;
  let audit;

  beforeAll(function () {
    GGRC.ISSUE_TRACKER_ENABLED = true;
    Mixin = assessmentIssueTracker;

    audit = new can.Map({
      id: 123,
      title: 'Audit',
      type: 'Audit',
    });
  });

  describe('"after:init" event', () => {
    const asmtProto = Assessment.prototype;

    it('should call "initIssueTrackerForAssessment" for audit', () => {
      let dfd = new can.Deferred();
      dfd.resolve(audit);
      spyOn(Reify, 'reify');
      spyOn(asmtProto, 'ensureParentAudit').and.returnValue(dfd);
      spyOn(asmtProto, 'initIssueTrackerForAssessment');
      makeFakeInstance({model: Assessment})({type: 'Assessment'});
      expect(asmtProto.initIssueTrackerForAssessment).toHaveBeenCalled();
    });

    it('should call "trackAuditUpdates" method', (done) => {
      let dfd = can.Deferred();
      spyOn(asmtProto, 'initIssueTracker').and.returnValue(dfd);
      spyOn(asmtProto, 'trackAuditUpdates');
      makeFakeInstance({model: Assessment})({type: 'Assessment'});
      dfd.then(() => {
        expect(asmtProto.trackAuditUpdates).toHaveBeenCalled();
        done();
      });

      dfd.resolve();
    });
  });

  describe('ensureParentAudit() method: ', function () {
    let method;
    let assessment;

    beforeEach(function () {
      assessment = new can.Map({
        audit,
      });
      method = Mixin.prototype.ensureParentAudit;
    });

    it('should resolve to assigned audit property', function (done) {
      method.apply(assessment).then((resolvedAudit) => {
        expect(resolvedAudit).toEqual(audit);
        done();
      });
    });

    it('should resolve to audit from page instance', function (done) {
      spyOn(CurrentPageUtils, 'getPageInstance')
        .and.returnValue(audit);

      assessment.isNew = () => true;
      assessment.attr('audit', null);

      method.apply(assessment).then((resolvedAudit) => {
        expect(resolvedAudit).toEqual(audit);
        done();
      });
    });

    it('should fetch audit from server if not assigned and not in' +
       ' page instance', function (done) {
      spyOn(CurrentPageUtils, 'getPageInstance')
        .and.returnValue({ });

      let dfd = new can.Deferred();
      dfd.resolve(_.set({}, 'Audit.values[0]', audit));
      spyOn(queryApiUtils, 'batchRequests').and.returnValue(dfd);

      assessment.attr('audit', null);
      assessment.isNew = () => false;

      method.apply(assessment).then((resolvedAudit) => {
        expect(queryApiUtils.batchRequests).toHaveBeenCalled();
        expect(resolvedAudit).toEqual(audit);
        done();
      });
    });
  });

  describe('initIssueTrackerForAssessment() method [new assessment]', () => {
    let method;
    let fakeAssessment;
    let fakeAudit;

    beforeAll(() => {
      method = Mixin.prototype.initIssueTrackerForAssessment;
    });

    beforeEach(() => {
      fakeAudit = new can.Map({
        id: 1,
        type: 'Audit',
        issue_tracker: {
          enabled: true,
        },
      });
      fakeAssessment = new can.Map({
        audit: fakeAudit,
        issue_tracker: {
          enabled: null,
        },
        isNew() {
          return !this.id;
        },
      });

      spyOn(issueTrackerUtils, 'initIssueTrackerObject');
    });

    it('should show ITR if enabled in audit',
      () => {
        fakeAssessment.attr('audit.issue_tracker.enabled', true);
        method.apply(fakeAssessment);

        const itrShowControls = issueTrackerUtils.initIssueTrackerObject
          .calls.mostRecent().args[2];
        expect(itrShowControls).toEqual(true); // show issue tracker controls
      });

    it('should hide ITR if disabled in audit',
      () => {
        fakeAssessment.attr('audit.issue_tracker.enabled', false);
        method.apply(fakeAssessment);

        const itrShowControls = issueTrackerUtils.initIssueTrackerObject
          .calls.mostRecent().args[2];
        expect(itrShowControls).toEqual(false); // show issue tracker controls
      });

    it('should enable ITR if enabled in audit', () => {
      fakeAssessment.attr('audit.issue_tracker.enabled', true);
      method.apply(fakeAssessment);

      const itrConfig = issueTrackerUtils.initIssueTrackerObject
        .calls.mostRecent().args[1];

      expect(itrConfig.enabled).toEqual(true); // turn on by default for assessment
    });

    it('should disable ITR if disable in audit', () => {
      fakeAssessment.attr('audit.issue_tracker.enabled', false);
      method.apply(fakeAssessment);

      const itrConfig = issueTrackerUtils.initIssueTrackerObject
        .calls.mostRecent().args[1];

      expect(itrConfig.enabled).toEqual(false); // turn on by default for assessment
    });
  });

  describe('initIssueTrackerForAssessment() method [existing assessment]',
    () => {
      let method;
      let fakeAssessment;
      let fakeAudit;

      beforeAll(() => {
        method = Mixin.prototype.initIssueTrackerForAssessment;
      });

      beforeEach(() => {
        fakeAudit = new can.Map({
          id: 1,
          type: 'Audit',
          issue_tracker: {
            enabled: true,
          },
        });
        fakeAssessment = new can.Map({
          id: 123,
          audit: fakeAudit,
          issue_tracker: {
            enabled: null,
          },
          isNew() {
            return !this.id;
          },
        });

        spyOn(issueTrackerUtils, 'initIssueTrackerObject');
      });

      it('should hide ITR if disabled in audit and enabled on instance',
        () => {
          let itrShowControls;
          fakeAssessment.attr('issue_tracker.enabled', true);

          // disabled in Audit
          fakeAssessment.attr('audit.issue_tracker.enabled', false);
          method.apply(fakeAssessment);
          itrShowControls = issueTrackerUtils.initIssueTrackerObject
            .calls.mostRecent().args[2];
          expect(itrShowControls).toEqual(false);
        }
      );

      it('should hide ITR if disabled on instance and in audit', () => {
        let itrShowControls;
        fakeAssessment.attr('issue_tracker.enabled', false);

        // disabled in Audit
        fakeAssessment.attr('audit.issue_tracker.enabled', false);
        method.apply(fakeAssessment);
        itrShowControls = issueTrackerUtils.initIssueTrackerObject
          .calls.mostRecent().args[2];
        expect(itrShowControls).toEqual(false);
      });

      it('should show ITR if enabled on instance and in audit', () => {
        let itrShowControls;
        fakeAssessment.attr('issue_tracker.enabled', true);

        // enabled in Audit
        fakeAssessment.attr('audit.issue_tracker.enabled', true);
        method.apply(fakeAssessment);
        itrShowControls = issueTrackerUtils.initIssueTrackerObject
          .calls.mostRecent().args[2];
        expect(itrShowControls).toEqual(true);
      });

      it('should show ITR if disabled on instance and enabled in audit',
        () => {
          let itrShowControls;
          fakeAssessment.attr('issue_tracker.enabled', false);

          // enabled in Audit
          fakeAssessment.attr('audit.issue_tracker.enabled', true);
          method.apply(fakeAssessment);
          itrShowControls = issueTrackerUtils.initIssueTrackerObject
            .calls.mostRecent().args[2];
          expect(itrShowControls).toEqual(true);
        }
      );
    }
  );
});

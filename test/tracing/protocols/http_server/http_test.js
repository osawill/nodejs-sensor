'use strict';

var expect = require('chai').expect;

var cls = require('../../../../src/tracing/cls');
var supportedVersion = require('../../../../src/tracing/index').supportedVersion;
var config = require('../../../config');
var utils = require('../../../utils');

describe('tracing/http server', function() {
  if (!supportedVersion(process.versions.node)) {
    return;
  }

  var agentControls = require('../../../apps/agentStubControls');
  var Controls = require('./controls');

  this.timeout(config.getTestTimeout());

  agentControls.registerTestHooks({
    extraHeaders: ['UsEr-AgEnt'],
    secretsList: ['secret', 'Enigma', 'CIPHER']
  });

  var controls = new Controls({
    agentControls: agentControls
  });
  controls.registerTestHooks();

  it('must report additional headers when requested', function() {
    var userAgent = 'medivhTheTeleporter';
    return controls
      .sendRequest({
        method: 'GET',
        path: '/',
        headers: {
          'User-Agent': userAgent
        }
      })
      .then(function() {
        return utils.retry(function() {
          return agentControls.getSpans().then(function(spans) {
            utils.expectOneMatching(spans, function(span) {
              expect(span.n).to.equal('node.http.server');
              expect(span.k).to.equal(cls.ENTRY);
              expect(span.data.http.header['user-agent']).to.equal(userAgent);
            });
          });
        });
      });
  });

  it('must remove secrets from query parameters', function() {
    return controls
      .sendRequest({
        method: 'GET',
        path: '/?param1=value1&TheSecreT=classified&param2=value2&enIgmAtic=occult&param3=value4&cipher=veiled'
      })
      .then(function() {
        return utils.retry(function() {
          return agentControls.getSpans().then(function(spans) {
            utils.expectOneMatching(spans, function(span) {
              expect(span.n).to.equal('node.http.server');
              expect(span.k).to.equal(cls.ENTRY);
              expect(span.data.http.params).to.equal('param1=value1&param2=value2&param3=value4');
            });
          });
        });
      });
  });
});

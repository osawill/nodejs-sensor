'use strict';

var stackTrace = require('../util/stackTrace');
var agentOpts = require('../agent/opts');
var pidStore = require('../pidStore');
var leftPad = require('./leftPad');
var logger;
logger = require('../logger').getLogger('tracing/util', function(newLogger) {
  logger = newLogger;
});

var defaultStackTraceLength = 10;
var stackTraceLength = 0;

exports.init = function(config) {
  if (config.tracing.stackTraceLength != null) {
    if (typeof config.tracing.stackTraceLength === 'number') {
      stackTraceLength = normalizeNumericalStackTraceLength(config.tracing.stackTraceLength);
    } else if (typeof config.tracing.stackTraceLength === 'string') {
      stackTraceLength = parseInt(config.tracing.stackTraceLength, 10);
      if (!isNaN(stackTraceLength)) {
        stackTraceLength = normalizeNumericalStackTraceLength(stackTraceLength);
      } else {
        logger.warn(
          'The value of config.tracing.stackTraceLength ("%s") has type string and cannot be parsed to a numerical ' +
          'value. Assuming the default stack trace length %s.',
          config.tracing.stackTraceLength,
          defaultStackTraceLength
        );
        stackTraceLength = defaultStackTraceLength;
      }
    } else {
      logger.warn(
        'The value of config.tracing.stackTraceLength has the non-supported type %s (the value is "%s"). Assuming ' +
        'the default stack trace length %s.',
        (typeof config.tracing.stackTraceLength),
        config.tracing.stackTraceLength,
        defaultStackTraceLength
      );
      stackTraceLength = defaultStackTraceLength;
    }
  } else {
    stackTraceLength = defaultStackTraceLength;
  }
};

function normalizeNumericalStackTraceLength(numericalLength) {
  // just in case folks provide non-integral numbers or negative numbers
  var normalized = Math.abs(Math.round(numericalLength));
  if (normalized !== numericalLength) {
    logger.warn(
      'Normalized the provided value of config.tracing.stackTraceLength ("%s") to %s.',
      numericalLength,
      normalized
    );
  }
  return normalized;
}

exports.getFrom = function getFrom() {
  return {
    e: String(pidStore.pid),
    h: agentOpts.agentUuid
  };
};

exports.getStackTrace = function getStackTrace(referenceFunction) {
  return stackTrace.captureStackTrace(stackTraceLength, referenceFunction);
};

exports.generateRandomTraceId = function generateRandomTraceId() {
  // Note: As soon as all Instana tracers support 128bit trace IDs we can generate a string of length 32 here.
  return generateRandomId(16);
};

exports.generateRandomSpanId = function generateRandomSpanId() {
  return generateRandomId(16);
};

function generateRandomId(length) {
  return leftPad(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(length), length);
}

exports.getErrorDetails = function getErrorDetails(err) {
  if (err == null) {
    return undefined;
  }
  return String(err.stack || err.message || err).substring(0, 500);
};

exports.shortenDatabaseStatement = function shortenDatabaseStatement(stmt) {
  if (stmt == null || typeof stmt !== 'string') {
    return undefined;
  }

  return stmt.substring(0, 4000);
};

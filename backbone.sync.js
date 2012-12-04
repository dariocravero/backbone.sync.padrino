/**
 * backbone.sync.padrino.js v1.0.0
 * Backbone's synchronization layer replacement ready to work with Padrino's Ruby web framework
 * Copyright 2012 Darío Cravero (dario@uxtemple.com | @dariocravero)
 * This library may be freely distributed under the MIT license.
 */

(function(window) {
var Backbone = window.Backbone,
  _ = window._
  $ = window.$;

Backbone.emulateJSON = true;

Backbone.sync = function(method, model, options) {
  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'delete': 'DELETE',
    'read'  : 'GET'
  },
  // Helper function to get a value from a Backbone object as a property
  // or as a function.
  getValue = function(object, prop) {
    if (!(object && object[prop])) return null;
    return _.isFunction(object[prop]) ? object[prop]() : object[prop];
  },
  // Throw an error when a URL is needed, and none is supplied.
  urlError = function() {
    throw new Error('A "url" property or function must be specified');
  }

  var type = methodMap[method];

  // Default JSON-request options.
  var params = {type: type, dataType: 'json'};

  // Ensure that we have a URL.
  if (!options.url) {
    params.url = getValue(model, 'url') || urlError();
  }

  // Ensure that we have the appropriate request data.
  if (model && (method == 'create' || method == 'update')) {
    params.contentType = 'application/json';
    if (options.data && method == 'update') {
      // Always send the id on updates
      _.extend(options.data, {id: model.id});
    } else {
      // If it's a create, we need all the data available -otherwise the model on the back may fail.
      params.data = model.toJSON();
      delete options.data;
    }
  }

  // For older servers, emulate JSON by encoding the request into an HTML-form.
  if (Backbone.emulateJSON) {
    params.contentType = 'application/x-www-form-urlencoded';
    params.data = params.data ? params.data : {};
  }

  // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
  // And an `X-HTTP-Method-Override` header.
  if (Backbone.emulateHTTP) {
    if (type === 'PUT' || type === 'DELETE') {
      if (Backbone.emulateJSON) params.data._method = type;
      params.type = 'POST';
      params.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
      };
    }
  }

  // Don't process data on a non-GET request.
  if (params.type !== 'GET' && !Backbone.emulateJSON) {
    params.processData = false;
  }

  // Make the request.
  return $.ajax(_.extend(params, options));
};
})(this);

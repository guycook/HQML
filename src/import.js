/**
 * Object that handles import requirements for a single QML file or component.
 *
 * @constructor
 * @param {array} list Array of import descriptions.
 * @param {object} context The object to which imported objects will be
 *   assigned.
 * @param {function()} onFinished Function to run when imports have all
 *   completed successfully.
 */
var Import = function(list, context, onFinished) {
  this.list = list;
  this.context = context;
  this.onFinished = onFinished;
  this.completeCount = 0;

  if(!this.list || !this.list.length && this.onFinished) {
    this.onFinished();
  }
};

/**
 * Called internally whenever an import successfully completes. Will fire
 * this.onFinished when all imports have completed.
 */
Import.prototype.complete = function() {
  this.completeCount++;
  if(this.completeCount === this.list.length) {
    if(this.onFinished) {
      this.onFinished();
    }
  }
};

/**
 * Begin the import process and run onFinished when complete
 */
Import.prototype.applyAll = function() {
  // TODO: Component and folder imports
  var jsImports = this.list.filter(function(i) {
    return i.path && i.path.substr(-3) === '.js';
  });

  this.completeCount = this.list.length - jsImports.length; // TODO: Remove

  jsImports.forEach(this.importJs.bind(this));
};

/**
 * Import a single javascript file into an object on this.context
 *
 * This function works by:
 * - Get .js file contents via ajax request
 * - Create an iframe and record the state of the global window object
 * - Run the retrieved js file in the context of the iframe
 * - Find objects that are new on 'window' or have been changed and
 *   refer to them by getter/setter on an export object
 * - Add the export object to the import context under the config.as name
 *
 * There are two main drawbacks to this approach - the memory overhead
 * of 1 iframe per non-library import and that certain varnames are not
 * assignable (eg. 'document') but it does emulate QML functionality in
 * all other ways without having to parse the js file.
 *
 * @param {object} config Javascript import configuration.
 * @config {string} path The path to fetch the javascript file from, can
 *   be absolute or relative to the current QML file.
 * @config {string} as The name to give the export object in the this.context.
 */
Import.prototype.importJs = function(config) {
  var __import = this;
  superagent(config.path, function(res) {
    // TODO: Find .pragmas then strip them out
    // TODO: Find .imports and process before rest of file

    var frame = document.createElement('iframe');
    frame.style.display = 'none';
    frame.onload = function() {
      var frameDocument = frame.contentWindow.document;

      var preScript = frameDocument.createElement('script');
      preScript.innerHTML =
        'var oldWindow = {};' +
        'for(var prop in window) {' +
        '  if(window.hasOwnProperty(prop)) {' +
        '    oldWindow[prop] = window[prop];' +
        '  }' +
        '}';
      frameDocument.body.appendChild(preScript);

      var postScript = frameDocument.createElement('script');
      // TODO: Do exported get/set need to be observables?
      postScript.innerHTML =
        res.text +
        '\n;\n' +
        'var __export = {};' +
        'for(var prop in window) {' +
        '  if(window.hasOwnProperty(prop)) {' +
        '    if((!(prop in oldWindow) || oldWindow[prop] !== window[prop]) && prop !== "__export") {' +
        '      (function(__p) {' +
        '        Object.defineProperty(__export, __p, {' +
        '          enumerable: true,' +
        '          get: function() { return window[__p]; },' +
        '          set: function(v) { window[__p] = v; }' +
        '        });' +
        '      })(prop);' +
        '    }' +
        '  }' +
        '}';
      frameDocument.body.appendChild(postScript);

      __import.context[config.as] = frame.contentWindow.__export;
      __import.complete();
    };

    document.body.appendChild(frame);
  });
};

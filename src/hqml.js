var HQML = window.HQML || (window.HQML = {});
HQML.context = {};
var QObjects = {};

var initQueue = [];

QObjects.create = function(config) {
  var type = config.type,
      attr = config.attributes,
      children = config.children || [];

  if(!(type in QObjects)) {
    throw new TypeError(type + ' is not a valid QML Object');
  }

  // Inherit or create new
  var obj;
  if(QObjects[type].inherits) {
    obj = QObjects.create({
      type: QObjects[type].inherits,
      attributes: attr
    });
    for(var func in QObjects[type]) {
      obj[func] = QObjects[type][func];
    }
  }
  else {
    obj = Object.create(QObjects[type]);
  }

  // Build implementation of standard properties
  QObjects.addProperties(obj, obj, QObjects[type].defaultProperties, attr);

  // Add read-only properties
  for(var prop in QObjects[type].readOnly) {
    Object.defineProperty(obj, prop, {
      get: ko.computed({
        read: QObjects[type].readOnly[prop],
        owner: obj,
        deferEvaluation: true
      })
    });
  }

  // Add id and object to global context
  // TODO: This shouldn't be in the inheritance path - move to else block above?
  var id = getProperty(attr, 'id', 'name', 'value');
  if(id) {
    obj.id = id;
    HQML.context[id] = obj;
  }

  // Make 'update' a self-observer
  // TODO: Just implement this same as other QML expressions
  if(typeof QObjects[type].update === 'function') {
    obj.update = ko.computed({
      read: QObjects[type].update,
      owner: obj,
      deferEvaluation: true
    });
  }

  // Create children, attach and put at front of init queue
  obj.children = [];
  for(var i = 0; i < children.length; i++) {
    var child = QObjects.create(children[i]);
    child.parent = obj;
    obj.children.push(child);
  }
  initQueue = obj.children.concat(initQueue);

  return obj;
};

QObjects.addProperties = function(context, obj, propList, attr, prefix) {
  if(!prefix) prefix = '';

  // Add observable properties to object
  // Public access by name, private implementer on _
  if(!obj._) {
    Object.defineProperty(obj, '_', { value: {} });
  }

  for(var prop in propList) {
    if(propList[prop] && typeof propList[prop] === 'object' && typeof propList[prop].read !== 'function') {
      // Created nested object for QML properties with '.' in the name
      obj[prop] = {};
      QObjects.addProperties(context, obj[prop], propList[prop], attr, prefix + prop + '.');
      continue;
    }

    // Create a computed if attribute type is an expression
    var isExpression = getProperty(attr, prefix + prop, 'name', 'type') === 'Expression',
        value = getProperty(attr, prefix + prop, 'name', 'value');
    if(isExpression) {
      QObjects.addExpressionProperty(obj, prop, value, context);
    }
    else {
      // Does this property have special read/write semantics?
      // TODO: Somehow combine this with expressions above
      if(propList[prop] && typeof propList[prop] === 'object' && typeof propList[prop].read === 'function') {
        obj._[prop] = ko.computed({
          read: propList[prop].read,
          write: propList[prop].write,
          owner: obj,
          deferEvaluation: true
        });
        if(value !== null) {
          obj._[prop](value);
        }
      }
      else {
        obj._[prop] = ko.observable(value !== null ? value : propList[prop]);
      }
    }

    Object.defineProperty(obj, prop, {
      enumerable: true,
      configurable: true,
      get: obj._[prop],
      set: obj._[prop]
    });
  }
};

QObjects.addExpressionProperty = function(obj, prop, expr, context) {
  obj._[prop] = ko.computed({
    // Provide the owning object as both 'this' and make its properties available through 'with'
    read: (new Function("_this", "_context", "with(_context){with(_this){return " + expr + "}}")).bind(context, context, HQML.context),
    // Write function kills this computed and replaces it with an observable
    // TODO: Adding computed expressions at runtime must be done via Qt.binding
    write: function(v) {
      var oldExpr = this._[prop];
      this._[prop] = ko.observable(v);
      Object.defineProperty(this, prop, {
        get: this._[prop],
        set: this._[prop]
      });

      // Use the old computed to force subscribers to rebind on new observable
      oldExpr.notifySubscribers(v);
      oldExpr.dispose();
    },
    owner: obj,
    deferEvaluation: true
  });
};

// Exports
HQML.load = function(ast) {
  // TODO: Move root definition into module, use init params for dimensions/name
  var root = {
    init: function() {
      // TODO: User definable name, width, height
      var stage = new Kinetic.Stage({
        container: 'container',
        width: 800,
        height: 600
      });
      this._ = { kNode: new Kinetic.Layer() };
      stage.add(this._.kNode);
    },
    draw: function() {
      this._.kNode.batchDraw();
    }
  };

  root.init();

  ast.objects.forEach(function(obj) {
      var thisObj = QObjects.create(obj);

      thisObj.parent = root;
      initQueue.unshift(thisObj);
      // TODO: init/parent assignment should be done by QObjects.create at end of inheritance chain
  });

  for(var i = 0; i < initQueue.length; i++) {
    initQueue[i].init();
  }
};

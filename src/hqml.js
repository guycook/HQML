// TODO: Generic version, more useful returns
// TODO: Put inside module once tidied up
var getProperty = function(arr, key, keyField, valueField) {
  for(var i = 0; i < arr.length; i++) {
    if(arr[i][keyField] === key) {
      return arr[i][valueField];
    }
  }
  return null;
};

(function(window, document, undefined) {
  "use strict";

  var HQML = window.HQML || (window.HQML = {});
  HQML.context = {};

  var initQueue = [];

  var QObjects = {};

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
    var id = getProperty(attr, 'id', 'name', 'value');
    if(id) {
      obj.id = id;
      HQML.context[id] = obj;
      // TODO: Why is this being called twice??
      //console.log('setting id ' + id);
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
  }

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

      // TODO: When building AST, make bare references point to this /
      //       alternately combine AST in this stage to make sure references are valid

      // Create a computed if attribute type is an expression
      var isExpression = getProperty(attr, prefix + prop, 'name', 'type') === 'Expression',
          value = getProperty(attr, prefix + prop, 'name', 'value');
      if(isExpression) {
        (function(propName) {
          obj._[propName] = ko.computed({
            // Provide the owning object as both 'this' and make its properties available through 'with'
            read: (new Function("_this", "_context", "with(_context){with(_this){return " + value + "}}")).bind(context, context, HQML.context),
            // Write function kills this computed and replaces it with an observable
            // TODO: Adding computed expressions at runtime must be done via Qt.binding
            write: function(v) {
              var oldExpr = this._[propName];
              this._[propName] = ko.observable(v);
              Object.defineProperty(this, propName, {
                get: this._[propName],
                set: this._[propName]
              });

              // Use the old computed to force subscribers to rebind on new observable
              oldExpr.notifySubscribers(v);
              oldExpr.dispose();
            },
            owner: obj,
            deferEvaluation: true
          });
        })(prop);
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
  }

  // ---------------------- // TODO: Complete implementation / Document
  // QML Item
  QObjects.Item = {
    // TODO: Init function defining a layer, update which can move/resize it
  }

  Object.defineProperties(QObjects.Item, {
    defaultProperties: {
      value: {
        x: 0,
        y: 0,
        width: 800, // TODO: Use canvas dimensions
        height: 600
      }
    },
    readOnly: {
      value: {
        top: function() { return this.y; },
        verticalCenter: function() { return this.y + Math.floor(this.height * 0.5); },
        bottom: function() { return this.y + this.height; },
        left: function() { return this.x; },
        horizontalCenter: function() { return this.x + Math.floor(this.width * 0.5); },
        right: function() { return this.x + this.width; },
        baseline: function() { return this.y; }
      }
    }
  });

  // ---------------------- // TODO: Complete implementation / Document
  // QML Rectangle
  QObjects.Rectangle = {
    init: function() {
      // TODO: Should this be group or layer? infer based on anim etc?
      this._.kNode = new Kinetic.Group();
      this._.kRect = new Kinetic.Rect();
      this._.kNode.add(this._.kRect);
      try {
        this.parent._.kNode.add(this._.kNode);
      }
      catch (e) {
        // Throw 'Rectangle cannot be child of parent.type'
      }
      this.update();
    },
    update: function() {
      // TODO: Maybe QObjects.create should automatically create subscribers for simple props?
      this._.kNode.setX(this.x + this.border.width / 2);
      this._.kNode.setY(this.y + this.border.width / 2);

      this._.kRect.setWidth(this.width - this.border.width);
      this._.kRect.setHeight(this.height - this.border.width);
      this._.kRect.setFill(this.color);
      this._.kRect.setCornerRadius(this.radius - this.border.width / 4);

      var stroke = !!this.border.width;
      this._.kRect.setStrokeEnabled(stroke);
      if(stroke) {
        this._.kRect.setStrokeWidth(this.border.width);
        this._.kRect.setStroke(this.border.color);
      }

      this.draw();
    },
    draw: function() {
      this.parent.draw();
    }
  }

  Object.defineProperties(QObjects.Rectangle, {
    inherits: {
      value: 'Item'
    },
    defaultProperties: {
      value: {
        color: 'white',
        radius: 0,
        border: {
          color: 'black',
          width: 0
        },
        gradient: null
      }
    }
  });

  // ---------------------- // TODO: Complete implementation / Document
  // QML Text
  QObjects.Text = {
    init: function() {
      this._.kText = new Kinetic.Text({});
      // TODO: Abstract out parent attachement with try/catch into own function
      this.parent._.kNode.add(this._.kText);

      this.update();
    },
    update: function() {
      this._.kText.setX(this.x);
      this._.kText.setY(this.y);
      this._.kText.setWidth(this.width);
      this._.kText.setHeight(this.height);
      this._.kText.setText(this.text);
      this._.kText.setFill(this.color);
      this._.kText.setFontFamily(this.font.family);
      this._.kText.setFontSize(this.font.pixelSize);

      var style = (this.font.bold ? 'bold ' : '')
                + (this.font.italic ? 'italic' : '');
      this._.kText.setFontStyle(style);

      this.draw();
    },
    draw: function() {
      this.parent.draw();
    }
  }

  Object.defineProperties(QObjects.Text, {
    inherits: {
      value: 'Item'
    },
    defaultProperties: {
      value: {
        color: 'black',
        text: '',
        font: {
          family: 'Arial, Helvetica',
          pixelSize: 12, // TODO: Custom setter for font.pointSize which writes correct pixelSize for device
          pointSize: {
            read: function() { return this.pixelSize * 0.75; },
            write: function(v) { this.pixelSize = v * 1.333333333; }
          },
          bold: false,
          italic: false
        }
      }
    }
  });

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
    }

    root.init();

    window.q = []; // TMP
    ast.objects.forEach(function(obj) {
      if(obj.type in QObjects) {

        var thisObj = QObjects.create(obj);

        thisObj.parent = root;
        initQueue.unshift(thisObj);
        // TODO: init/parent assignment should be done by QObjects.create at end of inheritance chain
      }
    });

    for(var i = 0; i < initQueue.length; i++) {
      initQueue[i].init();
      // TMP: Expose to outside world
      window.q.push(initQueue[i]);
    }
  }

})(window, document);

// TODO: onload
HQML.load(tree);

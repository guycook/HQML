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

    QObjects.addProperties(obj, QObjects[type].defaultProperties, attr);

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
    obj.children = []
    for(var i = 0; i < children.length; i++) {
      var child = QObjects.create(children[i]);
      child.parent = obj;
      obj.children.push(child);
      initQueue.unshift(child);
    }

    return obj;
  }

  QObjects.addProperties = function(obj, propList, attr, prefix) {
    if(!prefix) prefix = '';

    // Add observable properties to object
    // Public access by name, private implementer on _
    if(!obj._) {
      Object.defineProperty(obj, '_', { value: {} });
    }

    for(var prop in propList) {
      // Handle properties with '.' in the name by created nested object
      if(typeof propList[prop] === 'object') {
        obj[prop] = {};
        QObjects.addProperties(obj[prop], propList[prop], attr, prefix + prop + '.');
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
            // TODO: Smarter generation of read
            read: new Function("return " + value),
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
        obj._[prop] = ko.observable(value !== null ? value : propList[prop]);
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
        width: 100,
        height: 100
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
      this._.kNode.setX(this.x);
      this._.kNode.setY(this.y);

      this._.kRect.setWidth(this.width);
      this._.kRect.setHeight(this.height);
      this._.kRect.setFill(this.color);
      this._.kRect.setCornerRadius(this.radius);

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
        radius: 0
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
      this._.kText.setText(this.text);
      this._.kText.setFill(this.color);
      this._.kText.setFontSize(this.font.pixelSize);

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
          pixelSize: 12 // TODO: Custom setter for font.pointSize which writes correct pixelSize for device
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

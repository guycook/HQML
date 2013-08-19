var tree = {
  "objects": [
    {
      "type": "Rectangle",
      "attributes": [
        {
          "type": "NumericLiteral",
          "name": "width",
          "value": 364
        },
        {
          "type": "NumericLiteral",
          "name": "x",
          "value": 20
        },
        {
          "type": "StringLiteral",
          "name": "color",
          "value": "red"
        }
      ]
    },
    {
      "type": "Rectangle",
      "attributes": [
        {
          "type": "NumericLiteral",
          "name": "height",
          "value": 140
        },
        {
          "type": "StringLiteral",
          "name": "color",
          "value": "blue"
        }
      ]
    }
  ],
  "imports": []
};

// TODO: Generic version, more useful returns
var getValue = function(arr, key) {
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].name === key) {
      return arr[i].value;
    }
  }
  return null;
};

(function(window, document, undefined) {
  "use strict";

  var HQML = window.HQML || (window.HQML = {});

  var QObjects = {};

  QObjects.create = function(config) {
    var type = config.type,
        attr = config.attributes;

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

    // Add observable properties to object
    // Public access by name, private implementer on _
    if(!obj._) {
      Object.defineProperty(obj, '_', { value: {} });
    }

    for(var prop in QObjects[type].defaultProperties) {
      // TODO: Create a computed if attribute type is an expression
      obj._[prop] = ko.observable(getValue(attr, prop) || QObjects[type].defaultProperties[prop]);
      Object.defineProperty(obj, prop, {
        enumerable: true,
        get: obj._[prop],
        set: obj._[prop]
      });
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

    return obj;
  }

  // ---------------------- // TODO: Complete implementation / Document
  // QML Item
  QObjects.Item = {
    // TODO: Init function defining a layer
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
    // TODO: Layer should be created/managed by Rectangle, not passed in
    init: function(layer) {
      this._.kRect = new Kinetic.Rect({});
      layer.add(this._.kRect);
      this._.kLayer = layer;
    },
    update: function() {
      // TODO: Maybe QObjects.create should automatically create subscribers for simple props?
      this._.kRect.setX(this.x);
      this._.kRect.setY(this.y);
      this._.kRect.setWidth(this.width);
      this._.kRect.setHeight(this.height);
      this._.kRect.setFill(this.color);
      this._.kLayer.batchDraw();
    }
  }

  Object.defineProperties(QObjects.Rectangle, {
    inherits: {
      value: 'Item'
    },
    defaultProperties: {
      value: {
        color: 'black'
      }
    }
  });

  // Exports
  HQML.load = function() {
    var stage = new Kinetic.Stage({
      container: 'container',
      width: 800,
      height: 600
    });

    var layer = new Kinetic.Layer();

    tree.objects.forEach(function(obj) {
      if(obj.type in QObjects) {

        var thisObj = QObjects.create(obj);

        thisObj.init(layer);
        thisObj.update();
        // TODO: init/update should be fired by QObjects.create at end of inheritance chain

        window.r = thisObj;
      }
    });

    // add the layer to the stage
    stage.add(layer);
  }

})(window, document);

// TODO: onload
HQML.load();
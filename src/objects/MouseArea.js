// TODO: Complete implementation / Document
// QML MouseArea
// http://qt-project.org/doc/qt-5.0/qtquick/qml-qtquick2-mousearea.html
QObjects.MouseArea = {
  init: function() {
    this._.kNode = new Kinetic.Rect();

    try {
      this.parent._.kNode.add(this._.kNode);
    }
    catch (e) {
      // Throw 'MouseArea cannot be child of parent.type'
    }
    this.update();
  },
  update: function() {
    this.layout(this._.kNode);

    if(!nullOrUndefined(this.onClicked)) {
      this._.kNode.on('click',
        (new Function("_this", "_context", "with(_context){with(_this){" + this.onClicked + "}}")).bind(this, this, HQML.context));
    }
  }
};

Object.defineProperties(QObjects.MouseArea, {
  inherits: {
    value: 'Item'
  },
  defaultProperties: {
    value: {
      acceptedButtons: null,
      cursorShape: false,
      drag: {
        active: false,
        axis: null,
        filterChildren: false,
        maximumX: 0,
        maximumY: 0,
        minimumX: 0,
        minimumY: 0,
        target: null
      },
      enabled: true,
      hoverEnabled: false,
      preventStealing: false,
      propagateComposedEvents: false,
      onClicked: null
    }
  },
  readOnly: {
    value: {
      containsMouse: function() { return false; }, // TODO: Implement
      mouseX: function() { return 0; }, // TODO: Implement
      mouseY: function() { return 0; }, // TODO: Implement
      pressed: function() { return false; }, // TODO: Implement
      pressedButtons: function() { return null; } // TODO: Implement
    }
  }
});

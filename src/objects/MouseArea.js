// TODO: Complete implementation / Document
// QML MouseArea
// http://qt-project.org/doc/qt-5.0/qtquick/qml-qtquick2-mousearea.html
QObjects.MouseArea = {
  init: function() {
    this._.kNode = new Kinetic.Rect();

    var self = this;
    this._.kNode.on('click.signal', function(kEvent) {
      var mouse = self.getMouseEvent(kEvent);
      if(!nullOrUndefined(self.clicked) && self.enabled && (self.acceptedButtons & mouse.button)) {
        self.clicked(mouse);
        // TODO: Deal with mouse.accepted state
      }
    });

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
  },
  getMouseEvent: function(kEvent) {
    var Qt = HQML.environment.Qt;
    var mouse = HQML.stage.getPointerPosition();
    var offset = this.offset();
    mouse.x -= offset.x;
    mouse.y -= offset.y;
    mouse.accepted = true;
    switch(kEvent.button) {
      case 0:
        mouse.button = Qt.LeftButton;
        break;
      case 1:
        mouse.button = Qt.MiddleButton;
        break;
      case 2:
        mouse.button = Qt.RightButton;
        break;
    }
    mouse.buttons = kEvent.buttons;
    mouse.modifiers =
      (kEvent.shiftKey && Qt.ShiftModifier) |
      (kEvent.ctrlKey && Qt.ControlModifier) |
      (kEvent.altKey && Qt.AltModifier) |
      (kEvent.metaKey && Qt.MetaModifier);

    // The spec suggests this should be true on 'clicked' and 'released' events
    // where mouseup occurs > 800ms after mousedown. In practice it is only (and
    // always) true for the onPressAndHold signal (Qt 5.2)
    mouse.wasHeld = false;

    return mouse;
  }
};

Object.defineProperties(QObjects.MouseArea, {
  inherits: {
    value: 'Item'
  },
  defaultProperties: {
    value: {
      acceptedButtons: HQML.environment.Qt.LeftButton,
      cursorShape: HQML.environment.Qt.ArrowCursor,
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
      propagateComposedEvents: false
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
  },
  signals: {
    value : {
      clicked: ['mouse']
    }
  }
});

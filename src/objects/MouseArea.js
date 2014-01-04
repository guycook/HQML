// TODO: Complete implementation / Document
// QML MouseArea
// http://qt-project.org/doc/qt-5.0/qtquick/qml-qtquick2-mousearea.html
QObjects.MouseArea = {
  init: function() {
    this._.kNode = new Kinetic.Rect();

    var self = this;

    this._.accepted = false; // Is this event handled already?
    this._.lastDown = 0; // For doubleClick

    this._.kNode.on('mousedown.signal', function(kEvent) {
      self._.accepted = false;
      // Without hoverEnabled 'entered' is fired on mousedown
      if(self.enabled && !self.hoverEnabled) {
        self.entered();
      }
    });

    this._.kNode.on('click.signal', function(kEvent) {
      var mouse = self.getMouseEvent(kEvent);
      if(!self._.accepted && self.enabled && (self.acceptedButtons & mouse.button)) {
        self.clicked(mouse);
      }
      // Without hoverEnabled 'exited' is fired after 'clicked'
      if(self.enabled && !self.hoverEnabled) {
        self.exited();
      }
    });

    // QML doubleClicked fires on the second mousedown based on time since last mousedown
    this._.kNode.on('mousedown.signal', function(kEvent) {
      var mouse = self.getMouseEvent(kEvent);
      var now = Date.now();
      if(/* TODO: self.doubleClicked._.slots.length && */ now - self._.lastDown < 500) {
        if(!self._.accepted && self.enabled && (self.acceptedButtons & mouse.button)) {
          self.doubleClicked(mouse);
        }
        self._.lastDown = 0;
        self._.accepted = mouse.accepted;
      }
      else {
        self._.lastDown = now;
      }
    });

    this._.kNode.on('mouseenter.signal', function(kEvent) {
      if(self.enabled && self.hoverEnabled) {
        self.entered();
      }
    });

    this._.kNode.on('mouseleave.signal', function(kEvent) {
      if(self.enabled && self.hoverEnabled) {
        self.exited();
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
      canceled: [], // TODO: Implement
      clicked: ['mouse'],
      doubleClicked: ['mouse'],
      entered: [],
      exited: []
    }
  }
});

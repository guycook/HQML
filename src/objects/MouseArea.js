// TODO: Complete implementation / Document
// QtQuick 2.0 MouseArea
// http://qt-project.org/doc/qt-5.1/qtquick/qml-qtquick2-mousearea.html

QObjects.MouseArea = {
  init: function() {
    this._.kNode = new Kinetic.Rect();

    var self = this;

    this._.accepted = false; // Is this event handled already?
    this._.lastDown = 0; // For doubleClick
    this._.hasMouse = false;

    this._.kNode.on('mousedown.signal', function(kEvent) {
      var mouse = self._.lastEvent = self.getMouseEvent(kEvent);
      self._.accepted = false;
      if(self.enabled) {
        // Without hoverEnabled 'entered' is fired on mousedown
        if(!self.hoverEnabled) {
          self.entered();
        }
        if(true /* TODO: self.pressed._.slots.length */) {
          self.pressed(mouse);
          self._.accepted = !mouse.accepted; // Inverted accepted behaviour for pressed
          if(self._.accepted) {
            // TODO: Send events to any MouseArea directly below this one
          }
        }
        // Start waiting for pressAndHold, can be canceled by mouseup or mouseleave
        self._.holdTimer = setTimeout(function() {
          if(true /* TODO: self.pressAndHold._.slots.length */) { // Prevent acceptance if no handler present
            self.pressAndHold(self._.lastEvent);
            self._.accepted = self._.lastEvent.accepted;
          }
        }, 800);
      }
    });

    this._.kNode.on('mouseup.signal', function(kEvent) {
      clearTimeout(self._.holdTimer);
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
    this._.kNode.on('mousedown.doubleClick', function(kEvent) {
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
      self._.hasMouse = true;
      HQML.stage.content.style.cursor = QObjects.MouseArea.cursorMap[self.cursorShape];
      if(self.enabled && self.hoverEnabled) {
        self.entered();
      }
    });

    this._.kNode.on('mouseleave.signal', function(kEvent) {
      self._.hasMouse = false;
      HQML.stage.content.style.cursor = 'default';
      clearTimeout(self._.holdTimer);
      if(self.enabled && self.hoverEnabled) {
        self.exited();
      }
    });

    this._.kNode.on('mousemove.signal', function(kEvent) {
      var mouse = self._.lastEvent = self.getMouseEvent(kEvent);
      // TODO: Support for coordinates outside MouseArea on click and drag
      if(self.enabled && (self.hoverEnabled || mouse.buttons)) {
        self.positionChanged(mouse);
      }
    });

    HQML.stage.content.addEventListener('wheel', function(event) {
      if(self._.hasMouse && self.enabled) {
        // TODO: The following is a dodgy hack to deal with parameter name colliding with signal name
        //       Need to find a way around this
        var wheel = self.wheel;
        wheel.accepted = true;
        // Firefox by default uses DOM_DELTA_LINE (1) instead of pixels
        wheel.angleDelta = {
          x: event.deltaX * (event.deltaMode === 1 ? 40 : 1),
          y: -event.deltaY * (event.deltaMode === 1 ? 40 : 1) // QML wheel direction is reverse of browsers
        }; // TODO: QPoint object
        wheel.buttons = self._.lastEvent.buttons;
        wheel.modifiers = self._.lastEvent.modifiers;
        wheel.pixelDelta = { x: 0, y: 0 }; // Not supported on web // TODO: QPoint
        wheel.x = self._.lastEvent.x;
        wheel.y = self._.lastEvent.y;
        self.wheel(wheel);
      }
    }, false);

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
    // Even though getPointerPosition returns of object of just {x,y} it can't
    // be used and modified directly as Kinetic caches the reference and reuses it
    // for subsequent events
    var pointer = HQML.stage.getPointerPosition();
    var mouse = {};
    var offset = this.offset();
    mouse.x = pointer.x - offset.x;
    mouse.y = pointer.y - offset.y;
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

QObjects.MouseArea.cursorMap = {};
QObjects.MouseArea.cursorMap[HQML.environment.Qt.ArrowCursor] = 'default';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.UpArrowCursor] = 'n-resize';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.CrossCursor] = 'crosshair';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.WaitCursor] = 'wait';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.IBeamCursor] = 'text';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.SizeVerCursor] = 'ns-resize';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.SizeHorCursor] = 'ew-resize';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.SizeBDiagCursor] = 'nesw-resize';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.SizeFDiagCursor] = 'nwse-resize';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.SizeAllCursor] = 'move';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.BlankCursor] = 'none';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.SplitVCursor] = 'row-resize';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.SplitHCursor] = 'col-resize';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.PointingHandCursor] = 'pointer';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.ForbiddenCursor] = 'not-allowed';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.OpenHandCursor] = 'grab';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.ClosedHandCursor] = 'grabbing';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.WhatsThisCursor] = 'help';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.BusyCursor] = 'progress';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.DragMoveCursor] = 'default';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.DragCopyCursor] = 'copy';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.DragLinkCursor] = 'alias';
QObjects.MouseArea.cursorMap[HQML.environment.Qt.BitmapCursor] = 'default';

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
      // TODO: Figure out what to do with name collision between pressed property and signal
      //       http://qt-project.org/forums/viewthread/36764/
      //pressed: function() { return false; }, // TODO: Implement
      pressedButtons: function() { return null; } // TODO: Implement
    }
  },
  signals: {
    value : {
      canceled: [], // TODO: Implement
      clicked: ['mouse'],
      doubleClicked: ['mouse'],
      entered: [],
      exited: [],
      positionChanged: ['mouse'],
      pressAndHold: ['mouse'],
      pressed: ['mouse'],
      wheel: ['wheel']
    }
  }
});

// QtQuick 2.0 Rectangle
// http://qt-project.org/doc/qt-5.1/qtquick/qml-qtquick2-rectangle.html

QObjects.Rectangle = {
  init: function() {
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
    this.layout(this._.kNode);

    this._.kRect.setWidth(this._.kNode.getWidth());
    this._.kRect.setHeight(this._.kNode.getHeight());

    this._.kRect.setFill(this.color);
    this._.kRect.setCornerRadius(this.radius - this.border.width / 4);

    var stroke = !!this.border.width;
    this._.kRect.setStrokeEnabled(stroke);
    if(stroke) {
      this._.kRect.setStrokeWidth(this.border.width);
      this._.kRect.setStroke(this.border.color);
    }

    if(nullOrUndefined(this.gradient) || nullOrUndefined(this.gradient.stops)) {
      this._.kRect.setFillPriority('color');
    }
    else {
      this._.kRect.setFillLinearGradientStartPoint([0, 0]);
      this._.kRect.setFillLinearGradientEndPoint([0, this._.kRect.getHeight()]);
      var stopArray = [];
      for(var i = 0; i < this.gradient.stops.length; i++) {
        stopArray.push(this.gradient.stops[i].position, this.gradient.stops[i].color);
      }
      this._.kRect.setFillLinearGradientColorStops(stopArray);
      this._.kRect.setFillPriority('linear-gradient');
    }

    this.draw();
  },
  draw: function() {
    this.parent.draw();
  }
};

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

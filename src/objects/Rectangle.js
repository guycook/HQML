// TODO: Complete implementation / Document
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

// TODO: Complete implementation / Document
// QML Item
QObjects.Item = {
  // TODO: Init function defining a layer, update which can move/resize it
  layout: function(node) {
    var x = this.x,
        y = this.y,
        width = this.width,
        height = this.height,
        border = nullOrUndefined(this.border) ? 0 : this.border.width;

    if(!nullOrUndefined(this.anchors.fill)) {
      ['left', 'top', 'right', 'bottom'].forEach(function(side) {
        this.anchors[side] = this.anchors.fill[side];
      }, this);
    }

    if(!nullOrUndefined(this.anchors.centerIn)) {
      this.anchors.horizontalCenter = this.anchors.centerIn.horizontalCenter;
      this.anchors.verticalCenter = this.anchors.centerIn.verticalCenter;
    }

    // Centre horizontally and vertically if required
    if(!nullOrUndefined(this.anchors.horizontalCenter)) {
      x = this.anchors.horizontalCenter - (width * 0.5) + (+this.anchors.horizontalCenterOffset);
      if(this.anchors.alignWhenCentered) {
        x = Math.round(x);
      }
    }
    if(!nullOrUndefined(this.anchors.verticalCenter)) {
      y = this.anchors.verticalCenter - (height * 0.5) + (+this.anchors.verticalCenterOffset);
      if(this.anchors.alignWhenCentered) {
        y = Math.round(y);
      }
    }

    if(!nullOrUndefined(this.anchors.top)) {
      y = this.anchors.top + (+this.anchors.topMargin);
    }
    if(!nullOrUndefined(this.anchors.bottom)) {
      if(!nullOrUndefined(this.anchors.top)) {
        height = this.anchors.bottom - y - (+this.anchors.bottomMargin);
      }
      else {
        y = this.anchors.bottom - height - (+this.anchors.bottomMargin);
      }
    }
    if(!nullOrUndefined(this.anchors.left)) {
      x = this.anchors.left + (+this.anchors.leftMargin);
    }
    if(!nullOrUndefined(this.anchors.right)) {
      if(!nullOrUndefined(this.anchors.left)) {
        width = this.anchors.right - x - (+this.anchors.rightMargin);
      }
      else {
        x = this.anchors.right - width - (+this.anchors.rightMargin);
      }
    }

    // Update internal absolute positioning if affected by anchors
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    node.setX(x + border / 2);
    node.setY(y + border / 2);
    node.setWidth(width - border);
    node.setHeight(height - border);
  }
};

Object.defineProperties(QObjects.Item, {
  _default: {
    value: {
      name: 'data',
      type: 'list'
    },
    writable: true
  },
  defaultProperties: {
    value: {
      data: [],
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      anchors: {
        top: null,
        bottom: null,
        left: null,
        right: null,
        horizontalCenter: null,
        verticalCenter: null,
        baseline: null,
        fill: null,
        centerIn: null,
        topMargin: null,
        bottomMargin: null,
        leftMargin: null,
        rightMargin: null,
        margins: {
          read: function() {
            return { top: this.topMargin, bottom: this.bottomMargin, left: this.leftMargin, right: this.rightMargin };
          },
          write: function(v) {
            this.topMargin = this.bottomMargin = this.leftMargin = this.rightMargin = v;
          }
        },
        horizontalCenterOffset: null,
        verticalCenterOffset: null,
        baselineOffset: null,
        alignWhenCentered: true
      }
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

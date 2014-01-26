// QtQuick 2.0 Text
// http://qt-project.org/doc/qt-5.1/qtquick/qml-qtquick2-text.html

// TODO: Complete implementation
QObjects.Text = {
  init: function() {
    this._.kText = new Kinetic.Text({});
    // TODO: Abstract out parent attachement with try/catch into own function
    this.parent._.kNode.add(this._.kText);

    // Keep track of whether width/height has been user specified
    this._.manualWidth = this._.manualHeight = false;
    this._.width.subscribe(function(v) {
      this._.manualWidth = !nullOrUndefined(v) && (v != Math.ceil(this._.kText.getTextWidth()));
    }, this);
    this._.height.subscribe(function(v) {
      this._.manualHeight = !nullOrUndefined(v) && (v != Math.ceil(this._.kText.getTextHeight()));
    }, this);

    this.update();
  },
  update: function() {
    var Text = HQML.environment.Text;

    this._.kText.setText(this.text);
    this._.kText.setFill(this.color);
    this._.kText.setFontFamily(this.font.family);
    this._.kText.setFontSize(this.font.pixelSize);

    var style = (this.font.bold ? 'bold ' : '') +
                (this.font.italic ? 'italic' : '');
    this._.kText.setFontStyle(style);

    this._.kText.setStrokeEnabled(this.style === Text.Outline);

    switch(this.style) {
      case Text.Normal:
        break;

      case Text.Outline:
        this._.kText.setStrokeWidth(1);
        this._.kText.setStroke(this.styleColor);
        this._.kText.setFontSize(this.font.pixelSize + 2); // Kinetic strokes inside, QML outside
        break;

      case Text.Raised:
        break;

      case Text.Sunken:
        break;
    }

    if(!this._.manualWidth) {
      // If text became larger than previous width getTextWidth will report 0
      this._.kText.setWidth(10000); // TODO: Replace with constant
      this.width = Math.ceil(this._.kText.getTextWidth());
    }
    if(!this._.manualHeight) {
      this._.kText.setHeight(10000); // TODO: Replace with constant
      this.height = Math.ceil(this._.kText.getTextHeight());
    }
    this.layout(this._.kText);

    // TODO: opacity is a property on Item, should be handled there on its
    //       group/layer so it works for all Item derived objects
    this._.kText.opacity(this.opacity);

    // TODO: Baseline anchor implementation here

    this.draw();
  },
  draw: function() {
    this.parent.draw();
  }
};

Object.defineProperties(QObjects.Text, {
  inherits: {
    value: 'Item'
  },
  defaultProperties: {
    value: {
      color: 'black',
      text: '',
      style: HQML.environment.Text.Normal,
      styleColor: 'black',
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

// TODO: Complete implementation / Document
// QML Image
QObjects.Image = {
  init: function() {
    // TODO: Should this be group or layer? infer based on anim etc?
    this._.kNode = new Kinetic.Group();
    this._.kImage = new Kinetic.Image();
    this._.kNode.add(this._.kImage);
    try {
      this.parent._.kNode.add(this._.kNode);
    }
    catch(e) {
      // Throw 'Image cannot be child of parent.type'
    }

    this._.domImage = new Image();
    this._.kImage.setImage(this._.domImage);

    // When the user assigns the source attribute nextSource is set
    // to the provided value, which triggers the download of the image
    // file by setting domImage.src. Upon completion, activeSource is
    // set to nextSource which then triggers the render update.
    // nextSource is required because:
    // a) If src is specified in the QML Document is needs to be assigned
    //    somewhere but domImage won't exist yet
    // b) Reading the value of domImage.src will most of the time not yeild
    //    what was written to it, so there is no way to prevent updates
    //    when src is re-assigned its current value
    var self = this;

    if(nullOrUndefined(this._.nextSource)) {
      this._.nextSource = ko.observable(null);
    }
    this._.activeSource = ko.observable(null);

    this._.domImage.onload = function() {
      self._.activeSource(self._.nextSource());
    };

    this._.nextSource.subscribe(function(v) {
      self._.domImage.src = v;
    });
    this._.nextSource.valueHasMutated();

    this.update();
  },
  update: function() {
    if(nullOrUndefined(this._.activeSource()) || !this._.activeSource().length) {
      // TODO: Detach image from group and redraw
      console.log('no image');
      return;
    }

    this.layout(this._.kNode);

    this._.kImage.setWidth(this._.kNode.getWidth());
    this._.kImage.setHeight(this._.kNode.getHeight());

    this.draw();
  },
  draw: function() {
    this.parent.draw();
  }
};

Object.defineProperties(QObjects.Image, {
  inherits: {
    value: 'Item'
  },
  defaultProperties: {
    value: {
      //asynchronous: bool,
      //cache: bool,
      //fillMode: enumeration,
      //horizontalAlignment: enumeration,
      //mirror: false,
      //paintedHeight: real,
      //paintedWidth: real,
      //progress: real,
      //smooth: bool,
      source: {
        read: function() {
          return this._.activeSource();
        },
        write: function(v) {
          // TODO: Architecture for handling writes to private this.vars before init is called?
          if(nullOrUndefined(this._.nextSource)) {
            this._.nextSource = ko.observable(v);
          }
          else {
            this._.nextSource(v);
          }
        }
      }
      //sourceSize: QSize,
      //status: enumeration,
      //verticalAlignment: enumeration
    }
  }
});

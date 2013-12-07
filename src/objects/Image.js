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

    var nodeWidth = this._.kNode.getWidth(),
        nodeHeight = this._.kNode.getHeight(),
        naturalWidth = this._.domImage.naturalWidth,
        naturalHeight = this._.domImage.naturalHeight,
        rX = nodeWidth / naturalWidth,
        rY = nodeHeight / naturalHeight;

    var position = { x: 0, y: 0 },
        size = { width: nodeWidth, height: nodeHeight },
        patternScale = { x: 1, y: 1 },
        patternOffset = { x: 0, y: 0 };

    if(this.fillMode === Image.Stretch || this.fillMode === Image.PreserveAspectFit) {
      this._.kImage.setFillPatternImage(null);
      this._.kImage.setImage(this._.domImage);
      if(this.fillMode === Image.PreserveAspectFit) {
        // Set the size of kImage to fit inside kNode
        var scale;
        if(rX < rY) {
          scale = rX;
          position.y = 0.5 * (nodeHeight - naturalHeight * scale);
        }
        else {
          scale = rY;
          position.x = 0.5 * (nodeWidth - naturalWidth * scale);
        }
        size.width = naturalWidth * scale;
        size.height = naturalHeight * scale;
      }
    }
    else {
      this._.kImage.setImage(null);
      this._.kImage.setFillPatternImage(this._.domImage);
      switch(this.fillMode) {
        case Image.Tile:
          patternOffset.x = 0.5 * (naturalWidth - nodeWidth);
          patternOffset.y = 0.5 * (naturalHeight - nodeHeight);
          break;
        case Image.PreserveAspectCrop:
          if(rX < rY) {
            patternOffset.x = 0.5 * (nodeHeight - nodeWidth) / rY;
            patternScale.x = patternScale.y = rY;
          }
          else {
            patternOffset.y = 0.5 * (nodeWidth - nodeHeight) / rX;
            patternScale.x = patternScale.y = rX;
          }
          break;
        case Image.TileVertically:
          patternScale.x = rX;
          patternOffset.y = 0.5 * (naturalHeight - nodeHeight);
          break;
        case Image.TileHorizontally:
          patternScale.y = rY;
          patternOffset.x = 0.5 * (naturalWidth - nodeWidth);
          break;
        case Image.Pad:
          size.width = Math.min(naturalWidth, nodeWidth);
          size.height = Math.min(naturalHeight, nodeHeight);

          // TODO: Offset base and h/v align
          break;
      }
    }

    this._.kImage.setPosition(position);
    this._.kImage.setSize(size);
    this._.kImage.setFillPatternScale(patternScale);
    this._.kImage.setFillPatternOffset(patternOffset);

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
      // Though set to false by default in the QML standard the asynchronous
      // property will always behave as though set to true in HQML. Changing
      // it has no effect besides the usual signal and binding handlers.
      asynchronous: false,
      // The caching behaviour of Images will be determined by browser settings,
      // changing the value will have no effect besides signals and bindings.
      cache: true,
      fillMode: Image.Stretch,
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

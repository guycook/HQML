// TODO: Complete implementation / Document
// QtQuick 2.0 Image
// http://qt-project.org/doc/qt-5.1/qtquick/qml-qtquick2-image.html

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

    // Control observable allowing read-only properties to re-evaluate after update
    this._.updated = ko.observable();

    this.update();
  },
  update: function() {
    var Image = HQML.environment.Image;

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
          position.y = QObjects.Image.align[this.verticalAlignment] * (nodeHeight - naturalHeight * scale);
        }
        else {
          scale = rY;
          position.x = QObjects.Image.align[this.horizontalAlignment] * (nodeWidth - naturalWidth * scale);
        }
        size.width = naturalWidth * scale;
        size.height = naturalHeight * scale;
      }

      if(this.mirror) {
        position.x += size.width;
        this._.kImage.setScaleX(-1);
      }
      else {
        this._.kImage.setScaleX(1);
      }
    }
    else {
      this._.kImage.setImage(null);
      this._.kImage.setFillPatternImage(this._.domImage);

      switch(this.fillMode) {
        case Image.Tile:
          patternOffset.x = QObjects.Image.align[this.horizontalAlignment] * (naturalWidth - nodeWidth);
          patternOffset.y = QObjects.Image.align[this.verticalAlignment] * (naturalHeight - nodeHeight);
          break;

        case Image.PreserveAspectCrop:
          if(rX < rY) {
            patternScale.x = patternScale.y = rY;
            patternOffset.x = QObjects.Image.align[this.horizontalAlignment] * (nodeHeight - nodeWidth) / rY;
          }
          else {
            patternScale.x = patternScale.y = rX;
            patternOffset.y = QObjects.Image.align[this.verticalAlignment] * (nodeWidth - nodeHeight) / rX;
          }
          break;

        case Image.TileVertically:
          patternScale.x = rX;
          patternOffset.y = QObjects.Image.align[this.verticalAlignment] * (naturalHeight - nodeHeight);
          break;

        case Image.TileHorizontally:
          patternScale.y = rY;
          patternOffset.x = QObjects.Image.align[this.horizontalAlignment] * (naturalWidth - nodeWidth);
          break;

        case Image.Pad:
          if(nodeWidth > naturalWidth) {
            size.width = naturalWidth;
            position.x = QObjects.Image.align[this.horizontalAlignment] * (nodeWidth - naturalWidth);
          }
          else {
            size.width = nodeWidth;
            patternOffset.x = QObjects.Image.align[this.horizontalAlignment] * (naturalWidth - nodeWidth);
          }

          if(nodeHeight > naturalHeight) {
            size.height = naturalHeight;
            position.y = QObjects.Image.align[this.verticalAlignment] * (nodeHeight - naturalHeight);
          }
          else {
            size.height = nodeHeight;
            patternOffset.y = QObjects.Image.align[this.verticalAlignment] * (naturalHeight - nodeHeight);
          }
          break;
      }

      if(this.mirror) {
        patternOffset.x += size.width / patternScale.x;
        patternScale.x *= -1;
      }
    }

    this._.kImage.setPosition(position);
    this._.kImage.setSize(size);
    this._.kImage.setFillPatternScale(patternScale);
    this._.kImage.setFillPatternOffset(patternOffset);

    this._.updated.valueHasMutated();

    this.draw();
  },
  draw: function() {
    this.parent.draw();
  }
};

QObjects.Image.align = {};
QObjects.Image.align[HQML.environment.Image.AlignLeft] = QObjects.Image.align[HQML.environment.Image.AlignTop] = 0;
QObjects.Image.align[HQML.environment.Image.AlignHCenter] = QObjects.Image.align[HQML.environment.Image.AlignVCenter] = 0.5;
QObjects.Image.align[HQML.environment.Image.AlignRight] = QObjects.Image.align[HQML.environment.Image.AlignBottom] = 1;

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
      fillMode: HQML.environment.Image.Stretch,
      horizontalAlignment: HQML.environment.Image.AlignHCenter,
      mirror: false,
      // TODO: Implement scaling algorithm switch
      //       Best approach may be to submit patch to kineticjs
      smooth: true,
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
      },
      // Writing to sourceSize has no effect in HQML, image memory managment
      // is left to the browser
      // TODO: Make this a QML size object
      sourceSize: {
        width: 0,
        height: 0
      },
      verticalAlignment: HQML.environment.Image.AlignVCenter
    }
  },
  readOnly: {
    value: {
      paintedWidth: function() {
        this._.updated();
        return this._.kImage.getWidth();
      },
      paintedHeight: function() {
        this._.updated();
        return this._.kImage.getHeight();
      },
      progress: function() {
        // Currently can only show 0 or 1 as total progress.
        // We could do better by either fetching image data with ajax
        // or just wait for progress events to be available for images.
        return this.status === HQML.environment.Image.Ready ? 1 : 0;
      },
      status: function() {
        if(this._.activeSource() === this._.nextSource()) {
          if(this._.activeSource() === null) {
            return HQML.environment.Image.Null;
          }
          return this._.domImage.complete ? HQML.environment.Image.Ready : HQML.environment.Image.Error;
        }
        return HQML.environment.Image.Loading;
      }
    }
  }
});

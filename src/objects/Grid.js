// TODO: Complete implementation / Document
// QML Grid
QObjects.Grid = {
  init: function() {
    this._.kNode = new Kinetic.Group();

    try {
      this.parent._.kNode.add(this._.kNode);
    }
    catch (e) {
      // Throw 'Grid cannot be child of parent.type'
    }
    this.update();
  },
  update: function() {
    var i, j, cols = [], rows = [];
    // Get maximum width in each column
    for(i = 0; i < this.columns; i++) {
      for(j = i; j < this.children.length; j+= this.columns) {
        cols[i] = Math.max(cols[i] || 0, this.children[j].width);
      }
    }
    // Get maximum height in each row
    for(i = 0, j = 0; i < this.children.length; i++) {
      rows[j] = Math.max(rows[j] || 0, this.children[i].height);
      if((i + 1) % this.columns === 0) {
        j++;
      }
    }

    // Layout according to sizes found above
    var x = 0, y = 0;
    var xSpacing = nullOrUndefined(this.columnSpacing) ? this.spacing : this.columnSpacing,
        ySpacing = nullOrUndefined(this.rowSpacing) ? this.spacing : this.rowSpacing;
    for(i = 0, j = 0; i < this.children.length; i++) {
      this.children[i].x = x;
      this.children[i].y = y;
      x += cols[i % this.columns] + xSpacing;
      if((i + 1) % this.columns === 0) {
        y += rows[j] + ySpacing;
        j++;
        x = 0;
      }
    }

    // Set container size for anchoring
    function sum(a, b) { return a + b; }
    this.width = cols.reduce(sum) + (cols.length - 1) * xSpacing;
    this.height = rows.reduce(sum) + (rows.length - 1) * ySpacing;

    this.layout(this._.kNode);

    this.draw();
  },
  draw: function() {
    this.parent.draw();
  }
};

Object.defineProperties(QObjects.Grid, {
  inherits: {
    value: 'Item'
  },
  defaultProperties: {
    value: {
      add: null,
      columnSpacing: null,
      columns: 4,
      flow: null,
      layoutDirection: null,
      move: null,
      populate: null,
      rowSpacing: null,
      rows: null,
      spacing: 0
    }
  },
  readOnly: {
    value: {
      effectiveLayoutDirection: function() { return this.layoutDirection; } // TODO: Reverse based on LayoutMirroring
    }
  }
});

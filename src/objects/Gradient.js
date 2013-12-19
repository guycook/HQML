// QML Gradient
QObjects.Gradient = {};

Object.defineProperties(QObjects.Gradient, {
  _default: {
    value: {
      name: 'stops',
      type: 'list'
    },
    writable: true
  },
  defaultProperties: {
    value: {
      stops: []
    }
  }
});

// QtQuick 2.0 Gradient
// http://qt-project.org/doc/qt-5.1/qtquick/qml-qtquick2-gradient.html

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

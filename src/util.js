function addEnums(object, properties) {
  for(var key in properties) {
    Object.defineProperty(object, key, {
      enumerable: true,
      writable: false,
      value: properties[key]
    });
  }
}

function getProperty(arr, key, keyField, valueField) {
  for(var i = 0; i < arr.length; i++) {
    if(arr[i][keyField] === key) {
      return arr[i][valueField];
    }
  }
  return null;
}

function nullOrUndefined() {
  for(var i = 0; i < arguments.length; i++) {
    if(arguments[i] !== null && arguments[i] !== undefined) {
      return false;
    }
  }
  return true;
}

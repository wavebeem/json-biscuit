var JSON = require("./parser").JSON;

function parse(text, reviver) {
  if (reviver) {
    throw new Error("reviver functions are not supported in json-biscuit");
  }
  var result = JSON.parse(text);
  if (result.status) {
    return result.value;
  } else {
    throw new Error("JSON parse error: " + text);
  }
}

function stringify(value, replacer, space) {
    throw new Error("stringify is not yet implemented in json-biscuit");
}

exports.parse = parse;
exports.stringify = stringify;

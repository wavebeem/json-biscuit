var P = require("parsimmon");

function objectFromPairs(pairs) {
  var obj = {};
  pairs.forEach(function(pair) {
    obj[pair[0]] = pair[1];
  });
  return obj;
}

// Turn something like "\u0061" into "a".
function unescapeUnicode(s) {
  return String.fromCharCode(parseInt(s, 16));
}

// Turn something like "\n" into an actual newline character.
function unescapeSimple(s) {
  var table = {
    '"': '"',
    '\\': '\\',
    '/': '/',
    b: "\b",
    n: "\n",
    f: "\f",
    r: "\r",
    t: "\t"
  };
  return table[s];
}

//// Whitespace
var __ = P.regex(/[\ \n\r\t]*/);

function spaced(s) {
  return __.skip(P.string(s)).skip(__);
}

var Comma = spaced(",");
var Colon = spaced(":");

function listOf(x) {
  var none = P.of([]);
  var some =
    P.seqMap(x, Comma.then(x).many(), function(first, rest) {
      return [first].concat(rest);
    });
  return P.alt(some, none);
}

function wrap(begin, end, x) {
  return spaced(begin)
    .then(x)
    .skip(spaced(end));
}


// A JSON document is just any JSON value. Note that an older version of the
// JSON specification required a JSON document start with either an object or
// an array, and many faulty implementations require you start with an object.
var JValue =
  P.lazy(function() {
    return P.alt(
      JTrue,
      JFalse,
      JNull,
      JNumber,
      JString,
      JObject,
      JArray
    );
  });

//// Named values
var JTrue = P.string("true").result(true);
var JFalse = P.string("false").result(false);
var JNull = P.string("null").result(null);

//// Numbers
var JNegative = P.string("-");
var JZero = P.string("0");
var JPositiveInteger = P.regex(/[1-9][0-9]*/);
var JFractional = P.regex(/[.][0-9]+/);
var JExponential = P.regex(/[eE][+-]?[0-9]+/);
var JNumber =
  P.seq(
    P.alt(JNegative, P.of("")),
    P.alt(JZero, JPositiveInteger),
    P.alt(JFractional, P.of("")),
    P.alt(JExponential, P.of(""))
  ).map(function(pieces) {
    // All JSON numbers are also JavaScript numbers, so we're cheating here and
    // just passing off the whole string to JavaScript's number parser :)
    return Number(pieces.join(""));
  });

/// Strings
var JSimpleEscape = P.string("\\").then(P.regex(/[\\"bnfrt\/]/));
var JUnicodeEscape = P.string("\\u").then(P.regex(/[0-9a-fA-F]{4}/));
var JNormalStringChunk = P.regex(/[^\\"\u0000-\u001f\u0080-\u009f]+/);
var JStringInner =
  P.alt(
    JSimpleEscape.map(unescapeSimple),
    JUnicodeEscape.map(unescapeUnicode),
    JNormalStringChunk
  ).many().map(function(chunks) {
    return chunks.join("");
  });
var JString = wrap('"', '"', JStringInner)

/// Objects
var JPair = P.seq(JString.skip(Colon), JValue);
var JObjectInner = listOf(JPair).map(objectFromPairs);
var JObject = wrap("{", "}", JObjectInner);

/// Arrays
var JArray = wrap("[", "]", listOf(JValue));

// JSON documents should ignore whitespace at the beginning and end.
var JSON = __.then(JValue).skip(__);

exports.JSON = JSON;

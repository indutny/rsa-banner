var bn = require('bn.js');
var kg = require('selfsigned.js').create();

function KeyPair(p, q) {
  this.p = p;
  this.q = q;
  this.m = p.mul(q);
  this.red = bn.red(this.m);
}

exports.genKeyPair = function genKeyPair(size, cb) {
  var half = size >>> 1;

  kg.getPrime(half, function(err, p) {
    if (err)
      return cb(err);

    kg.getPrime(half, function(err, q) {
      if (err)
        return cb(err);

      var data = kg.getKeyData(p, q);
      if (!data)
        return genKeyPair(size, cb);

      cb(null, new KeyPair(p, q));
    });
  });
};

function LineIterator(key) {
  this.key = key;
  this.red = key.red;

  this.start = new bn(1).toRed(this.red);
  this.current = this.start;
  this.step = new bn(2).toRed(this.red);

  this.ended = false;
}

LineIterator.prototype.next = function next() {
  if (this.ended)
    return false;

  var res = this.current;
  this.current = this.current.redMul(this.step);
  if (this.current.cmp(this.start) === 0)
    this.ended = true;

  return res;
};

exports.LineIterator = LineIterator;
exports.createIterator = function createIterator(key) {
  return new LineIterator(key);
};

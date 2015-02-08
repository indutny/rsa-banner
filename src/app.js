var rp = require('../');

function Pattern(id, options) {
  this.options = options;
  this.width = this.options.width;
  this.height = this.options.height;

  this.scale = this.options.scale;
  this.offY = -1;
  this.counter = 0;
  this.lastHigh = 0;

  this.canvas = document.getElementById(id);
  this.canvas.width = this.width * this.scale;
  this.canvas.height = this.height * this.scale;
  this.ctx = this.canvas.getContext('2d');
  this.iterator = null;
}

Pattern.prototype.init = function init(cb) {
  var self = this;

  rp.genKeyPair(this.width, function(err, key) {
    if (err)
      return cb(err);

    self.iterator = rp.createIterator(key);
    cb(null);
  });
};

Pattern.prototype.color = function color() {
  var sat = (this.counter - this.lastHigh) % 16;
  var pi2 = 2 * Math.PI;
  var hue = this.counter % pi2;
  hue /= pi2;
  hue *= 360;
  sat *= 100/16;

  return 'hsla(' + hue + ',' + sat + '%,40%,1)';
};

Pattern.prototype.draw = function draw(line) {
  var line = this.iterator.next();
  var bytes = line.fromRed().toArray();
  var bits = [];

  // NOTE: bytes is in Big Endian
  for (var i = bytes.length - 1; i >= 0; i--) {
    var b = bytes[i];
    for (var j = 0; j < 8; j++) {
      bits.push(b & 1);
      b >>= 1;
    }
  }
  while (bits.length < this.width)
    bits.push(0);

  this.counter++;
  if (bits[0])
    this.lastHigh = this.counter;

  // Clear the line
  var y = this.nextY();

  // bits are in reverse now
  this.ctx.fillStyle = this.color();
  for (var i = bits.length; i >= 0; i--) {
    var bit = bits[i];
    var x = this.width - i - 1;

    if (bit)
      this.ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
  }
};

Pattern.prototype.nextY = function nextY() {
  this.offY++;
  if (this.offY !== this.height)
    return this.offY;

  this.offY--;

  // Shift all lines
  var width = this.width * this.scale;
  var height = (this.height - 1) * this.scale;
  var img = this.ctx.getImageData(0, this.scale, width, height);
  this.ctx.putImageData(img, 0, 0, 0, 0, width, height);

  // Clear last line
  this.ctx.fillStyle = '#fff';
  this.ctx.fillRect(0, height, width, this.scale);

  return this.offY;
};

var p = new Pattern('banner', {
  width: 64,
  height: (window.innerHeight / 4) | 0,
  scale: 4
});

// Polyfill
window.setImmediate = function(cb) {
  setTimeout(cb, 0);
};

var requestFrame = window.requestAnimationFrame ||
                   window.mozRequestAnimationFrame ||
                   window.webkitRequestAnimationFrame;
p.init(function(err) {
  if (err)
    throw err;

  function step() {
    for (var i = 0; i < 1; i++)
      p.draw();

    requestFrame(step);
  }
  step();
});

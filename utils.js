function drawTarget(x, y, r, colour, ctx) {
  return new Promise((resolve) => {
    ctx.save();
    ctx.translate(Math.floor(x), Math.floor(y));
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, 2 * Math.PI);
    ctx.fillStyle = colour;
    ctx.fill();
    ctx.closePath();
    ctx.restore();
    resolve();
  });
} // end draw target

function drawRectangle(x, y, width, height, ctx) {
  return new Promise((resolve) => {
    ctx.save();
    ctx.translate(Math.floor(x), Math.floor(y));
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = '#000'; // Change color if needed
    ctx.fill();
    ctx.closePath();
    ctx.restore();
    resolve();
  });
} // en

function drawLine(x0, y0, x1, y1, colour, ctx) {
  return new Promise((resolve) => {
    ctx.beginPath();
    ctx.lineWidth = 10;
    ctx.strokeStyle = colour;
    ctx.moveTo(Math.floor(x0), Math.floor(y0));
    ctx.lineTo(Math.floor(x1), Math.floor(y1));
    ctx.stroke();
    resolve();
  });
}

function getPixelColour(x, y, ctx) {
  // Set "will read frequently" to true
  var imageData = ctx.getImageData(x, y, 1, 1);
  var pixelData = imageData.data;
  // Extract red value
  var red = pixelData[0];
  return red;
}

function scan(x1, y1, x2, y2, ctx) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  var r = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  var t = Math.atan(dy / dx); // % (2 * Math.PI);
  t += x2 < x1 ? Math.PI : 0;
  // console.log('enemy to player theta: ' + t);
  var inc = 4; // arbitrary increment
  var i = inc;
  while (i < r) {
    var x = x1 + i * Math.cos(t);
    var y = y1 + i * Math.sin(t);
    var c = getPixelColour(x, y, ctx);
    if (c < 10) {
      // sight line hits barrier
      return false;
    }
    i += inc;
  }
  return true;
}

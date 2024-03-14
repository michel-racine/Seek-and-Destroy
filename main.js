document.addEventListener('DOMContentLoaded', function () {
  var Counter = 0;
  var deathZone = 5;
  var counter = 0;
  var maxSpeed = 7;
  const canvas = document.getElementById('myCanvas');
  const canvas2 = document.getElementById('myCanvas2');
  const ctx = canvas.getContext('2d');
  const ctx2 = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  var frameDuration = 50;
  var displayWidth = window.innerWidth - 40;
  var displayHeight = window.innerHeight - 40;
  var backgroundColour = 'rgba(100,100,100, 0.1)'; // REM: last parameter is translucency
  var Foes = [];
  var Obstacles = [];
  var Foods = [];
  // make city blooks
  var s = 35; // block spacing
  var nc = 7; // 3; // number of cols
  var nr = 5; // 2; // number of rows
  var w = (displayWidth - (nc + 1) * s) / nc; // block width
  var h = (displayHeight - (nr + 1) * s) / nr; // block height
  for (var i = 0; i < nc; i++) {
    for (var j = 0; j < nr; j++) {
      Obstacles.push([(i + 1) * s + i * w, (j + 1) * s + j * h, w, h]);
    }
  }

  // randomize the streets a bit
  var randomThreshold = 0.85;
  for (var j = 0; j < nr + 1; ++j) {
    for (var i = 0; i < nc; ++i) {
      if (Math.random() > randomThreshold) {
        var x = i * (s + w) + s;
        var y = j * (s + h);
        Obstacles.push([x, y, w, s]);
      }
    }
  }
  for (var j = 0; j < nr; ++j) {
    for (var i = 0; i < nc + 1; ++i) {
      if (Math.random() > randomThreshold) {
        var x = i * (s + w);
        var y = j * (s + h) + s;
        Obstacles.push([x, y, s, h]);
      }
    }
  }

  // // make a box border
  // Obstacles.push([0, 0, displayWidth, 10]);
  // Obstacles.push([0, 0, 10, displayHeight]);
  // Obstacles.push([displayWidth - 10, 0, 10, displayHeight]);
  // Obstacles.push([0, displayHeight - 10, displayWidth, 10]);

  var numFoes = 6;
  me = new player(s / 2, s / 2, 0); // 0 option denotes player type
  me.theta = -Math.PI;
  for (var i = 0; i < numFoes; i++) {
    var q = Math.floor(Math.random() * 3 + 1);
    if (q == 1) {
      Foes.push(new player(displayWidth - s / 2, s / 2, 1));
    } else if (q == 2) {
      Foes.push(new player(displayWidth - s / 2, displayHeight - s / 2, 1));
    } else {
      Foes.push(new player(s / 2, displayHeight - s / 2, 1));
    }
  }

  window.addEventListener(
    'keydown',
    function (event) {
      if (event.defaultPrevented) return;
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
          me.theta += -Math.PI / 2;
          break;
        case 'ArrowRight':
        case 'd':
          me.theta += Math.PI / 2;
          break;
        case 'ArrowUp':
        case 'w':
          me.radius += me.radius < maxSpeed ? 2 : 0;
          break;
        case 'ArrowDown':
        case 's':
          me.radius -= me.radius > 0 ? 2 : 0;
          break;
        default:
          return;
      }
      event.preventDefault();
    },
    true
  ); // end add event listener

  function startGame() {
    myGameArea.start();
  }

  var myGameArea = {
    canvas: document.getElementById('myCanvas'),
    canvas2: document.getElementById('myCanvas2'),
    start: function () {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      this.canvas2.width = displayWidth;
      this.canvas2.height = displayHeight;
      this.context = this.canvas.getContext('2d');
      this.context2 = this.canvas2.getContext('2d');
      this.frameNo = 0;
      this.interval = setInterval(updateGameArea, frameDuration);
    },
    clear: function () {},
  };

  function food(x, y) {
    this.x = x;
    this.y = y;
    this.update = function () {
      drawTarget(this.x, this.y, 6, 'rgba(0, 255, 0, 0.1)', ctx);
    };
  }

  // populate food items
  for (var i = 0; i <= nc; ++i) {
    for (var j = 0; j <= nr; ++j) {
      var xTemp = Math.floor(s / 2 + i * (w + s));
      var yTemp = Math.floor(s / 2 + j * (h + s));
      Foods.push(new food(xTemp, yTemp));
    }
  }

  function player(x, y, t) {
    this.randomTurnTimer = 0;
    this.knownLocation = false;
    this.xLKL = 0; // LKL is Last Known Location
    this.yLKL = 0;
    this.thetaLK = 0.0;
    this.x = x;
    this.y = y;
    this.xOld = this.x;
    this.yOld = this.y;
    this.theta = Math.PI;
    this.varTheta = 0.0; // additional theta rotation applied to simulate wandering
    this.radius = Foes.length + 2;
    this.colour = t == 0 ? '#FFF' : 'rgb(50,0,0)';
    this.update = function () {
      if (this.knownLocation == true && t == 1) {
        this.theta = Math.atan((this.yLKL - this.y) / (this.xLKL - this.x));
        if (this.xLKL < this.x) this.theta += Math.PI;
        var d = Math.sqrt(
          Math.pow(this.yLKL - this.y, 2) + Math.pow(this.xLKL - this.x, 2)
        );
        if (d < 4) {
          // foe arrives at last known location
          this.knownLocation = false;
          this.theta = this.thetaLK;
          // when foe loses track of player, starts wandering at a right angle
          // in last known direction
          this.theta += Math.random() * 0.25 - 0.125; // EXPERIMENTAL HOLD
          this.theta = this.theta % (2 * Math.PI);
          // if (this.theta < Math.PI * 0.25) {
          //   this.theta = 0; // + Math.random() > 0.5 ? Math.PI / 2 : 0; // YOW
          //   this.xLKL = displayWidth - 12;
          //   this.yLKL = this.y;
          // } else if (this.theta < Math.PI * 0.75) {
          //   this.theta = Math.PI / 2; // + Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2;
          //   this.xLKL = this.x;
          //   this.yLKL = displayHeight - 12;
          // } else if (this.theta < Math.PI * 1.25) {
          //   this.theta = Math.PI; // + Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2;
          //   this.xLKL = 12;
          //   this.yLKL = this.y;
          // } else if (this.theta < Math.PI * 1.75) {
          //   this.theta = Math.PI * 1.5; // + Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2;
          //   this.xLKL = this.x;
          //   this.yLKL = 12;
          // } else {
          //   this.theta = 0; // + Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2;
          //   this.xLKL = displayWidth - 12;
          //   this.yLKL = this.y;
          // }
        }
        //
      } else if (t == 1) {
        // TODO: make foe randomly go left straight or right when intersects and no known location
        if (
          (this.x - s / 2) % (s + w) < s / 3 &&
          (this.y - s / 2) % (s + h) < s / 3
        ) {
          if (Math.random() > 0.8)
            this.theta += (Math.PI / 4) * (Math.random < 0.5 ? 1 : -1); // redundant hold
          //console.log('x in random turn zone');
        }
        // if ((this.x - s / 2) % (s + w) < 20) {
        //   this.theta += (Math.PI / 2) * (Math.random < 0.5 ? 1 : -1);
        //   console.log('y in random turn zone');
        // }
      }
      this.x += this.radius * Math.cos(this.theta); // maybe add Math.floor()
      this.y += this.radius * Math.sin(this.theta);

      if (getPixelColour(this.x, this.y, ctx) == 0) {
        this.theta = this.theta % (Math.PI * 2);
        if (this.theta < Math.PI / 2) {
          if (
            getPixelColour(
              this.x + this.radius * Math.cos(-this.theta),
              this.y + this.radius * Math.sin(-this.theta),
              ctx
            ) != 0
          ) {
            this.theta = -this.theta;
            // this.theta += (Math.PI / 2) * (Math.random() >= 0.5 ? 1 : -1); // might be causing major problems...
          } else {
            this.theta = Math.PI - this.theta;
          }
        } else if (this.theta < Math.PI) {
          // hit wall
          var holdTheta = Math.PI / 2 - (this.theta - Math.PI / 2);
          if (
            getPixelColour(
              this.x + this.radius * Math.cos(holdTheta),
              this.y + this.radius * Math.sin(holdTheta),
              ctx
            ) != 0
          ) {
            this.theta = holdTheta;
          } else {
            var holdTheta = 2 * Math.PI - this.theta;
            if (
              getPixelColour(
                this.x + this.radius * Math.cos(holdTheta),
                this.y + this.radius * Math.sin(holdTheta),
                ctx
              ) != 0
            ) {
              this.theta = holdTheta;
            } else {
              this.theta = -this.theta;
            }
          }
        } else if (this.theta < Math.PI * 1.5) {
          var holdTheta = 2 * Math.PI - (this.theta - Math.PI);
          if (
            getPixelColour(
              this.x + this.radius * Math.cos(holdTheta),
              this.y + this.radius * Math.sin(holdTheta),
              ctx
            ) != 0
          ) {
            this.theta = holdTheta;
          } else {
            this.theta = 2 * Math.PI - this.theta;
          }
        } else {
          holdTheta = 2 * Math.PI - this.theta;
          if (
            getPixelColour(
              this.x + this.radius * Math.cos(holdTheta),
              this.y + this.radius * Math.sin(holdTheta),
              ctx
            ) != 0
          ) {
            this.theta = holdTheta;
          } else {
            this.theta = 1.5 * Math.PI - (this.theta - 1.5 * Math.PI);
          }
        }
      } // end big if
      else {
        this.x = this.x > displayWidth ? displayWidth : this.x < 0 ? 0 : this.x;
        this.y =
          this.y > displayHeight ? displayHeight : this.y < 0 ? 0 : this.y;
      }
      // draw player
      if (this.xOld != this.x || this.yOld != this.y)
        drawLine(this.x, this.y, this.xOld, this.yOld, this.colour, ctx);
      else drawTarget(this.x, this.y, 5, '#F0F', ctx);
      this.xOld = this.x;
      this.yOld = this.y;
    };
  } // end function player

  function updateGameArea() {
    ctx.fillStyle = backgroundColour;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    for (var i = 0; i < Obstacles.length; ++i) {
      drawRectangle(
        Obstacles[i][0],
        Obstacles[i][1],
        Obstacles[i][2],
        Obstacles[i][3],
        ctx2
      );
    }
    me.update();
    for (var i = 0; i < Foes.length; i++) {
      Foes[i].update();
      // game over if all food eaten
      if (Foods.length == 0) {
        drawTarget(me.x, me.y, 100, 'rgba(0, 255, 0, 0.1)', ctx);
        clearInterval(myGameArea.interval);
      }
      // game over if foes catch player
      if (
        Math.sqrt(
          Math.pow(Foes[i].x - me.x, 2) + Math.pow(Foes[i].y - me.y, 2)
        ) < deathZone
      ) {
        drawTarget(me.x, me.y, 100, 'rgba(255, 0, 0, 0.3)', ctx);
        clearInterval(myGameArea.interval);
      }

      // check if foes can see player
      if (scan(me.x, me.y, Foes[i].x, Foes[i].y, ctx)) {
        Foes[i].knownLocation = true;
        var dx = me.x - Foes[i].x;
        var dy = me.y - Foes[i].y;
        var t = Math.atan(dy / dx);
        t += me.x < Foes[i].x ? Math.PI : 0;
        Foes[i].theta = t;
        Foes[i].radius = Math.floor(maxSpeed / 2 + i / 2);
        drawLine(me.x, me.y, Foes[i].x, Foes[i].y, 'rgba(255, 0, 0, 0.1)', ctx);
        Foes[i].xLKL = me.x;
        Foes[i].yLKL = me.y;
        Foes[i].thetaLK = me.theta;
      } else {
        Foes[i].radius = Math.floor(maxSpeed / 2.0 + i / 2 - 1);
      }
    }
    // remove food if eaten
    for (i = 0; i < Foods.length; ++i) {
      Foods[i].update();
      if (
        Math.sqrt(
          Math.pow(Foods[i].x - me.x, 2) + Math.pow(Foods[i].y - me.y, 2)
        ) <
        s / 2
      ) {
        Foods.splice(i, 1);
      }
    }
    console.log(Foods.length);
  } // end function updateGameArea()
  startGame();
  // for (var i = 0; i < Obstacles.length; ++i) {
  //   drawRectangle(
  //     Obstacles[i][0],
  //     Obstacles[i][1],
  //     Obstacles[i][2],
  //     Obstacles[i][3],
  //     ctx2
  //   );
  // }
});

// @ts-check

const CANVAS_W = 400;
const CANVAS_H = 600;

var GameState = {
  TITLE: 1,
  RULES: 2,  
  ACTION: 3,
  FAIL: 4,
}
var gameState = GameState.TITLE;
var tickCount = 0;
var failTickCount = 0;

function Vec(x, y){
    this.x = x || 0;
  this.y = y || 0;
};
Vec.prototype.copy = function(){
  return new Vec(this.x, this.y);
};
Vec.prototype.add = function(v){
  this.x += v.x;
  this.y += v.y;
};
Vec.prototype.sub = function(v){
  this.x -= v.x;
  this.y -= v.y;
};
Vec.prototype.scale = function(n){
  this.x *= n;
  this.y *= n;
};
Vec.prototype.rotate = function(angle){
  var tx = this.x;
  var ty = this.y;
  this.x = tx * Math.cos(angle) - ty * Math.sin(angle);
  this.y = ty * Math.cos(angle) + tx * Math.sin(angle);
};
Vec.prototype.toText = function(){
  return Math.round(this.x) + " : " + Math.round(this.y);
};

function Rect(min, max){
    this.min = min || new Vec(0, 0);
    this.max = max || new Vec(0, 0);
}

function Brick(rect){
  this.rect = rect;
  this.hit = false;
}

var canvasContext = null;

var mousePos = new Vec();
var mouseDown = false;
var mouseDownPrev = false;
function mouseDownJust() { return mouseDown && !mouseDownPrev; };
var mouseEventDown = false;
var mouseEventUp = false;

function clear(){
  canvasContext.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawRect(new Rect(new Vec(0, 0), new Vec(CANVAS_W, CANVAS_H)), "#cccccc");
};
function drawLine(from, to, color){
  canvasContext.strokeStyle = color || "#000000";
  canvasContext.beginPath();
  canvasContext.moveTo(from.x, from.y);
  canvasContext.lineTo(to.x, to.y);
  canvasContext.stroke();
};
function drawCircle(center, r, color){
  canvasContext.fillStyle = color || "#000000";
  canvasContext.beginPath();
  canvasContext.arc(center.x, center.y, r, 0, 2*Math.PI);
  canvasContext.fill();
};
function drawRect(rect, color){
  canvasContext.fillStyle = color || "#000000";
  canvasContext.fillRect(rect.min.x, rect.min.y, rect.max.x - rect.min.x, rect.max.y - rect.min.y);
}
function drawText(pos, text, color) {
  canvasContext.fillStyle = color || "#000000";
  canvasContext.fillText(text, pos.x, pos.y);
};

function drawTapToContinue(){
    var addDots = "";
    const FREQ = 20;
    if(Math.floor(tickCount / FREQ) % 3 == 1) addDots = ".";
    if(Math.floor(tickCount / FREQ) % 3 == 2) addDots += "..";
    drawText(new Vec(130, 390), "tap to continue." + addDots);
}

function drawBall(pos){
  drawCircle(pos, ballR, "#009900");
  drawLine(new Vec(CANVAS_W / 2, 0), pos);
}
function drawBricks(){
  for(var i = bricks.length - 1; i >= 0; i--){
    drawRect(bricks[i].rect, bricks[i].hit ? "#ff0000" : "#880000");
  }
}

function getBallPos(){
  var res = new Vec(0, 170);
  res.rotate(ballAngle);
  res.x += CANVAS_W / 2;
  return res;
}

function collides(rect, center, r){
  var closestOnRect = new Vec();

  if(center.x < rect.min.x){
    closestOnRect.x = rect.min.x;
  }
  else if(rect.max.x < center.x){
    closestOnRect.x = rect.max.x;
  }
  else{
    closestOnRect.x = center.x;
  }

  if(center.y < rect.min.y){
    closestOnRect.y = rect.min.y;
  }
  else if(rect.max.y < center.y){
    closestOnRect.y = rect.max.y;
  }
  else{
    closestOnRect.y = center.y;
  }

  var dx = center.x - closestOnRect.x;
  var dy = center.y - closestOnRect.y;
  var d2 = dx * dx + dy * dy;
  return d2 < r * r;
}

var bgPointsOrig = [];
const DP = 20
for(var y = -DP; y <= CANVAS_H + DP; y += DP){
  var line = [];
  bgPointsOrig.push(line);
  for(var x = -DP; x <= CANVAS_W + DP; x += DP){
    line.push(new Vec(x, y));
  }
}

var bgPoints = [];
function resetBgPoints(){
  bgPoints = [];
  for(var iy = bgPointsOrig.length - 1; iy >= 0; iy--){
    var lineOrig = bgPointsOrig[iy];
    var line = [];
    bgPoints.push(line)
    for(var ix = lineOrig.length - 1; ix >= 0; ix--){
      line.push(lineOrig[ix].copy());
    }
  }
}

function updateBg(ballPos){
  for(var iy = bgPointsOrig.length - 1; iy >= 0; iy--){
    var lineOrig = bgPointsOrig[iy];
    var line = bgPoints[iy];
    for(var ix = lineOrig.length - 1; ix >= 0; ix--){
      var pOrig = lineOrig[ix];
      var dx = pOrig.x - ballPos.x;
      var dy = pOrig.y - ballPos.y; 
      var d2 = dx * dx + dy * dy;
      var d = Math.sqrt(d2) + 1;

      const F = 20;
      var p = line[ix];
      p.x = pOrig.x + F * dx / d;
      p.y = pOrig.y + F * dy / d;
    }
  }
}

function drawBg(){
  var color = "#0000ff";
  for(var iy = bgPoints.length - 1; iy >= 0; iy--){
    var line = bgPoints[iy];
    for(var ix = line.length - 1; ix >= 0; ix--){
      if(ix > 0){
        drawLine(line[ix], line[ix - 1], color);
      }
      if(iy > 0){
        drawLine(line[ix], bgPoints[iy - 1][ix], color);
      }
    }
  }
}


const ballR = 30;
var ballAngle;
var ballAngleVel;
var worldVel;
var worldPos;
var bricks = [];
function resetBricks(){
  bricks = [];
  for(var y = 300; y < 10000; y += 400){
    bricks.push(new Brick(new Rect(new Vec(10, y), new Vec(150 + Math.random() * 80, y + 50))));
    bricks.push(new Brick(new Rect(new Vec(250 - Math.random() * 80, y + 200), new Vec(390, y + 250))));
  }
}
function reset(){
  ballAngle = 0;
  ballAngleVel = 0.03;
  worldVel = 0;
  worldPos = 0;
  resetBricks();
  resetBgPoints();
}

function tick() {
  requestAnimationFrame(tick);

  mouseDownPrev = mouseDown;
  if(mouseEventDown){
    mouseEventDown = false;
    mouseDown = true;
  }
  if(mouseEventUp){
    mouseEventUp = false;
    mouseDown = false;
  }

  clear();

  if(gameState == GameState.TITLE){
    drawText(new Vec(135, 50), "HYPNO BALL");
    drawText(new Vec(180, 160), "by");
    drawText(new Vec(100, 200), "tarikkaya@google.com");
    drawTapToContinue();

    if(mouseDownJust()){
      gameState = GameState.RULES;
    }
  }
  else if(gameState == GameState.RULES){
    drawText(new Vec(50, 50), "Do not touch bricks with your ball!");
    drawText(new Vec(50, 150), "Tap-Hold to go down faster.");
    drawTapToContinue();

    if(mouseDownJust()){
      gameState = GameState.ACTION;
      reset();
    }

  }
  else if(gameState == GameState.ACTION){
    ballAngleVel -= ballAngle * 0.0006;
    ballAngle += ballAngleVel;

    var ballPos = getBallPos();

    worldVel += 0.05;
    if(mouseDown) worldVel += 0.15;
    worldVel *= 0.9;

    for(var i = bricks.length - 1; i >= 0; i--){
      var brick = bricks[i];
      var r = brick.rect;
      r.min.y -= worldVel;
      r.max.y -= worldVel;

      if(collides(r, ballPos, ballR)){
        brick.hit = true;
        gameState = GameState.FAIL;
      }
    }

    updateBg(ballPos);
    drawBg();

    drawBall(ballPos);
    drawBricks();
  }
  else if(gameState == GameState.FAIL){
    failTickCount++;
    if(failTickCount > 60){
      failTickCount = 0;
      gameState = GameState.TITLE;
    }

    var ballPos = getBallPos();

    updateBg(ballPos);
    drawBg();

    drawBall(ballPos);
    drawBricks();
    drawText(new Vec(150, 100), "EPIC FAIL!");
  }
  else{
    console.error("not implemented game state: " + gameState);
  }

  tickCount++;
};

window.onload = function() {
  var canvas = document.getElementById("canvas");
  // @ts-ignore
  canvas.width = CANVAS_W;
  // @ts-ignore
  canvas.height = CANVAS_H;
  // @ts-ignore
  canvasContext = canvas.getContext("2d");
  canvasContext.font = "bold 20px Calibri";

  document.onmousedown = function(e) {
    mouseEventDown = true;
    mouseEventUp = !mouseEventDown;
  };
  document.onmouseup = function(e) {
    mouseEventUp = true;
    mouseEventDown = !mouseEventUp;
  };
  document.ontouchstart = document.ontouchend = function(e) {
    mouseEventDown = (e.touches.length > 0);
    mouseEventUp = !mouseEventDown;

    if(mouseEventDown){
      var touch = e.touches[0];
      mousePos.x = touch.pageX;
      mousePos.y = touch.pageY;
    }
  };
  document.onmousemove = function(e) {
    mousePos.x = e.pageX;
    mousePos.y = e.pageY;
  };
  document.ontouchmove = function(e) {
    var touch = e.touches[0];
    mousePos.x = touch.pageX;
    mousePos.y = touch.pageY;
  }

  tick();
};
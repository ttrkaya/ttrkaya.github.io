const CANVAS_W = 700;
const CANVAS_H = CANVAS_W;

const ARENA_R = 330;
const CENTER_R = 25;
const BALL_R = 15;

class Vec {
  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }
  copy() { return new Vec(this.x, this.y); }

  len2() { return this.x * this.x + this.y * this.y; }
  len() { return Math.sqrt(this.len2()); }

  dot(v) { return this.x * v.x + this.y * v.y; }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }
  scale(n) {
    this.x *= n;
    this.y *= n;
    return this;
  }
  rotate(angle) {
    let cos = Math.cos(angle);
    let sin = Math.sin(angle);
    let tx = this.x;
    let ty = this.y;
    this.x = tx * cos - ty * sin;
    this.y = ty * cos + tx * sin;
    return this;
  }

  toText() { return Math.round(this.x) + " : " + Math.round(this.y); }

  move(context) { context.moveTo(this.x, this.y); }
  line(context) { context.lineTo(this.x, this.y); }
  circle(context, r) { context.arc(this.x, this.y, r, 0, 2 * Math.PI); }
}

function lineSegmentCircleCollides(c, r, a, b) {
  let dc = c.copy().sub(a);
  let db = b.copy().sub(a);
  let t = dc.dot(db) / db.dot(db);
  t = Math.min(1, Math.max(t, 0));
  let closest = a.copy().add(db.copy().scale(t));
  let dp = c.copy().sub(closest);
  return dp.len2() < r * r;
}

const CENTER = new Vec(CANVAS_W / 2, CANVAS_H / 2);

const ball = {
  pos: new Vec(),
  vel: new Vec(),
  r: BALL_R,
};

let canvas = null;
let gfx = null;

const input = {
  mousePos: new Vec(),
  mouseDown: false,
  mouseDownPrev: false,
  mouseEventDown: false,
  mouseEventUp: false,

  mouseDownJust() { return this.mouseDown && !this.mouseDownPrev; },

  update() {
    this.mouseDownPrev = this.mouseDown;
    if (this.mouseEventDown) {
      this.mouseEventDown = false;
      this.mouseDown = true;
    }
    if (this.mouseEventUp) {
      this.mouseEventUp = false;
      this.mouseDown = false;
    }
  },

  updateMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    this.mousePos.x = e.clientX - rect.left;
    this.mousePos.y = e.clientY - rect.top;
  }
};

let bgPointsOrig = [];
const DP = 20;
for (let y = -DP; y <= CANVAS_H + DP; y += DP) {
  let line = [];
  bgPointsOrig.push(line);
  for (let x = -DP; x <= CANVAS_W + DP; x += DP) {
    line.push(new Vec(x, y));
  }
}

let bgPoints = [];
function resetBgPoints() {
  bgPoints = [];
  for (let iy = bgPointsOrig.length - 1; iy >= 0; iy--) {
    let lineOrig = bgPointsOrig[iy];
    let line = [];
    bgPoints.push(line);
    for (let ix = lineOrig.length - 1; ix >= 0; ix--) {
      line.push(lineOrig[ix].copy());
    }
  }
}

function updateBg(ballPos) {
  for (let iy = bgPointsOrig.length - 1; iy >= 0; iy--) {
    let lineOrig = bgPointsOrig[iy];
    let line = bgPoints[iy];
    for (let ix = lineOrig.length - 1; ix >= 0; ix--) {
      let pOrig = lineOrig[ix];
      let dx = pOrig.x - ballPos.x;
      let dy = pOrig.y - ballPos.y;
      let d2 = dx * dx + dy * dy;
      let d = Math.sqrt(d2) + 20;

      const F = 50;
      let p = line[ix];
      p.x = pOrig.x + F * dx / d;
      p.y = pOrig.y + F * dy / d;
    }
  }
}

function drawBg() {
  gfx.strokeStyle = "hsl(240, 80.00%, 19.60%)";
  gfx.beginPath();
  const h = bgPoints.length;
  const w = bgPoints[0].length;
  for (let iy = 0; iy < h; iy++) {
    let line = bgPoints[iy];
    line[0].move(gfx);
    for (let ix = 1; ix < w; ix++) {
      line[ix].line(gfx);
    }
  }
  for (let ix = 0; ix < w; ix++) {
    bgPoints[0][ix].move(gfx);
    for (let iy = 1; iy < h; iy++) {
      bgPoints[iy][ix].line(gfx);
    }
  }
  gfx.stroke();
}

function tick() {
  requestAnimationFrame(tick);

  input.update();

  ball.vel.scale(1.0001);
  ball.pos.add(ball.vel);

  let paddleNormal = CENTER.copy().sub(input.mousePos);
  paddleNormal.scale(1.0 / paddleNormal.len());

  const SPREAD_ANGLE = 0.4;
  let paddleCornerA = paddleNormal.copy().rotate(+SPREAD_ANGLE).scale(-ARENA_R).add(CENTER);
  let paddleCornerB = paddleNormal.copy().rotate(-SPREAD_ANGLE).scale(-ARENA_R).add(CENTER);

  if (lineSegmentCircleCollides(ball.pos, ball.r, paddleCornerA, paddleCornerB) && ball.vel.dot(paddleNormal) < 0) {
    let dv = ball.vel.dot(paddleNormal);
    ball.vel.sub(paddleNormal.copy().scale(dv * 2));
  }

  let ballDp = ball.pos.copy().sub(CENTER);
  const BALL_DIST_MAX = ARENA_R - ball.r;
  if (BALL_DIST_MAX * BALL_DIST_MAX < ballDp.len2() && 0 < ball.vel.dot(ballDp)) {
    let normal = ballDp.scale(-1.0 / ballDp.len());
    let dv = ball.vel.dot(normal);
    ball.vel.sub(normal.copy().scale(dv * 2));
  }

  const BALL_DIST_MIN = CENTER_R + ball.r;
  if (ballDp.len2() < BALL_DIST_MIN * BALL_DIST_MIN && ball.vel.dot(ballDp) < 0) {
    let normal = ballDp.scale(1.0 / ballDp.len());
    let dv = ball.vel.dot(normal);
    ball.vel.sub(normal.copy().scale(dv * 2));
  }

  // clear
  gfx.fillStyle = "hsl(240, 78.10%, 12.50%)";
  gfx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  updateBg(ball.pos);
  drawBg();

  gfx.strokeStyle = "white";
  gfx.beginPath();
  CENTER.circle(gfx, ARENA_R);
  gfx.stroke();

  gfx.fillStyle = "green";
  gfx.strokeStyle = "black";
  gfx.beginPath();
  paddleCornerA.move(gfx);
  paddleCornerB.line(gfx);
  let offset = paddleNormal.copy().scale(-20);
  paddleCornerB.copy().add(offset).line(gfx);
  paddleCornerA.copy().add(offset).line(gfx);
  gfx.closePath();
  gfx.fill();
  gfx.stroke();

  gfx.fillStyle = "white";
  gfx.beginPath();
  ball.pos.circle(gfx, ball.r);
  gfx.fill();

  gfx.strokeStyle = "white";
  gfx.beginPath();
  CENTER.circle(gfx, CENTER_R);
  gfx.stroke();

  // mouse circle
  gfx.strokeStyle = "yellow";
  gfx.beginPath();
  input.mousePos.circle(gfx, 3);
  gfx.stroke();
}

export function init() {
  ball.pos = CENTER.copy();
  ball.vel = new Vec(1, 1);

  canvas = document.getElementById("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  gfx = canvas.getContext("2d");
  gfx.font = "bold 20px Calibri";

  document.onmousedown = function (e) {
    input.mouseEventDown = true;
    input.mouseEventUp = !input.mouseEventDown;
    input.updateMousePos(e);
  };
  document.onmouseup = function (e) {
    input.mouseEventUp = true;
    input.mouseEventDown = !input.mouseEventUp;
    input.updateMousePos(e);
  };
  document.ontouchstart = document.ontouchend = function (e) {
    input.mouseEventDown = (e.touches.length > 0);
    input.mouseEventUp = !input.mouseEventDown;
    if (input.mouseEventDown) {
      input.updateMousePos(e.touches[0]);
    }
  };
  document.onmousemove = function (e) {
    input.updateMousePos(e);
  };
  document.ontouchmove = function (e) {
    input.updateMousePos(e.touches[0]);
  };

  resetBgPoints();
  tick();
}

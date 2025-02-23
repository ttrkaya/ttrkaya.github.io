const CANVAS_W = 700;
const CANVAS_H = CANVAS_W;

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
  ellipse(context, rx, ry) { context.ellipse(this.x, this.y, rx, ry, 0, 0, 2 * Math.PI); }
}

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

let angle = 0;
function tick() {
  requestAnimationFrame(tick);
  input.update();

  // clear
  gfx.fillStyle = "hsl(69, 46.50%, 13.90%)";
  gfx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  angle += 0.01;
  gfx.save(); {
    gfx.translate(CANVAS_W / +2, CANVAS_W / +2);
    gfx.rotate(angle);
    gfx.translate(CANVAS_W / -2, CANVAS_W / -2);

    const R_B = 65;
    const R_S = 50;
    const CENTER = new Vec(CANVAS_W / 2, CANVAS_H / 2);
    let SIZE = new Vec(CANVAS_W / 3 + 100 * Math.sin(angle * 2.345324), CANVAS_H / 3 + 100 * Math.sin(angle * 3.2344523));
    //SIZE = input.mousePos.copy();
    let pathB = new Path2D();
    pathB.roundRect(CENTER.x - SIZE.x / 2 - R_B, CENTER.y - SIZE.y / 2 - R_B, SIZE.x + 2 * R_B, SIZE.y + 2 * R_B, R_B);
    let pathS = new Path2D();
    pathS.roundRect(CENTER.x - SIZE.x / 2 - R_S, CENTER.y - SIZE.y / 2 - R_S, SIZE.x + 2 * R_S, SIZE.y + 2 * R_S, R_S);
    let pathSum = new Path2D(pathB);
    pathSum.addPath(pathS);

    gfx.fillStyle = "hsl(233, 81.00%, 10.00%)";
    gfx.fill(pathB);
    gfx.fillStyle = "hsl(233, 81.00%, 21.00%)";
    gfx.fill(pathS);

    let shineDir = new Vec(-1, -2);
    shineDir.scale(1.0 / shineDir.len());
    shineDir.rotate(-angle);

    gfx.save(); {
      gfx.clip(pathSum, `evenodd`);

      let shineCenter = CENTER.copy().add(shineDir.copy().scale(SIZE.y + R_B));
      gfx.fillStyle = `white`;
      gfx.beginPath();
      shineCenter.circle(gfx, 0.4 * SIZE.y + R_B);
      gfx.fill();
    } gfx.restore();

    const EYE_R = Math.min(SIZE.x, SIZE.y) * 0.4;
    const EYE_Y = CENTER.y - SIZE.y / 6;
    const EYE_SEP = SIZE.x / 3;
    let eyeL = new Vec(CENTER.x - EYE_SEP, EYE_Y);
    let eyeR = new Vec(CENTER.x + EYE_SEP, EYE_Y);
    gfx.fillStyle = "white";
    gfx.beginPath();
    eyeL.circle(gfx, EYE_R);
    eyeR.circle(gfx, EYE_R);
    gfx.fill();
    gfx.fillStyle = "black";
    gfx.beginPath();
    eyeL.circle(gfx, EYE_R / 2);
    eyeR.circle(gfx, EYE_R / 2);
    gfx.fill();
    let shineOffsetEye = shineDir.copy().scale(EYE_R / 2);
    gfx.fillStyle = "white";
    gfx.beginPath();
    eyeL.copy().add(shineOffsetEye).circle(gfx, EYE_R / 3);
    eyeR.copy().add(shineOffsetEye).circle(gfx, EYE_R / 3);
    gfx.fill();

    let mountCenter = new Vec(CENTER.x, CENTER.y + SIZE.y * (0.3 + 0.15 * SIZE.x / SIZE.y));
    let pathMouth = new Path2D();
    mountCenter.ellipse(pathMouth, (SIZE.x + R_B) * 0.3, (SIZE.y + R_B) * 0.1);

    gfx.fillStyle = "black";
    gfx.fill(pathMouth);

    gfx.save(); {
      gfx.clip(pathMouth);
      gfx.translate(0, -25);

      gfx.fillStyle = `white`;
      gfx.fill(pathMouth);

      gfx.fillStyle = "black";
      gfx.beginPath();
      const TEETH_GAP_HALF = 3;
      gfx.rect(mountCenter.x - TEETH_GAP_HALF, 0, TEETH_GAP_HALF * 2, CANVAS_H);
      gfx.fill();
    } gfx.restore();

  } gfx.restore();


  gfx.fillStyle = `blue`;
  gfx.fillRect(650, 650, 30, 30);

  // mouse circle
  // gfx.strokeStyle = "yellow";
  // gfx.beginPath();
  // input.mousePos.circle(gfx, 3);
  // gfx.stroke();
}

export function init() {
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

  tick();
}

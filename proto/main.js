// @ts-check

const CANVAS_W = 400;
const CANVAS_H = 400;

function Vec(x, y){
  this.x = x || 0;
  this.y = y || 0;
};
Vec.prototype.getCopy = function(){
  return new Vec(this.x, this.y);
};
Vec.prototype.add = function(v){
  this.x += v.x;
  this.y += v.y;
  return this;
};
Vec.prototype.sub = function(v){
  this.x -= v.x;
  this.y -= v.y;
  return this;
};
Vec.prototype.scale = function(n){
  this.x *= n;
  this.y *= n;
  return this;
};
Vec.prototype.rotate = function(angle){
  let cos = Math.cos(angle);
  let sin = Math.sin(angle);
  let tx = this.x;
  let ty = this.y;
  this.x = tx * cos - ty * sin;
  this.y = ty * cos + tx * sin;
  return this;
};
Vec.prototype.toText = function(){
  return Math.round(this.x) + " : " + Math.round(this.y);
};

let input = {
  mousePos : new Vec(),
  mouseDown : false,
  mouseDownPrev : false,
  mouseDownJust : function() { 
    return input.mouseDown && !input.mouseDownPrev; 
  },
  mouseEventDown : false,
  mouseEventUp : false,

  update : function(){
    input.mouseDownPrev = input.mouseDown;
    if(input.mouseEventDown){
      input.mouseEventDown = false;
      input.mouseDown = true;
    }
    if(input.mouseEventUp){
      input.mouseEventUp = false;
      input.mouseDown = false;
    }
  },
}

let render = {
  canvasContext : null,
  clear : function(){
    render.canvasContext.clearRect(0, 0, CANVAS_W, CANVAS_H);
    render.drawRect(new Vec(0, 0), new Vec(CANVAS_W, CANVAS_H), "#cccccc");
  },
  drawLine : function(from, to, color){
    let ctx = render.canvasContext;
    ctx.strokeStyle = color || "#000000";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  },
  drawCircle : function(center, r, color){
    let ctx = render.canvasContext;
    ctx.fillStyle = color || "#000000";
    ctx.beginPath();
    ctx.arc(center.x, center.y, r, 0, 2*Math.PI);
    ctx.fill();
  },
  drawRect : function(from, size, color){
    render.canvasContext.fillStyle = color || "#000000";
    render.canvasContext.fillRect(from.x, from.y, size.x, size.y);
  },
  drawText : function(pos, text, color) {
    render.canvasContext.fillStyle = color || "#000000";
    render.canvasContext.fillText(text, pos.x, pos.y);
  },
};

let bgPointsOrig = [];
const DP = 20
for(let y = -DP; y <= CANVAS_H + DP; y += DP){
  let line = [];
  bgPointsOrig.push(line);
  for(let x = -DP; x <= CANVAS_W + DP; x += DP){
    line.push(new Vec(x, y));
  }
}

let bgPoints = [];
function resetBgPoints(){
  bgPoints = [];
  for(let iy = bgPointsOrig.length - 1; iy >= 0; iy--){
    let lineOrig = bgPointsOrig[iy];
    let line = [];
    bgPoints.push(line)
    for(let ix = lineOrig.length - 1; ix >= 0; ix--){
      line.push(lineOrig[ix].getCopy());
    }
  }
}

function updateBg(ballPos){
  for(let iy = bgPointsOrig.length - 1; iy >= 0; iy--){
    let lineOrig = bgPointsOrig[iy];
    let line = bgPoints[iy];
    for(let ix = lineOrig.length - 1; ix >= 0; ix--){
      let pOrig = lineOrig[ix];
      let dx = pOrig.x - ballPos.x;
      let dy = pOrig.y - ballPos.y; 
      let d2 = dx * dx + dy * dy;
      let d = Math.sqrt(d2) + 20;

      const F = 30;
      let p = line[ix];
      p.x = pOrig.x + F * dx / d;
      p.y = pOrig.y + F * dy / d;
    }
  }
}

function drawBg(){
  let color = "#0000ff";
  for(let iy = bgPoints.length - 1; iy >= 0; iy--){
    let line = bgPoints[iy];
    for(let ix = line.length - 1; ix >= 0; ix--){
      if(ix > 0){
        render.drawLine(line[ix], line[ix - 1], color);
      }
      if(iy > 0){
        render.drawLine(line[ix], bgPoints[iy - 1][ix], color);
      }
    }
  }
}

function tick() {
  requestAnimationFrame(tick);
  input.update();
  render.clear();

  updateBg(input.mousePos);
  drawBg();
};

window.onload = function() {
  let canvas = document.getElementById("canvas");
  // @ts-ignore
  canvas.width = CANVAS_W;
  // @ts-ignore
  canvas.height = CANVAS_H;
  // @ts-ignore
  render.canvasContext = canvas.getContext("2d");
  render.canvasContext.font = "bold 20px Calibri";

  document.onmousedown = function(e) {
    input.mouseEventDown = true;
    input.mouseEventUp = !input.mouseEventDown;
  };
  document.onmouseup = function(e) {
    input.mouseEventUp = true;
    input.mouseEventDown = !input.mouseEventUp;
  };
  document.ontouchstart = document.ontouchend = function(e) {
    input.mouseEventDown = (e.touches.length > 0);
    input.mouseEventUp = !input.mouseEventDown;

    if(input.mouseEventDown){
      let touch = e.touches[0];
      input.mousePos.x = touch.pageX;
      input.mousePos.y = touch.pageY;
    }
  };
  document.onmousemove = function(e) {
    input.mousePos.x = e.pageX;
    input.mousePos.y = e.pageY;
  };
  document.ontouchmove = function(e) {
    let touch = e.touches[0];
    input.mousePos.x = touch.pageX;
    input.mousePos.y = touch.pageY;
  }

  resetBgPoints()

  tick();
};
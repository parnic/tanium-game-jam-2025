const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI * 0.5;
const timeStep = 1 / 60;
const numParticles = 256;

let ctx: CanvasRenderingContext2D | null;
export let viewHeight: number;
export let viewWidth: number;

class Point {
  x: number;
  y: number;

  constructor(x?: number, y?: number) {
    this.x = x || 0;
    this.y = y || 0;
  }
}

class Particle {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
  time: number;
  duration: number;
  color: string;
  w: number;
  h: number;
  complete: boolean;
  r = 0;
  x = 0;
  y = 0;
  sy = 0;

  constructor(p0: Point, p1: Point, p2: Point, p3: Point) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;

    this.time = 0;
    this.duration = 3 + Math.random() * 2;
    this.color = `#${Math.floor(Math.random() * 0xffffff).toString(16)}`;

    this.w = 8;
    this.h = 6;

    this.complete = false;
  }

  update() {
    this.time = Math.min(this.duration, this.time + timeStep);

    var f = Ease.outCubic(this.time, 0, 1, this.duration);
    var p = cubeBezier(this.p0, this.p1, this.p2, this.p3, f);

    var dx = p.x - this.x;
    var dy = p.y - this.y;

    this.r = Math.atan2(dy, dx) + HALF_PI;
    this.sy = Math.sin(Math.PI * f * 10);
    this.x = p.x;
    this.y = p.y;

    this.complete = this.time === this.duration;
  }

  draw() {
    if (!ctx) {
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.r);
    ctx.scale(1, this.sy);

    ctx.fillStyle = this.color;
    ctx.fillRect(-this.w * 0.5, -this.h * 0.5, this.w, this.h);

    ctx.restore();
  }
}

class Exploder {
  x: number;
  y: number;
  startRadius: number;
  time: number;
  duration: number;
  progress: number;
  complete: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;

    this.startRadius = 24;

    this.time = 0;
    this.duration = 0.4;
    this.progress = 0;

    this.complete = false;
  }

  reset() {
    this.time = 0;
    this.progress = 0;
    this.complete = false;
  }

  update() {
    this.time = Math.min(this.duration, this.time + timeStep);
    this.progress = Ease.inBack(this.time, 0, 1, this.duration, 0);

    this.complete = this.time === this.duration;
  }

  draw() {
    if (!ctx) {
      return;
    }

    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.startRadius * (1 - this.progress), 0, TWO_PI);
    ctx.fill();
  }
}

let particles: Particle[] = [],
  exploder: Exploder,
  phase = 0;

export function updateEffectsCanvasSize() {
  const gameCanvas = document.getElementById("game") as HTMLCanvasElement;
  const effectsCanvas = document.getElementById("effects") as HTMLCanvasElement;

  effectsCanvas.style.setProperty(
    "height",
    gameCanvas.style.getPropertyValue("height"),
  );
  effectsCanvas.style.setProperty(
    "width",
    gameCanvas.style.getPropertyValue("width"),
  );

  viewWidth = gameCanvas.offsetWidth;
  viewHeight = gameCanvas.offsetHeight;

  effectsCanvas.height = viewHeight;
  effectsCanvas.width = viewWidth;
}

function initDrawingCanvas() {
  updateEffectsCanvasSize();
  const effectsCanvas = document.getElementById("effects") as HTMLCanvasElement;
  ctx = effectsCanvas.getContext("2d");

  createExploder();
  createParticles();
}

function createExploder() {
  exploder = new Exploder(viewWidth * 0.5, 0);
}

function createParticles() {
  for (let i = 0; i < numParticles; i++) {
    const p0 = new Point(viewWidth * 0.5, 0);
    const p1 = new Point(Math.random() * viewWidth, Math.random() * viewHeight);
    const p2 = new Point(Math.random() * viewWidth, Math.random() * viewHeight);
    const p3 = new Point(Math.random() * viewWidth, viewHeight + 64);

    particles.push(new Particle(p0, p1, p2, p3));
  }
}

function update() {
  switch (phase) {
    case 1:
      exploder.update();
      break;
    case 2:
      particles.forEach((p) => {
        p.update();
      });
      break;
  }
}

function draw() {
  ctx?.clearRect(0, 0, viewWidth, viewHeight);

  switch (phase) {
    case 1:
      // exploder.draw();
      break;
    case 2:
      particles.forEach((p) => {
        p.draw();
      });
      break;
  }
}

export function triggerConfetti() {
  resetParticles();
  phase = 1;
}

window.onload = () => {
  initDrawingCanvas();
  requestAnimationFrame(loop);
};

function loop() {
  update();
  draw();

  if (phase === 1) {
    phase = 2;
  } else if (checkParticlesComplete()) {
    resetParticles();
  }

  requestAnimationFrame(loop);
}

function resetParticles() {
  phase = 0;
  exploder.reset();
  particles.length = 0;
  createParticles();
}

function checkParticlesComplete() {
  for (let i = 0; i < particles.length; i++) {
    if (particles[i].complete === false) return false;
  }
  return true;
}

/**
 * easing equations from http://gizma.com/easing/
 * t = current time
 * b = start value
 * c = delta value
 * d = duration
 */
const Ease = {
  inCubic: (t: number, b: number, c: number, d: number) => {
    t /= d;
    return c * t * t * t + b;
  },
  outCubic: (t: number, b: number, c: number, d: number) => {
    t /= d;
    t--;
    return c * (t * t * t + 1) + b;
  },
  inOutCubic: (t: number, b: number, c: number, d: number) => {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t * t + b;
    t -= 2;
    return (c / 2) * (t * t * t + 2) + b;
  },
  inBack: (t: number, b: number, c: number, d: number, s: number) => {
    s = s || 1.70158;
    t /= d;
    return c * t * t * ((s + 1) * t - s) + b;
  },
};

function cubeBezier(p0: Point, c0: Point, c1: Point, p1: Point, t: number) {
  var p = new Point();
  var nt = 1 - t;

  p.x =
    nt * nt * nt * p0.x +
    3 * nt * nt * t * c0.x +
    3 * nt * t * t * c1.x +
    t * t * t * p1.x;
  p.y =
    nt * nt * nt * p0.y +
    3 * nt * nt * t * c0.y +
    3 * nt * t * t * c1.y +
    t * t * t * p1.y;

  return p;
}

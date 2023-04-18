// Game

const KEY_ARROW_LEFT = 0;
const KEY_ARROW_RIGHT = 1;

const PADDLE_SPEED = 20;

const data = {
  mode: 0, // 0: init, 1: playing

  paddle: {
    x: 0,
    y: 0,
    width: 100,
    height: 20,
  },

  window: {
    width: 800,
    height: 600,
  },

  keys: {
    [KEY_ARROW_LEFT]: {
      down: false,
    },
    [KEY_ARROW_RIGHT]: {
      down: false,
    },
  }
};

function game_keydown(key) {
  data.keys[key].down = true;
}

function game_keyup(key) {
  data.keys[key].down = false;
}

function game_update(currentTime) {
  if (data.keys[KEY_ARROW_LEFT].down)
    data.paddle.x = Math.max(0, data.paddle.x - PADDLE_SPEED);
  else if (data.keys[KEY_ARROW_RIGHT].down)
    data.paddle.x = Math.min(data.window.width - data.paddle.width, data.paddle.x + PADDLE_SPEED);

  // Initialize game state
  if (data.mode === 0) {
    data.paddle.y = data.window.height - data.paddle.height;
    data.mode = 1;
  }

  // Render
  const rect = { width: data.paddle.width, height: data.paddle.height, x: data.paddle.x, y: data.paddle.y };
  platform_render_rect(rect);

  // for (const [key, value] of Object.entries(data.keys)) {
  //   data.keys[key].down = false;
  // }
}

// Platform

const renderer = {
  canvas: null,
  ctx: null,
};

const platformKeys = {
  37: KEY_ARROW_LEFT,
  39: KEY_ARROW_RIGHT,
};

function platform_keydown(e) {
  const key = platformKeys[e.keyCode];
  if (key === undefined)
    return console.log("e.keyCode", e.keyCode);
  game_keydown(key);
}

function platform_keyup(e) {
  const key = platformKeys[e.keyCode];
  if (key === undefined)
    return console.log("e.keyCode", e.keyCode);
  game_keyup(key);
}

function platform_resize() {
  platform_log("platform_resize", window.innerWidth, window.innerHeight);
  data.window.width = window.innerWidth;
  data.window.height = window.innerHeight;
}

function platform_update(currentTime) {
  renderer.canvas.width = data.window.width;
  renderer.canvas.height = data.window.height;

  game_update(currentTime);
  window.requestAnimationFrame(platform_update);
}

function platform_log(...args) {
  console.log(JSON.stringify(args, null, 2));
  // document.writeln(args.join(" "));
}

function platform_render_rect({ width, height, x, y }) {
  // platform_log({ width, height, x, y });

  renderer.ctx.rect(x, y, width, height);
  renderer.ctx.fill();
}

function platform_init() {
  renderer.canvas = document.createElement("canvas");
  renderer.ctx = renderer.canvas.getContext("2d");

  document.body.appendChild(renderer.canvas);
  renderer.canvas.style = "position: absolute; inset: 0; display: block; width: 100%; height: 100%;";

  data.window.width = window.innerWidth;
  data.window.height = window.innerHeight;
}

platform_init();
window.requestAnimationFrame(platform_update);

document.addEventListener("keydown", platform_keydown);
document.addEventListener("keyup", platform_keyup);
window.addEventListener("resize", platform_resize);

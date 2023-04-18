// Game

const KEY_ARROW_LEFT = 0;
const KEY_ARROW_RIGHT = 1;

const PADDLE_SPEED = 20;
const BALL_SPEED = 5;

const data = {
  mode: 0, // 0: init, 1: playing

  window: {
    width: 800,
    height: 600,
  },

  paddle: {
    x: 0,
    y: 0,
    width: 100,
    height: 20,
  },

  balls: [
    {
      x: 0,
      y: 0,
      width: 20,
      height: 20,
      velocityX: 1,
      velocityY: 1,
      destroyed: false,
    },
  ],

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
  // Initialize game state
  if (data.mode === 0) {
    data.paddle.y = data.window.height - data.paddle.height;
    data.mode = 1;
  }

  // Updte
  if (data.keys[KEY_ARROW_LEFT].down)
    data.paddle.x = Math.max(0, data.paddle.x - PADDLE_SPEED);
  else if (data.keys[KEY_ARROW_RIGHT].down)
    data.paddle.x = Math.min(data.window.width - data.paddle.width, data.paddle.x + PADDLE_SPEED);

    for (let ballIndex = 0; ballIndex < data.balls.length; ballIndex++) {
      const ball = data.balls[ballIndex];

      ball.x += ball.velocityX * BALL_SPEED;
      if (ball.x + ball.width > data.window.width || ball.x < 0)
        ball.velocityX = -ball.velocityX;

      ball.y += ball.velocityY * BALL_SPEED;
      if (ball.y > data.window.height)
        ball.destroyed = true;
    }

  // Render
  {
    const rect = { width: data.paddle.width, height: data.paddle.height, x: data.paddle.x, y: data.paddle.y };
    platform_render_rect(rect, "black");
  }

  for (let ballIndex = 0; ballIndex < data.balls.length; ballIndex++) {
    const ball = data.balls[ballIndex];

    // TODO: Free memory at some point
    if (ball.destroyed) {
      continue;
    }

    const rect = { width: ball.width, height: ball.height, x: ball.x, y: ball.y };
    platform_render_rect(rect, "red");
  }

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
  if (key === undefined) {
    // console.log("e.keyCode", e.keyCode);
    return;
  }
  game_keydown(key);
}

function platform_keyup(e) {
  const key = platformKeys[e.keyCode];
  if (key === undefined) {
    // console.log("e.keyCode", e.keyCode);
    return;
  }
  game_keyup(key);
}

function platform_resize() {
  console.log("platform_resize", window.innerWidth, window.innerHeight);
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

function platform_render_rect({ width, height, x, y }, color) {
  renderer.ctx.fillStyle = color;
  renderer.ctx.fillRect(x, y, width, height);
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

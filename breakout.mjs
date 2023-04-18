// Game

const KEY_MOVE_LEFT = 0;
const KEY_MOVE_RIGHT = 1;
const KEY_CONFIRM = 2;

const BACKGROUND_COLOR = "#ffffff"
const PADDLE_SPEED = 20;
const PADDLE_COLOR = "#000000";
const BALL_SPEED = 10;
const BALL_SIZE = 20;
const BALL_COLOR = "red";
const BLOCK_COLOR = "blue";

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
  balls: [],
  blocks: [],

  keys: {
    [KEY_MOVE_LEFT]: {
      down: false,
      released: false,
    },
    [KEY_MOVE_RIGHT]: {
      down: false,
      released: false,
    },
    [KEY_CONFIRM]: {
      down: false,
      released: false,
    },
  }
};

function game_keydown(key) {
  data.keys[key].down = true;
}

function game_keyup(key) {
  data.keys[key].down = false;
  data.keys[key].released = true;
}

function game_is_point_inside(point, box) {
  return (point.x >= box.x && point.x <= box.x + box.width) &&
         (point.y >= box.y && point.y <= box.y + box.height);
}

function game_spawn_ball() {
  data.balls.push({
    x: data.paddle.x + data.paddle.width/2,
    y: data.paddle.y - data.paddle.height,
    width: BALL_SIZE,
    height: BALL_SIZE,
    velocityX: 1,
    velocityY: -1,
    color: BALL_COLOR,
    destroyed: false,
  });
}

function game_update(currentTime) {
  // Initialize game state
  if (data.mode === 0) {
    data.paddle.x = 100;
    data.paddle.y = data.window.height - data.paddle.height;

    game_spawn_ball();

    data.mode = 1;
  }

  // Update
  if (data.keys[KEY_MOVE_LEFT].down) {
    data.paddle.x = Math.max(0, data.paddle.x - PADDLE_SPEED);
  }
  else if (data.keys[KEY_MOVE_RIGHT].down) {
    data.paddle.x = Math.min(data.window.width - data.paddle.width, data.paddle.x + PADDLE_SPEED);
  }

  if (data.keys[KEY_CONFIRM].released) {
    game_spawn_ball();
  }

  for (let ballIndex = 0; ballIndex < data.balls.length; ballIndex++) {
    const ball = data.balls[ballIndex];

    if (ball.destroyed)
      continue;

    ball.x += ball.velocityX * BALL_SPEED;
    if (ball.x + ball.width > data.window.width || ball.x < 0)
      ball.velocityX = -ball.velocityX;

    ball.y += ball.velocityY * BALL_SPEED;
    if (ball.y < 0)
      ball.velocityY = -ball.velocityY;
    if (ball.y > data.window.height)
      ball.destroyed = true;

    if (game_is_point_inside(ball, data.paddle)) {
      // TODO: Handle collision from the left/right
      ball.velocityY = -ball.velocityY;
      ball.y = data.paddle.y - data.paddle.height;
    }

    for (let blockIndex = 0; blockIndex < data.blocks.length; blockIndex++) {
      const block = data.blocks[blockIndex];
      if (block.destroyed === false && game_is_point_inside(ball, block)) {
        // TODO: Handle collision from the left/right
        ball.velocityY = -ball.velocityY;
        block.destroyed = true;
      }
    }
  }

  // Render
  {
    const rect = { x: 0, y: 0, width: data.window.width, height: data.window.height };
    platform_render_rect(rect, BACKGROUND_COLOR);
  }

  for (let blockIndex = 0; blockIndex < data.blocks.length; blockIndex++) {
    const block = data.blocks[blockIndex];

    // TODO: Free memory at some point
    if (block.destroyed) {
      continue;
    }

    const rect = { x: block.x, y: block.y, width: block.width, height: block.height };
    platform_render_rect(rect, block.color);
  }

  for (let ballIndex = 0; ballIndex < data.balls.length; ballIndex++) {
    const ball = data.balls[ballIndex];

    // TODO: Free memory at some point
    if (ball.destroyed) {
      continue;
    }

    const rect = { width: ball.width, height: ball.height, x: ball.x, y: ball.y };
    platform_render_rect(rect, ball.color);
  }

  {
    const rect = { x: data.paddle.x, y: data.paddle.y, width: data.paddle.width, height: data.paddle.height };
    platform_render_rect(rect, PADDLE_COLOR);
  }

  // Reset input state at the end of the frame
  for (const [key, value] of Object.entries(data.keys)) {
    data.keys[key].released = false;
  }
}

// Platform

const renderer = {
  canvas: null,
  ctx: null,
};

const platformKeys = {
  37: KEY_MOVE_LEFT,
  39: KEY_MOVE_RIGHT,
  32: KEY_CONFIRM,
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

function platform_render_rect({ x, y, width, height }, color) {
  renderer.ctx.fillStyle = color;
  renderer.ctx.fillRect(x, y, width, height);
}

export function platform_init(blocks) {
  renderer.canvas = document.createElement("canvas");
  renderer.ctx = renderer.canvas.getContext("2d");

  document.body.appendChild(renderer.canvas);
  renderer.canvas.style = "position: absolute; inset: 0; display: block; width: 100%; height: 100%;";

  data.window.width = window.innerWidth;
  data.window.height = window.innerHeight;

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const block = blocks[blockIndex];
    const rect = block.getClientRects()[0];

    data.blocks.push({
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y,
      color: BLOCK_COLOR,
      destroyed: false,
    });
    console.log(data.blocks[data.blocks.length-1]);
  }

  window.requestAnimationFrame(platform_update);
  document.addEventListener("keydown", platform_keydown);
  document.addEventListener("keyup", platform_keyup);
  window.addEventListener("resize", platform_resize);
}

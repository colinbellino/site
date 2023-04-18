import {
  platform_clear_rect,
  platform_render_rect,
  platform_get_blocks,
  platform_log,
  platform_error,
} from "./breakout_platform.mjs"

export const KEY_MOVE_LEFT = 0;
export const KEY_MOVE_RIGHT = 1;
export const KEY_CONFIRM = 2;

const BACKGROUND_COLOR = "#ffffff"
const PADDLE_SPEED = 20;
const PADDLE_COLOR = "#000000";
const BALL_SPEED = 10;
const BALL_SIZE = 20;
const BALL_COLOR = "red";
const BLOCK_COLOR_ON = "transparent";
const BLOCK_COLOR_OFF = "white";

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

export function game_keydown(key) {
  data.keys[key].down = true;
}

export function game_keyup(key) {
  data.keys[key].down = false;
  data.keys[key].released = true;
}

export function game_resize(width, height) {
  data.window.width = width;
  data.window.height = height;
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

export function game_update(currentTime) {
  // Initialize game state
  if (data.mode === 0) {
    data.paddle.x = 100;
    data.paddle.y = data.window.height - data.paddle.height;


    const blocks = platform_get_blocks();
    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
      const block = blocks[blockIndex];
      const rect = block.getClientRects()[0];

      data.blocks.push({
        width: rect.width + 2,
        height: rect.height + 2,
        x: rect.x - 1,
        y: rect.y - 1,
        color: BLOCK_COLOR_ON,
        destroyed: false,
      });
    }

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
        block.color = BLOCK_COLOR_OFF;
      }
    }
  }

  // Render

  platform_clear_rect({ x: 0, y: 0, width: data.window.width, height: gitdata.window.height });

  for (let blockIndex = 0; blockIndex < data.blocks.length; blockIndex++) {
    const block = data.blocks[blockIndex];

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

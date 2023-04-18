import {
  platform_clear_rect,
  platform_render_rect,
  platform_render_text,
  platform_get_blocks,
  platform_destroy_block,
  platform_log,
  platform_error,
} from "./breakout_platform.mjs"

export const KEY_MOVE_LEFT = 0;
export const KEY_MOVE_RIGHT = 1;
export const KEY_CONFIRM = 2;
export const KEY_CANCEL = 3;
export const KEY_PAUSE = 4;

const GAME_STATE_RUNNING = 0;
const GAME_STATE_WIN = 1;
const GAME_STATE_LOSE = 2;

const MODE_INIT = 0;
const MODE_INTRO = 1;
const MODE_PLAY = 2;
const MODE_PAUSE = 3;

const BACKGROUND_COLOR = "#ffffff";
const PAUSE_BACKGROUND_COLOR = "rgba(0, 0, 0, 0.5)";
const PAUSE_TEXT_COLOR = "#ffffff";


const PADDLE_SPEED = 20;
const PADDLE_WIDTH = 150;
const PADDLE_HEIGHT = 20;
const PADDLE_Y = 10;
const PADDLE_COLOR = "#000000";

const BALL_MAX = 1;
const BALL_SPEED = 5;
const BALL_SIZE = 20;
const BALL_COLOR = "red";

const BLOCK_COLOR_ON = "transparent";

const data = {
  mode: MODE_INIT,

  delta: 0,
  currentTime: 0,

  window: {
    width: 800,
    height: 600,
  },

  intro: {
    paddle: {
      duration: 0.5,
      progress: 0,
    },
    ball: {
      duration: 0.2,
      progress: 0,
      delay: 0.2,
    },
  },

  paddle: {
    x: 0,
    y: 0,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
  },
  balls: [],
  blocks: [],

  debug: {
    trail: [],
  },

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
    [KEY_CANCEL]: {
      down: false,
      released: false,
    },
    [KEY_PAUSE]: {
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

function normalize(value, min = 0, max = 1) {
  return (value - min) / (max - min);
}

function lerp(a, b, t){
  return a + (b - a) * clamp_0_1(t);
}

function clamp_0_1(value) {
  if (value < 0)
    return 0;
  else if (value > 1)
    return 1;
  return value;
}

function game_spawn_ball(launched = true) {
  let velocityX = 0;
  let velocityY = 0;
  if (launched) {
    velocityX = data.paddle.velocityX < 0 ? -1 : 1;
    velocityY = -1;
  }

  data.balls.push({
    x: data.paddle.x + data.paddle.width/2 - BALL_SIZE/2,
    y: data.paddle.y - BALL_SIZE,
    width: BALL_SIZE,
    height: BALL_SIZE,
    velocityX,
    velocityY,
    color: BALL_COLOR,
    destroyed: false,
    launched,
  });
}

export function game_update(currentTime) {
  data.delta = currentTime - data.currentTime;
  data.currentTime = currentTime;

  // Update
  switch (data.mode) {
    case MODE_INIT: {
      data.paddle.x = data.window.width / 2 - data.paddle.width / 2;
      data.paddle.y = data.window.height;
      data.balls = [];
      data.blocks = [];

      const blocks = platform_get_blocks();
      for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
        const block = blocks[blockIndex];
        const rect = block.getClientRects()[0];

        data.blocks.push({
          id: blockIndex,
          width: rect.width + 2,
          height: rect.height + 2,
          x: rect.x - 1,
          y: rect.y - 1,
          color: BLOCK_COLOR_ON,
          destroyed: false,
        });
      }

      data.intro.paddle.progress = 0;
      data.intro.ball.progress = 0;

      data.mode = MODE_INTRO;
    } break;

    case MODE_INTRO: {
      let done = false;

      {
        data.paddle.y = lerp(data.paddle.y, data.window.height - data.paddle.height - PADDLE_Y, data.intro.paddle.progress);
        data.intro.paddle.progress += data.delta / data.intro.paddle.duration;
      }

      if (data.intro.paddle.progress >= 1 + data.intro.ball.delay) {
        if (data.balls.length === 0) {
          game_spawn_ball(false);
        }
        data.balls[0].y = lerp(data.paddle.y, data.paddle.y - BALL_SIZE, data.intro.ball.progress);
        data.intro.ball.progress += data.delta / data.intro.ball.duration;
      }

      done = data.intro.paddle.progress >= 1 && data.intro.ball.progress >= 1;

      if (done) {
        data.mode = MODE_PLAY;
        console.log("intro done");
      }
    } break;

    case MODE_PLAY: {
      if (data.keys[KEY_PAUSE].released) {
        data.mode = MODE_PAUSE;
      }

      if (data.keys[KEY_MOVE_LEFT].down) {
        data.paddle.velocityX = -PADDLE_SPEED;
      }
      else if (data.keys[KEY_MOVE_RIGHT].down) {
        data.paddle.velocityX = +PADDLE_SPEED;
      }
      else {
        data.paddle.velocityX = 0;
      }

      data.paddle.x += data.paddle.velocityX;
      data.paddle.x = Math.max(0, data.paddle.x);
      data.paddle.x = Math.min(data.window.width - data.paddle.width, data.paddle.x);

      if (data.keys[KEY_CONFIRM].released) {
        const firstBall = data.balls.find(ball => ball.launched === false);
        if (firstBall) {
          firstBall.velocityX = data.paddle.velocityX < 0 ? -1 : 1;
          firstBall.velocityY = -1;
          firstBall.launched = true;
        } else {
          if (data.balls.length < BALL_MAX) {
            game_spawn_ball(true);
          }
        }
      }

      for (let ballIndex = 0; ballIndex < data.balls.length; ballIndex++) {
        const ball = data.balls[ballIndex];

        if (ball.launched === false) {
          ball.x = data.paddle.x + data.paddle.width / 2 - ball.width / 2;
          ball.y = data.paddle.y - BALL_SIZE;
        }

        if (ball.destroyed)
          continue;

        ball.x += ball.velocityX * BALL_SPEED;
        if (ball.x + ball.width > data.window.width || ball.x < 0)
          ball.velocityX = -ball.velocityX;

        ball.y += ball.velocityY * BALL_SPEED;
        // Top limit hit
        if (ball.y < 0)
          ball.velocityY = -ball.velocityY;

        // Bottom limit hit
        if (ball.y > data.window.height) {
          ball.destroyed = true;

          if (data.balls.filter(b => b.destroyed === false).length === 0) {
            data.mode = MODE_INIT;
            return GAME_STATE_LOSE;
          }
        }

        if (game_is_point_inside(ball, data.paddle)) {
          const distLeft = Math.abs((ball.x + ball.width / 2) - (data.paddle.x));
          const distRight = Math.abs((ball.x + ball.width / 2) - (data.paddle.x + data.paddle.width));
          const distTop = Math.abs((ball.y + ball.height / 2) - (data.paddle.y));
          const distBottom = Math.abs((ball.y + ball.height / 2) - (data.paddle.y + data.paddle.height));

          ball.velocityY = -ball.velocityY;

          if (Math.min(distLeft, distRight) < Math.min(distTop, distBottom)) {
            ball.velocityX = -ball.velocityX;
            ball.y = data.paddle.y;
          }
        }

        // data.debug.trail.push([ball.x, ball.y]);

        let blockDestroyed = 0;
        for (let blockIndex = 0; blockIndex < data.blocks.length; blockIndex++) {
          const block = data.blocks[blockIndex];

          if (block.destroyed) {
            blockDestroyed += 1;
            continue;
          }

          if (game_is_point_inside(ball, block)) {
            const distLeft = Math.abs((ball.x + ball.width / 2) - (block.x));
            const distRight = Math.abs((ball.x + ball.width / 2) - (block.x + block.width));
            const distTop = Math.abs((ball.y + ball.height / 2) - (block.y));
            const distBottom = Math.abs((ball.y + ball.height / 2) - (block.y + block.height));

            if (Math.min(distLeft, distRight) < Math.min(distTop, distBottom)) {
              ball.velocityX = -ball.velocityX;
            } else {
              ball.velocityY = -ball.velocityY;
            }
            block.destroyed = true;
            platform_destroy_block(block.id);
          }
        }

        if (blockDestroyed == data.blocks.length) {
          data.mode = MODE_INIT;
          return GAME_STATE_WIN;
        }
      }
    } break;

    case MODE_PAUSE: {
      if (data.keys[KEY_PAUSE].released) {
        data.mode = MODE_PLAY;
      }
    } break;
  }

  // Render
  {
    platform_clear_rect({ x: 0, y: 0, width: data.window.width, height: data.window.height });

    for (let trailIndex = 0; trailIndex < data.debug.trail.length; trailIndex++) {
      const [x,y] = data.debug.trail[trailIndex];
      const rect = { x, y, width: 1, height: 1 };
      platform_render_rect(rect, "red");
    }

    for (let blockIndex = 0; blockIndex < data.blocks.length; blockIndex++) {
      const block = data.blocks[blockIndex];

      const rect = { x: block.x, y: block.y, width: block.width, height: block.height };
      platform_render_rect(rect, block.color);
    }

    for (let ballIndex = 0; ballIndex < data.balls.length; ballIndex++) {
      const ball = data.balls[ballIndex];

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

    if (data.mode == MODE_PAUSE) {
      platform_render_rect({ x: 0, y: 0, width: data.window.width, height: data.window.height }, PAUSE_BACKGROUND_COLOR);
      platform_render_rect({ x: data.window.width / 2 - 300/2, y: data.window.height / 2 - 100/2, width: 300, height: 100 }, PAUSE_BACKGROUND_COLOR);
      platform_render_text(data.window.width / 2 - 60, data.window.height / 2 - 20, "PAUSED", 32, PAUSE_TEXT_COLOR);
    }
  }

  // Reset input state at the end of the frame
  for (const [key, value] of Object.entries(data.keys)) {
    data.keys[key].released = false;
  }

  return GAME_STATE_RUNNING;
}

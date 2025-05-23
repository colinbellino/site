import * as math from "./math.mjs";

export const STATE_RUNNING = 0;
export const STATE_WIN = 1;
export const STATE_LOSE = 2;
export const STATE_QUIT = 3;

const AUDIO_CLIP_BOUNCE_1 = "bounce1";
const AUDIO_CLIP_BOUNCE_2 = "bounce2";
const AUDIO_CLIP_HIT_1 = "hit1";
const AUDIO_CLIP_HIT_2 = "hit2";
const AUDIO_CLIP_HIT_3 = "hit3";
const AUDIO_CLIP_HIT_4 = "hit4";
const AUDIO_CLIP_LOSE_1 = "lose1";
// const AUDIO_CLIP_MUSIC_1 = "music1";

const AUDIO_CLIPS = [
  AUDIO_CLIP_BOUNCE_1,
  AUDIO_CLIP_BOUNCE_2,
  AUDIO_CLIP_HIT_1,
  AUDIO_CLIP_HIT_2,
  AUDIO_CLIP_HIT_3,
  AUDIO_CLIP_HIT_4,
  AUDIO_CLIP_LOSE_1,
//   AUDIO_CLIP_MUSIC_1,
];

const MODE_INIT = 0;
const MODE_INTRO = 1;
const MODE_PLAY = 2;
const MODE_PAUSE = 3;
const MODE_END = 4;

const PADDLE_SPEED = 20;
const PADDLE_WIDTH = 200;
const PADDLE_HEIGHT = 20;
const PADDLE_Y = 10;
const PADDLE_COLOR_LIGHT = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };
const PADDLE_COLOR_DARK = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };

const CLEAR_COLOR = { r: 0.0, g: 0.0, b: 0.0, a: 0.0 };

const BALL_MAX = 1;
const BALL_SPEED = 6;
const BALL_SCORE_MULTIPLIER = 0.2;
const BALL_SIZE = 20;
const BALL_COLOR = { r: 1.0, g: 0.0, b: 0.0, a: 1.0 };
const BALL_TRAIL_MAX = 20;

const PARTICLE_SPEED = 4;
const PARTICLE_DURATION = 1.5;
const PARTICLE_PER_HIT_MIN = 5;
const PARTICLE_PER_HIT_MAX = 20;
const PARTICLE_SIZE_MIN = 2;
const PARTICLE_SIZE_MAX = 12;
const PARTICLE_AREA_MAX = 300;

const SCORE_PER_BLOCK = 10;
const SCORE_MULTIPLIER = 1;
const SCORE_MULTIPLIER_PER_BLOCK = 0.1;

let renderer = {
  init: null,
  clear: null,
  clear_rect: null,
  draw_rect: null,
  draw_trail: null,
};

let platform = {
  get_blocks: null,
  destroy_block: null,
  show_help: null,
  hide_help: null,
  show_score: null,
  hide_score: null,
  show_pause: null,
  hide_pause: null,
  show_lives: null,
  hide_lives: null,
  play_audio_clip: null,
  stop_audio_clip: null,
  log: null,
  error: null,
  state: {
    quit: false,
    mouse: null,
    mouse_keys: null,
    keys: null,
    window: null,
  },
};
const data = {
  mode: MODE_INIT,
  state: STATE_RUNNING,

  delta: 0,
  current_time: 0,

  intro: {
    paddle: {
      duration: 0.5,
      delay: 0,
      progress: 0,
    },
    ball: {
      duration: 0.2,
      delay: 0.2,
      progress: 0,
    },
    help: {
      duration: 0.3,
      delay: 0.2,
      progress: 0,
    },
  },

  outro: {
    paddle: {
      duration: 0.5,
      delay: 0,
      progress: 0,
    },
    help: {
      duration: 0.3,
      delay: 0,
      progress: 0,
    },
    score: {
      duration: 0.3,
      delay: 0,
      progress: 0,
    },
  },

  paddle: {
    position: {
      x: 0,
      y: 0,
    },
    moveDirection: 0,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    velocity: { x: 0, y: 0 },
  },
  balls: [],
  blocks: [],
  particles: [],
  trail: [],
  lives: 2,
  score: 0,
  multiplier: SCORE_MULTIPLIER,

  debug: {
    showBlocks: false,
    cheats: false,
  },
};

export async function game_init(_platform, _renderer) {
  platform = _platform;
  renderer = _renderer;
  data.mode = MODE_INIT;

  await Promise.all(AUDIO_CLIPS.map((audio_clip) => {
    return platform.load_audio_clip(audio_clip);
  }));

//   platform.play_audio_clip(AUDIO_CLIP_MUSIC_1, 1, true);
}

export function game_update(current_time) {
  data.delta = current_time - data.current_time;
  data.current_time = current_time;

  if (platform.state.window_resized) {
    if (data.mode === MODE_PLAY) {
      const blocks = platform.get_blocks();
      for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
        const rect = blocks[blockIndex].getClientRects()[0];
        set_block_rect(data.blocks[blockIndex], rect);
      }

      data.paddle.position.y = platform.state.window_size.y - data.paddle.height - PADDLE_Y;
    }
  }

  if (platform.state.quit) {
    data.state = STATE_QUIT;
    return [data.state, 0];
  }

  // Debug inputs
  if (platform.state.keys[platform.keyCodes.F1].released) {
    data.debug.showBlocks = !data.debug.showBlocks;
    platform.log("Show blocks:", data.debug.showBlocks ? "ON" : "OFF");
  }
  if (platform.state.keys[platform.keyCodes.F2].released) {
    data.debug.cheats = !data.debug.cheats;
    if (data.debug.cheats)
      data.paddle.width = PADDLE_WIDTH * 3;
    else
      data.paddle.width = PADDLE_WIDTH;
    platform.log("Cheats:", data.debug.cheats ? "ON" : "OFF");
  }

  // Update
  switch (data.mode) {
    case MODE_INIT: {
      data.paddle.position.x = platform.state.window_size.x / 2 - data.paddle.width / 2;
      data.paddle.position.y = platform.state.window_size.y;
      data.balls = [];
      data.blocks = [];
      data.particles = [];
      data.intro.paddle.progress = 0;
      data.intro.ball.progress = 0;
      data.intro.help.progress = 0;
      data.outro.paddle.progress = 0;
      data.outro.help.progress = 0;
      data.outro.score.progress = 0;
      data.score = 0;
      data.lives = 2;
      data.multiplier = SCORE_MULTIPLIER;

      data.mode = MODE_INTRO;
    } break;

    case MODE_INTRO: {
      {
        data.paddle.position.y = math.lerp(data.paddle.position.y, platform.state.window_size.y - data.paddle.height - PADDLE_Y, data.intro.paddle.progress);
        data.intro.paddle.progress += data.delta / data.intro.paddle.duration;
      }

      if (data.intro.paddle.progress >= 1 + data.intro.ball.delay) {
        if (data.intro.ball.progress === 0) {
          spawn_ball(true);
        }
        data.balls[0].position.y = math.lerp(data.paddle.position.y, data.paddle.position.y - data.balls[0].height, data.intro.ball.progress);
        data.intro.ball.progress += data.delta / data.intro.ball.duration;
      }

      if (data.intro.ball.progress >= 1 + data.intro.help.delay) {
        if (data.intro.help.progress === 0) {
          platform.show_help();
        }
        data.intro.help.progress += data.delta / data.intro.help.duration;
      }

      const done = data.intro.paddle.progress >= 1
        && data.intro.ball.progress >= 1
        && data.intro.help.progress >= 1;

      if (done) {
        // Get the blocks after we show the help since this is one of the element we use to generate blocks.
        const blocks = platform.get_blocks();
        for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
          const rect = blocks[blockIndex].getClientRects()[0];
          spawn_block(blockIndex, rect);
        }

        data.mode = MODE_PLAY;
      }
    } break;

    case MODE_PLAY: {
      // Player inputs
      {
        if (platform.state.mouse.changed) {
          data.paddle.moveDirection = (platform.state.mouse.x - data.paddle.position.x) >= 0 ? 1 : -1;
          data.paddle.position.x = platform.state.mouse.x - data.paddle.width / 2;
        } else {
          if (platform.state.keys[platform.keyCodes.ARROW_LEFT].down) {
            data.paddle.velocity.x = -1;
          }
          else if (platform.state.keys[platform.keyCodes.ARROW_RIGHT].down) {
            data.paddle.velocity.x = +1;
          }
          else {
            data.paddle.velocity.x = 0;
          }

          data.paddle.moveDirection = data.paddle.velocity.x >= 0 ? 1 : -1;
          data.paddle.position.x = data.paddle.position.x + data.paddle.velocity.x * PADDLE_SPEED;
        }

        data.paddle.position.x = math.clamp(data.paddle.position.x, 0, platform.state.window_size.x - data.paddle.width);

        if (platform.state.keys[platform.keyCodes.ESCAPE].released || platform.state.mouse_keys[platform.mouseCodes.RIGHT].released) {
          platform.show_pause();
          data.mode = MODE_PAUSE;
        }

        if (platform.state.keys[platform.keyCodes.SPACE].released || platform.state.mouse_keys[platform.mouseCodes.LEFT].released) {
          const firstBall = data.balls.find(ball => ball.attachedToPaddle);
          if (firstBall) {
            firstBall.velocity.x = data.paddle.moveDirection;
            firstBall.velocity.y = -1;
            firstBall.attachedToPaddle = false;
            platform.play_audio_clip(AUDIO_CLIP_BOUNCE_1, 0);
          } else {
            if (data.balls.length <= data.lives || data.debug.cheats) {
              platform.show_lives(data.lives);
              spawn_ball(false);
              platform.play_audio_clip(AUDIO_CLIP_BOUNCE_1, 0);
            }
          }
        }
      }

      // Balls
      for (let ballIndex = data.balls.length - 1; ballIndex >= 0; ballIndex--) {
        const ball = data.balls[ballIndex];

        if (ball.destroyed) {
          data.balls.splice(ballIndex, 1);

          if (data.debug.cheats === false) {
            data.lives -= 1;
            platform.show_lives(data.lives);

            // Check for lose condition
            if (data.lives < 0) {
              data.state = STATE_LOSE;
              data.mode = MODE_END;
              break;
            }

            // Reset multiplier
            if (data.debug.cheats === false) {
              data.multiplier = SCORE_MULTIPLIER;
              platform.show_score(data.score, data.multiplier);
            }
          }

          continue;
        }

        if (ball.attachedToPaddle) {
          ball.position.x = data.paddle.position.x + data.paddle.width / 2 - ball.width / 2;
          ball.position.y = data.paddle.position.y - ball.width;
        } else {
          ball.position.y += ball.velocity.y * ball.speed;
          ball.position.x += ball.velocity.x * ball.speed;

          // Bounce on top wall
          if (ball.position.y < 0) {
            ball.velocity.y = -ball.velocity.y;
            ball.position.y = 0; // Reset the Y position just in case we resized the window and the ball is stuck outside
            play_random_audio_clip([AUDIO_CLIP_BOUNCE_1, AUDIO_CLIP_BOUNCE_2]);
          }

          // Bounce on side wall
          if (ball.position.x + ball.width > platform.state.window_size.x) {
            ball.velocity.x = -ball.velocity.x;
            ball.position.x = platform.state.window_size.x - ball.width; // Reset the X position just in case we resized the window and the ball is stuck outside
            play_random_audio_clip([AUDIO_CLIP_BOUNCE_1, AUDIO_CLIP_BOUNCE_2]);
          } else if (ball.position.x < 0) {
            ball.velocity.x = -ball.velocity.x;
            ball.position.x = 0; // Reset the X position just in case we resized the window and the ball is stuck outside
            play_random_audio_clip([AUDIO_CLIP_BOUNCE_1, AUDIO_CLIP_BOUNCE_2]);
          }

          // Hit bottom limit
          if (ball.position.y > platform.state.window_size.y) {
            ball.destroyed = true;
            platform.play_audio_clip(AUDIO_CLIP_LOSE_1);
          }

          // Bounce on paddle
          if (math.is_point_inside(ball, data.paddle)) {
            const distLeft = Math.abs((ball.position.x + ball.width / 2) - (data.paddle.position.x));
            const distRight = Math.abs((ball.position.x + ball.width / 2) - (data.paddle.position.x + data.paddle.width));
            const distTop = Math.abs((ball.position.y + ball.height / 2) - (data.paddle.position.y));
            const distBottom = Math.abs((ball.position.y + ball.height / 2) - (data.paddle.position.y + data.paddle.height));

            ball.velocity.y = -ball.velocity.y;
            if (data.paddle.velocity.x != 0) {
              ball.velocity.x = data.paddle.velocity.x * 1.5;
            }
            ball.position.y = data.paddle.position.y;
            // TODO: check what other breakout games do so the bounces don't feel so janky

            platform.play_audio_clip(AUDIO_CLIP_BOUNCE_2);
          }

          ball.velocity = math.normalize_vector(ball.velocity);

          // Blocks collision
          for (let blockIndex = 0; blockIndex < data.blocks.length; blockIndex++) {
            const block = data.blocks[blockIndex];

            if (block.destroyed) {
              continue;
            }

            // Hit a block
            if (math.is_point_inside(ball, block)) {
              const distLeft = Math.abs((ball.position.x + ball.width / 2) - (block.x));
              const distRight = Math.abs((ball.position.x + ball.width / 2) - (block.x + block.width));
              const distTop = Math.abs((ball.position.y + ball.height / 2) - (block.y));
              const distBottom = Math.abs((ball.position.y + ball.height / 2) - (block.y + block.height));

              if (Math.min(distLeft, distRight) < Math.min(distTop, distBottom)) {
                ball.velocity.x = -ball.velocity.x;
              } else {
                ball.velocity.y = -ball.velocity.y;
              }
              block.destroyed = true;
              platform.destroy_block(block.id);
              play_random_audio_clip([AUDIO_CLIP_HIT_1, AUDIO_CLIP_HIT_2, AUDIO_CLIP_HIT_3, AUDIO_CLIP_HIT_4]);

              data.score += SCORE_PER_BLOCK * data.multiplier;
              data.multiplier += SCORE_MULTIPLIER_PER_BLOCK;
              ball.speed += BALL_SCORE_MULTIPLIER;
              platform.show_score(data.score, data.multiplier);

              const ratio = Math.min(PARTICLE_AREA_MAX, (block.width + block.height)) / PARTICLE_AREA_MAX;
              for (let particleIndex = 0; particleIndex < math.lerp(PARTICLE_PER_HIT_MIN, PARTICLE_PER_HIT_MAX, ratio); particleIndex++) {
                const velocity = { x: math.random(-1, 1), y: math.random(-1, 1) };
                const size = math.lerp(PARTICLE_SIZE_MIN, PARTICLE_SIZE_MAX, ratio);
                spawn_particle({ ...ball.position }, velocity, PARTICLE_DURATION, PARTICLE_SPEED, size, { ...BALL_COLOR });
              }
            }
          }
        }

        if (ball.attachedToPaddle === false) {
          const center = {
            x: ball.position.x + ball.width/2,
            y: ball.position.y + ball.height/2,
          };
          ball.trail.push(center);
          if (ball.trail.length > BALL_TRAIL_MAX) {
            ball.trail.splice(0, 1);
          }
        }
      } // for data.balls

      // Particles
      for (let particleIndex = data.particles.length - 1; particleIndex >= 0; particleIndex--) {
        const particle = data.particles[particleIndex];

        if (data.current_time >= particle.timestamp + particle.duration) {
          data.particles.splice(particleIndex, 1);
          continue;
        }

        const progress = 1 - ((particle.timestamp + particle.duration - data.current_time) / particle.duration);
        particle.color.a = math.lerp(particle.color.a, 0, progress);
        particle.position.y += particle.velocity.y * particle.speed;
        particle.position.x += particle.velocity.x * particle.speed;
      }

      // Check for win condition
      let blockDestroyed = 0;
      for (let blockIndex = 0; blockIndex < data.blocks.length; blockIndex++) {
        if (data.blocks[blockIndex].destroyed) {
          blockDestroyed += 1;
        }
      }
      if (blockDestroyed === data.blocks.length) {
        data.state = STATE_WIN;
        data.mode = MODE_END;
        break;
      }
    } break;

    case MODE_PAUSE: {
      if (platform.state.keys[platform.keyCodes.ESCAPE].released) {
        platform.hide_pause();
        data.mode = MODE_PLAY;
      }
    } break;

    case MODE_END: {
      {
        if (data.outro.help.progress === 0) {
        //   platform.stop_audio_clip(AUDIO_CLIP_MUSIC_1, 1, 0.5);
          platform.hide_help();
          platform.hide_pause();
        }
        data.outro.help.progress += data.delta / data.outro.help.duration;
      }

      {
        data.paddle.position.y = math.lerp(data.paddle.position.y, platform.state.window_size.y, data.outro.paddle.progress);
        data.outro.paddle.progress += data.delta / data.outro.paddle.duration;
      }

      {
        if (data.outro.score.progress === 0) {
          platform.hide_score();
        }
        data.outro.score.progress += data.delta / data.outro.score.duration;
      }

      const done = data.outro.help.progress >= 1
        && data.outro.paddle.progress >= 1
        && data.outro.score.progress >= 1;

      if (done) {
        data.mode = MODE_INIT;
        return [data.state, data.score];
      }
    }
  }

  // Render
  {
    renderer.clear(CLEAR_COLOR);

    for (let ballIndex = 0; ballIndex < data.balls.length; ballIndex++) {
      const ball = data.balls[ballIndex];

      if (ball.destroyed) {
        continue;
      }

      for (let trailIndex = 0; trailIndex < ball.trail.length; trailIndex++) {
        const progress = trailIndex / ball.trail.length;
        const size = ball.width / 2 * progress;
        const position = { ...ball.trail[trailIndex] };
        position.x -= size / 2;
        position.y -= size / 2;
        const color = { ...BALL_COLOR, a: progress };
        renderer.draw_trail(position, size, color);
      }

      const rect = { width: ball.width, height: ball.height, x: ball.position.x, y: ball.position.y };
      renderer.draw_rect(rect, ball.color);
    }

    for (let particleIndex = data.particles.length - 1; particleIndex >= 0; particleIndex--) {
      const particle = data.particles[particleIndex];
      const rect = { width: particle.width, height: particle.height, x: particle.position.x, y: particle.position.y };
      renderer.draw_rect(rect, particle.color);
    }

    {
      const rect = { x: data.paddle.position.x, y: data.paddle.position.y, width: data.paddle.width, height: data.paddle.height };
      const color = prefer_dark_scheme() ? PADDLE_COLOR_DARK : PADDLE_COLOR_LIGHT;
      renderer.draw_rect(rect, color);
    }

    if (data.debug.showBlocks) {
      for (let blockIndex = 0; blockIndex < data.blocks.length; blockIndex++) {
        const block = data.blocks[blockIndex];
        const rect = { x: block.position.x, y: block.position.y, width: block.width, height: block.height };
        const color = { r: 0.0, g: 0.0, b: 1.0, a: 1.0 };
        if (block.destroyed)
          color.a = 0.2;
        renderer.draw_rect(rect, color);
      }
    }
  }

  return [STATE_RUNNING, data.score];
}

function play_random_audio_clip(clips) {
  const clip = clips[Math.floor(Math.random() * clips.length)];
  platform.play_audio_clip(clip);
}

function spawn_ball(attachedToPaddle) {
  const velocity = { x: 0, y: 0 };
  if (attachedToPaddle === false) {
    velocity.x = data.paddle.moveDirection;
    velocity.y = -1;
  }

  const ball = {
    position: {
      x: data.paddle.position.x + data.paddle.width/2 - BALL_SIZE/2,
      y: data.paddle.position.y - BALL_SIZE,
    },
    width: BALL_SIZE,
    height: BALL_SIZE,
    velocity,
    speed: BALL_SPEED,
    color: { ...BALL_COLOR },
    destroyed: false,
    attachedToPaddle,
    trail: [],
  };

  data.balls.push(ball);
}

function set_block_rect(block, rect) {
  block.width = rect.width + 2;
  block.height = rect.height + 2;
  block.position = {
    x: rect.x - 1,
    y: rect.y - 1,
  };
}

function spawn_block(blockIndex, rect) {
  const block = {
    id: blockIndex,
    destroyed: false,
  };
  set_block_rect(block, rect);

  data.blocks.push(block);
}

function spawn_particle(position, velocity, duration, speed, size, color) {
  const particle = {
    width: size,
    height: size,
    position,
    velocity,
    color,
    speed,
    duration,
    timestamp: data.current_time,
  };

  data.particles.push(particle);
}

function prefer_dark_scheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

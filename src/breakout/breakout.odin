package breakout

import "core:fmt"
import "core:runtime"
import "core:math/linalg"
import "vendor:wasm/js"

import platform "platform_browser"
import renderer "renderer_webgl"

Color :: renderer.Color;

STATE :: enum {
    RUNNING,
    WIN,
    LOSE,
    QUIT,
}

MODE :: enum {
    INIT,
    INTRO,
    PLAY,
    PAUSE,
    END,
}

AUDIO_CLIP_BOUNCE_1 :: "bounce1";
AUDIO_CLIP_BOUNCE_2 :: "bounce2";
AUDIO_CLIP_HIT_1 :: "hit1";
AUDIO_CLIP_HIT_2 :: "hit2";
AUDIO_CLIP_HIT_3 :: "hit3";
AUDIO_CLIP_HIT_4 :: "hit4";
AUDIO_CLIP_LOSE_1 :: "lose1";
AUDIO_CLIP_MUSIC_1 :: "music1";

AUDIO_CLIPS :: [?]string {
  AUDIO_CLIP_BOUNCE_1,
  AUDIO_CLIP_BOUNCE_2,
  AUDIO_CLIP_HIT_1,
  AUDIO_CLIP_HIT_2,
  AUDIO_CLIP_HIT_3,
  AUDIO_CLIP_HIT_4,
  AUDIO_CLIP_LOSE_1,
  AUDIO_CLIP_MUSIC_1,
};

PADDLE_SPEED :: 20;
PADDLE_WIDTH :: 200;
PADDLE_HEIGHT :: 20;
PADDLE_Y :: 10;
PADDLE_COLOR :: Color { 0.0, 0.0, 0.0, 1.0 };

CLEAR_COLOR :: Color { 0.0, 0.0, 0.0, 0.0 };

BALL_MAX :: 1;
BALL_SPEED :: 6;
BALL_SCORE_MULTIPLIER :: 0.2;
BALL_SIZE :: 20;
BALL_COLOR :: Color { 1.0, 0.0, 0.0, 1.0 };
BALL_TRAIL_MAX :: 20;

PARTICLE_SPEED :: 4;
PARTICLE_DURATION :: 1.5;
PARTICLE_PER_HIT_MIN :: 5;
PARTICLE_PER_HIT_MAX :: 20;
PARTICLE_SIZE_MIN :: 2;
PARTICLE_SIZE_MAX :: 12;
PARTICLE_AREA_MAX :: 300;

SCORE_PER_BLOCK :: 10;
SCORE_MULTIPLIER :: 1;
SCORE_MULTIPLIER_PER_BLOCK :: 0.1;

Vector2 :: platform.Vector2;

Animation :: struct {
    duration: f32,
    delay:    f32,
    progress: f32,
}

Paddle :: struct {
    position:       Vector2,
    move_direction: f32,
    size:           Vector2,
    velocity:       Vector2,
}

State :: struct {
    mode:               MODE,
    state:              STATE,
    delta:              f32,
    current_time:       f32,
    lives:              i32,
    score:              i32,
    multiplier:         i32,
    audio_clips_loaded: i32,

    intro_paddle:       Animation,
    intro_ball:         Animation,
    intro_help:         Animation,

    outro_paddle:       Animation,
    outro_help:         Animation,
    outro_score:        Animation,

    paddle:             Paddle,
    // balls: [],
    // blocks: [],
    // particles: [],
    // trail: [],

    debug: Debug,
}

Debug :: struct {
    show_blocks: bool,
    cheats: bool,
}

data := State {};

main :: proc() {
    data.audio_clips_loaded = 0;
    for audio_clip_filename, index in AUDIO_CLIPS {
        platform.load_audio_clip(audio_clip_filename);
    }
}

@(export)
audio_clip_loaded :: proc(key: string) {
    data.audio_clips_loaded += 1;
}

@(export)
step :: proc(dt: f32, ctx: runtime.Context) {
    platform_state := platform.get_state();

    #partial switch data.mode {
        case .INIT: {
            if data.audio_clips_loaded < len(AUDIO_CLIPS) {
                return;
            }

            platform.play_audio_clip(AUDIO_CLIP_MUSIC_1, 1, true);

            data.delta = 0;
            data.current_time = 0;
            data.intro_paddle = { 0.5, 0.0, 0.0 };
            data.intro_ball = { 0.2, 0.2, 0.0 };
            data.intro_help = { 0.3, 0.2, 0.0 };
            data.outro_paddle = { 0.0, 0.5, 0.0 };
            data.outro_help = { 0.3, 0.0, 0.0 };
            data.outro_score = { 0.3, 0.0, 0.0 };
            data.paddle = {};
            data.paddle.size = { PADDLE_WIDTH, PADDLE_HEIGHT };
            // data.paddle.position = { platform.state.window_size.x / 2 - data.paddle.size.x / 2, platform.state.window_size.y };
            platform.log("platform_state: %v", platform_state);
            // platform.log("platform.state: %v", platform.state);
            // platform.log("data.paddle: %v", data.paddle);
            // data.balls = [];
            // data.blocks = [];
            // data.particles = [];
            data.score = 0;
            data.lives = 2;
            data.multiplier = SCORE_MULTIPLIER;

            data.mode = .INTRO;
        }
    }

    renderer.renderer_clear(CLEAR_COLOR);
    renderer.renderer_draw_rect({ 100, 100, 100, 100 }, { 0, 0, 0, 1 });
    renderer.renderer_draw_trail({ 200, 200 }, 200, { 0, 0, 0, 1 });
    // renderer.renderer_clear({ 0, 0, 0, linalg.sin(alpha) });
    // alpha += dt;
}

//+build js
package breakout_platform

import "core:fmt"

Color   :: distinct [4]f32;
Vector2 :: distinct [2]f32;
Rect    :: distinct [4]f32;
State   :: struct {
    quit:           bool,
    // mouse: null,
    // mouse_keys: null,
    // keys: null,
    window_size:    Vector2,
    window_resized: bool,
}

foreign import "platform"

@(default_calling_convention="c")
foreign platform {
    // get_blocks :: proc() ---
    destroy_block :: proc(block_index: i32) ---
    show_help :: proc() ---
    hide_help :: proc() ---
    show_score :: proc(score: i32, multiplier: f32) ---
    hide_score :: proc() ---
    show_pause :: proc() ---
    hide_pause :: proc() ---
    show_lives :: proc(lives: i32) ---
    hide_lives :: proc() ---
    load_audio_clip :: proc(key: string) ---
    play_audio_clip :: proc(key: string, group: i32 = 0, loop: bool = false) ---
    stop_audio_clip :: proc(key: string, group: i32 = 0, fade_duration: f32 = 0.0) ---
    get_state :: proc() -> State ---
}

// state : State;

log   :: fmt.println;
error :: fmt.eprintln;

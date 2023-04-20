package main

import "core:fmt"
import "core:math/linalg"
import gl "vendor:wasm/WebGL"
import "vendor:wasm/js"

import "platform"

alpha: f32;

main :: proc() {
    gl.SetCurrentContextById("breakout");
    platform.show_help();
    // platform.show_pause();
    platform.error("hello", "world");
}

@(export)
step :: proc(dt: f32) {
    gl.ClearColor(0, 0, 0, linalg.sin(alpha));
    gl.Clear(gl.COLOR_BUFFER_BIT);
    alpha += dt;
    platform.log("hello");
}

@(export)
bla :: proc() {

}

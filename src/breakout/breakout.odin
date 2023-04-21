package main

import "core:fmt"
import "core:runtime"
import "core:math/linalg"
import gl "vendor:wasm/WebGL"
import "vendor:wasm/js"

import "platform"

alpha: f32;

main :: proc() {
    gl.SetCurrentContextById("breakout");
    platform.show_help();
    // platform.show_pause();
    // platform.error("hello", "world");
    major : i32 = 0;
    minor : i32 = 0;
    gl.GetESVersion(&major, &minor);
    platform.log("ES version: ", major, minor);
}

@(export)
step :: proc(dt: f32, ctx: runtime.Context) {
    gl.ClearColor(0, 0, 0, linalg.sin(alpha));
    gl.Clear(gl.COLOR_BUFFER_BIT);
    alpha += dt;
}

@(export)
bla :: proc() {

}

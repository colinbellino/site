package main

import "core:fmt"
import "core:math/linalg"
import "platform"

import webgl "vendor:wasm/WebGL"
import js "vendor:wasm/js"

alpha: f32;

main :: proc() {
    webgl.SetCurrentContextById("breakout");
    platform.show_help();
}

@(export)
step :: proc(dt: f32) {
    webgl.ClearColor(0, 0, 0, linalg.sin(alpha));
    webgl.Clear(webgl.COLOR_BUFFER_BIT);
    alpha += dt;
}

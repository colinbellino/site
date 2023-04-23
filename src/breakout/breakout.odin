package breakout

import "core:fmt"
import "core:runtime"
import "core:math/linalg"
import "vendor:wasm/js"

import "platform"
import renderer "renderer_webgl"

Color :: renderer.Color;

CLEAR_COLOR :: renderer.Color { 0, 0, 0, 0 };
alpha: f32;

main :: proc() {
    // renderer.renderer_init();

    // TODO: load all audio clips
}

@(export)
step :: proc(dt: f32, ctx: runtime.Context) {
    // renderer.renderer_clear({ 0, 0, 0, linalg.sin(alpha) });
    // alpha += dt;

    renderer.renderer_clear(CLEAR_COLOR);
    renderer.renderer_draw_rect({ 100, 100, 100, 100 }, { 0, 0, 0, 1 });
    renderer.renderer_draw_trail({ 200, 200 }, 200, { 0, 0, 0, 1 });
}

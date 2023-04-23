//+build js
package breakout_renderer_webgl

import "core:fmt"
import gl "vendor:wasm/WebGL"

import "../platform"
foreign import "renderer"

Color :: distinct [4]f32;
Vector2 :: distinct [2]f32;
Rect :: distinct [4]f32;

// SHADER_TYPE_FRAGMENT :: 35632;
// SHADER_TYPE_VERTEX   :: 35633;

// VERTEX_SHADER :: `
//     attribute vec4 position;

//     uniform mat4 matrix;
//     uniform mat4 textureMatrix;

//     varying vec2 texcoord;

//     void main () {
//         gl_Position = matrix * position;
//         texcoord = (textureMatrix * position).xy;
//     }
// `;
// FRAGMENT_SHADER :: `
//     precision mediump float;

//     varying vec2 texcoord;
//     uniform vec4 color;
//     uniform sampler2D texture;

//     void main() {
//         if (texcoord.x < 0.0 || texcoord.x > 1.0 ||
//             texcoord.y < 0.0 || texcoord.y > 1.0
//         ) {
//             discard;
//         }

//         // gl_FragColor = texture2D(texture, texcoord);
//         gl_FragColor = color;
//     }
// `;

@(default_calling_convention="c")
foreign renderer {
    renderer_init :: proc() ---
    renderer_quit :: proc() ---
    renderer_clear :: proc(color: Color) ---
    renderer_draw_rect :: proc(rect: Rect, color: Color) ---
    renderer_draw_trail :: proc(position: Vector2, size: f32, color: Color) ---
}

// renderer_init :: proc() {
//     gl.SetCurrentContextById("breakout");

//     {
//         program := gl.CreateProgram();
//         fragment_shader := gl.CreateShader(SHADER_TYPE_FRAGMENT);
//         gl.ShaderSource(fragment_shader, { FRAGMENT_SHADER });
//         gl.CompileShader(fragment_shader);
//         gl.AttachShader(program, fragment_shader);
//         vertex_shader := gl.CreateShader(SHADER_TYPE_VERTEX);
//         gl.ShaderSource(vertex_shader, { VERTEX_SHADER });
//         gl.CompileShader(vertex_shader);
//         gl.AttachShader(program, vertex_shader);
//         gl.LinkProgram(program);

//         gl.UseProgram(program);
//     }

//     major : i32 = 0;
//     minor : i32 = 0;
//     gl.GetWebGLVersion(&major, &minor);
//     platform.log("[GAME] WebGL version:", major, minor);
// }

// renderer_clear :: proc(color: Color) {
//     gl.ClearColor(color.r, color.g, color.g, color.a);
//     gl.Clear(gl.COLOR_BUFFER_BIT);
// }

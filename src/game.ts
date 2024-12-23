declare var __RELEASE__: boolean;

// :shader
const sprite_vs = `
    #version 300 es
    precision highp float;
    precision highp int;

    layout(location=0) in vec2 position;
    layout(location=1) in vec2 uv;
    layout(location=2) in vec4 i_color;
    layout(location=3) in vec4 i_matrix0;
    layout(location=4) in vec4 i_matrix1;
    layout(location=5) in vec4 i_matrix2;
    layout(location=6) in vec4 i_matrix3;
    layout(location=7) in vec2 i_tex_position;
    layout(location=8) in vec2 i_tex_size;

    uniform mat4 u_matrix;

    out vec4 v_color;
    out vec2 v_uv;

    void main() {
        mat4 i_matrix = mat4(i_matrix0, i_matrix1, i_matrix2, i_matrix3);
        gl_Position = u_matrix * i_matrix * (vec4(position, 0, 1));
        v_uv = i_tex_size*uv + i_tex_position;
        v_color = i_color;
    }
`;
const sprite_fs = `
    #version 300 es
    precision highp float;

    uniform sampler2D u_texture;
    in vec4 v_color;
    in vec2 v_uv;
    out vec4 frag_color;

    void main() {
        frag_color = texture(u_texture, v_uv) * v_color;
    }
`;

// :game
type Game = {
    render_active:  boolean;
    renderer:       Renderer;
    texture0:       WebGLTexture;
    inputs:         Inputs;
}
type Renderer = {
    gl:                 WebGL2RenderingContext;
    sprite_pass:        Sprite_Pass;
    camera_main:        Camera_Orthographic;
    window_size:        Vector2;
    size_changed:       boolean;
}
type Sprite_Pass = {
    program:                WebGLProgram;
    vao:                    WebGLVertexArrayObject;
    indices:                WebGLBuffer;
    instance_data:          WebGLBuffer;
    location_matrix:        WebGLUniformLocation;
}
type Camera_Orthographic = {
    position:                   Vector2;
    rotation:                   number;
    zoom:                       number;
    projection_matrix:          Matrix4;
    transform_matrix:           Matrix4;
    view_matrix:                Matrix4;
    view_projection_matrix:     Matrix4;
}

type Vector2 = [float, float];
type Vector3 = [float,float,float];
type Vector4 = [float,float,float,float];
type Matrix4 = [float,float,float,float,float,float,float,float,float,float,float,float,float,float,float,float];
type float   = GLfloat;
type Color = [float, float, float, float];
type Sprite = {
    color:              Color;
    position:           Vector2;
    size:               Vector2;
    scale:              Vector2;
    texture_size:       Vector2;
    texture_position:   Vector2;
    rotation:           float;
}

const ENABLE_SPRITE_PASS = true;
const ATLAS_SIZE = [512, 512];
const SPRITE_PASS_INSTANCE_DATA_SIZE = 24;
const COLOR_WHITE: Color = [1, 1, 1, 1];
const COLOR_RED:   Color = [1, 0, 0, 1];
const COLOR_BLUE:  Color = [0, 0, 1, 1];

let game: Game;
// :sprites
const sprites: Sprite[] = [
    // FIXME: scale should be applied after position
    { color: COLOR_WHITE, position: [0, 32], size: [54, 54], scale: [4, 4], rotation: 0, texture_size: [54, 54], texture_position: [0, 16] },
    { color: COLOR_WHITE, position: [0, 0],  size: [32, 32], scale: [1, 1], rotation: 0, texture_size: [16, 16], texture_position: [0, 0] },
    { color: COLOR_WHITE, position: [32, -32], size: [32, 32], scale: [2, 2], rotation: 0, texture_size: [16, 16], texture_position: [16, 0] },
];

requestAnimationFrame(main);

function main() {
    // @ts-ignore
    game = {};

    const [renderer, renderer_ok] = renderer_init();
    if (!renderer_ok) {
        console.error("Couldn't initialize renderer.");
        return;
    }
    game.renderer = renderer;

    game.inputs = inputs_init();
    renderer_update_camera_matrix_main(game.renderer.camera_main);

    if (ENABLE_SPRITE_PASS) {
        game.renderer.sprite_pass = renderer_make_sprite_pass(game.renderer.gl);
        // TODO: Don't render the game while the assets are loading
        load_image("./images/atlas.png").then(image => { game.texture0 = renderer_create_texture(image, game.renderer.gl); });
        // load_image("./images/favicon-16x16.png").then(image => { game.texture0 = renderer_create_texture(image, game.renderer.gl); });
        // load_image("./images/screenshots/hubside/banner-large.jpg").then(image => { renderer_create_texture(image, game.renderer.gl); });
    }

    document.addEventListener("keydown", inputs_on_key, false);
    document.addEventListener("keyup", inputs_on_key, false);

    requestAnimationFrame(update);
}

function update() {
    const gl = game.renderer.gl;

    game.renderer.size_changed = window.innerWidth !== game.renderer.window_size[0] || window.innerHeight !== game.renderer.window_size[1];
    game.renderer.window_size[0] = window.innerWidth;
    game.renderer.window_size[1] = window.innerHeight;
    gl.canvas.width = game.renderer.window_size[0];
    gl.canvas.height = game.renderer.window_size[1];

    if (game.renderer.size_changed) {
        renderer_update_camera_matrix_main(game.renderer.camera_main);
    }

    gl.viewport(0, 0, game.renderer.window_size[0], game.renderer.window_size[1]);

    const t = sin_01(Date.now(), 1.0 / 2000);
    // sprites[1].rotation = t * 2*Math.PI;
    sprites[1].scale[0] = 1 + t;
    sprites[1].scale[1] = 1 + t;
    // sprites[2].position[1] = -32 + 64 * t;

    if (game.inputs.keys["p"].released) {
        game.render_active = !game.render_active;
    }

    if (game.inputs.keys["ArrowUp"].down) {
        sprites[0].position[1] -= 1;
    }
    if (game.inputs.keys["ArrowDown"].down) {
        sprites[0].position[1] += 1;
    }
    if (game.inputs.keys["ArrowLeft"].down) {
        sprites[0].position[0] -= 1;
    }
    if (game.inputs.keys["ArrowRight"].down) {
        sprites[0].position[0] += 1;
    }
    if (game.inputs.keys[" "].down) {
        // sprites[2].scale[0] += 0.1;
        // sprites[2].scale[1] += 0.1;
        sprites[2].rotation = t;
    }
    if (game.inputs.keys[" "].released) {
        // sprites[2].scale[0] = 1;
        // sprites[2].scale[1] = 1;
        sprites[2].rotation = 0;
    }

    // :render
    render: {
        if (game.render_active)  { break render; }

        gl.clearColor(0.25, 0.25, 0.25, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (ENABLE_SPRITE_PASS) {
            // TODO: Don't recreate this every frame
            let instance_data = new Float32Array(sprites.length * SPRITE_PASS_INSTANCE_DATA_SIZE);
            const pixel_size = [
                1 / ATLAS_SIZE[0],
                1 / ATLAS_SIZE[1],
            ];
            for (let sprite_index = 0; sprite_index < sprites.length; sprite_index++) {
                const sprite = sprites[sprite_index];
                let offset = SPRITE_PASS_INSTANCE_DATA_SIZE * sprite_index;

                instance_data.set(sprite.color, offset);
                offset += 4;

                let matrix = matrix4_identity();
                const pivot = [0.5, 0.5];
                const size = [sprite.size[0] * sprite.scale[0], sprite.size[1] * sprite.scale[1]];
                matrix = matrix4_multiply(matrix, matrix4_make_translation(sprite.position[0], sprite.position[1], 0));
                matrix = matrix4_multiply(matrix, matrix4_make_translation(size[0]*-pivot[0], size[1]*-pivot[1], 0));
                matrix = matrix4_multiply(matrix, matrix4_make_translation(size[0]*2*pivot[0], size[1]*2*pivot[1], 0));
                matrix = matrix4_multiply(matrix, matrix4_make_scale(size[0], size[1], 0));
                matrix = matrix4_rotate_z(matrix, sprite.rotation);
                instance_data.set(matrix, offset);
                offset += 16;

                const texture_position = [
                    sprite.texture_position[0] * pixel_size[0],
                    sprite.texture_position[1] * pixel_size[1],
                ];
                instance_data.set(texture_position, offset);
                offset += 2;

                const texture_size = [
                    sprite.texture_size[0] * pixel_size[0],
                    sprite.texture_size[1] * pixel_size[1],
                ];
                instance_data.set(texture_size, offset);
                offset += 2;
            }

            gl.useProgram(game.renderer.sprite_pass.program);
            gl.uniformMatrix4fv(game.renderer.sprite_pass.location_matrix, false, game.renderer.camera_main.view_projection_matrix);
            gl.bindVertexArray(game.renderer.sprite_pass.vao);
            gl.bindTexture(gl.TEXTURE_2D, game.texture0);
            gl.bindBuffer(gl.ARRAY_BUFFER, game.renderer.sprite_pass.instance_data);
            gl.bufferData(gl.ARRAY_BUFFER, instance_data, gl.STREAM_DRAW);
            gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, game.renderer.sprite_pass.indices as GLintptr, sprites.length);
        }
    }

    inputs_reset(game.inputs);

    requestAnimationFrame(update);
}

function renderer_init(): [Renderer, true] | [null, false] {
    const canvas = document.querySelector("canvas");
    assert(canvas !== null, "Canvas not found");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const _gl = canvas.getContext("webgl2");
    if (_gl === null) {
        return [null, false];
    }

    // @ts-ignore
    const renderer: Renderer = {};
    renderer.gl = _gl;

    // @ts-ignore
    renderer.sprite_pass = {};
    // @ts-ignore
    renderer.camera_main = {};
    renderer.window_size = [window.innerWidth, window.innerHeight];

    return [renderer, true];
}
function renderer_make_sprite_pass(gl: WebGL2RenderingContext): Sprite_Pass {
    // @ts-ignore
    const pass: Sprite_Pass = {};
    const [program, program_ok] = renderer_create_program(gl, sprite_vs, sprite_fs);
    if (program_ok) {
        pass.program = program;
    }

    const vao = gl.createVertexArray();
    assert(vao !== null);
    pass.vao = vao;
    gl.bindVertexArray(vao);

    {
        const vertices = new Float32Array([
            // position     // uv
            +0.5, +0.5,     1, 1,
            -0.5, +0.5,     0, 1,
            -0.5, -0.5,     0, 0,
            +0.5, -0.5,     1, 0,
        ]);
        const buffer = gl.createBuffer();
        assert(buffer !== null, "Couldn't create vertices buffer.");
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const location_position = gl.getAttribLocation(pass.program, "position");
        assert(location_position != -1, "Couldn't get attrib location position.");
        gl.enableVertexAttribArray(location_position);
        gl.vertexAttribPointer(location_position, 2, gl.FLOAT, false, 16, 0);

        const location_uv = gl.getAttribLocation(pass.program, "uv");
        assert(location_uv != -1, "Couldn't get attrib location uv.");
        gl.enableVertexAttribArray(location_uv);
        gl.vertexAttribPointer(location_uv, 2, gl.FLOAT, true, 16, 8);
    }

    // :sprite_pass instance_data
    {
        const instance_data = gl.createBuffer();
        assert(instance_data !== null, "Couldn't create instance_data buffer.");
        pass.instance_data = instance_data;
        gl.bindBuffer(gl.ARRAY_BUFFER, pass.instance_data);

        const STRIDE = SPRITE_PASS_INSTANCE_DATA_SIZE*4;
        let offset = 0;

        const location_color = gl.getAttribLocation(pass.program, "i_color");
        assert(location_color != -1, "Couldn't get attrib location i_color.");
        gl.enableVertexAttribArray(location_color);
        gl.vertexAttribPointer(location_color, 4, gl.FLOAT, false, STRIDE, offset*4);
        gl.vertexAttribDivisor(location_color, 1);
        offset += 4;

        const location_matrix0 = gl.getAttribLocation(pass.program, "i_matrix0");
        assert(location_matrix0 != -1, "Couldn't get attrib location i_matrix0.");
        gl.enableVertexAttribArray(location_matrix0);
        gl.vertexAttribPointer(location_matrix0, 4, gl.FLOAT, false, STRIDE, offset*4);
        gl.vertexAttribDivisor(location_matrix0, 1);
        offset += 4;
        const location_matrix1 = gl.getAttribLocation(pass.program, "i_matrix1");
        assert(location_matrix1 != -1, "Couldn't get attrib location i_matrix1.");
        gl.enableVertexAttribArray(location_matrix1);
        gl.vertexAttribPointer(location_matrix1, 4, gl.FLOAT, false, STRIDE, offset*4);
        gl.vertexAttribDivisor(location_matrix1, 1);
        offset += 4;
        const location_matrix2 = gl.getAttribLocation(pass.program, "i_matrix2");
        assert(location_matrix2 != -1, "Couldn't get attrib location i_matrix2");
        gl.enableVertexAttribArray(location_matrix2);
        gl.vertexAttribPointer(location_matrix2, 4, gl.FLOAT, false, STRIDE, offset*4);
        gl.vertexAttribDivisor(location_matrix2, 1);
        offset += 4;
        const location_matrix3 = gl.getAttribLocation(pass.program, "i_matrix3");
        assert(location_matrix3 != -1, "Couldn't get attrib location i_matrix3");
        gl.enableVertexAttribArray(location_matrix3);
        gl.vertexAttribPointer(location_matrix3, 4, gl.FLOAT, false, STRIDE, offset*4);
        gl.vertexAttribDivisor(location_matrix3, 1);
        offset += 4;

        const location_tex_position = gl.getAttribLocation(pass.program, "i_tex_position");
        assert(location_tex_position != -1, "Couldn't get attrib location i_tex_position.");
        gl.enableVertexAttribArray(location_tex_position);
        gl.vertexAttribPointer(location_tex_position, 2, gl.FLOAT, false, STRIDE, offset*4);
        gl.vertexAttribDivisor(location_tex_position, 1);
        offset += 2;

        const location_tex_size = gl.getAttribLocation(pass.program, "i_tex_size");
        assert(location_tex_size != -1, "Couldn't get attrib location i_tex_size.");
        gl.enableVertexAttribArray(location_tex_size);
        gl.vertexAttribPointer(location_tex_size, 2, gl.FLOAT, false, STRIDE, offset*4);
        gl.vertexAttribDivisor(location_tex_size, 1);
        offset += 2;

        assert(SPRITE_PASS_INSTANCE_DATA_SIZE === offset, "SPRITE_PASS_INSTANCE_DATA_SIZE doesn't match the attributes byte size.");
    }

    // :sprite_pass uniform
    {
        const location_matrix = gl.getUniformLocation(pass.program, "u_matrix");
        assert(location_matrix !== null, "Couldn't get uniform location u_matrix.");
        pass.location_matrix = location_matrix;
    }

    {
        const indices = new Uint8Array([
            0, 1, 2,
            0, 2, 3,
        ]);
        const indices_buffer = gl.createBuffer();
        assert(indices_buffer != null, "Couldn't create indices_buffer.");
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        pass.indices = indices_buffer;
    }

    gl.bindVertexArray(null);

    return pass;
}
function renderer_create_texture(image: HTMLImageElement, gl: WebGL2RenderingContext): WebGLTexture {
    const texture = gl.createTexture();
    assert(texture !== null, "Couldn't create texture.");

    gl.activeTexture(gl.TEXTURE0);
    // gl.pixelStorei  (gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture  (gl.TEXTURE_2D, texture);
    gl.texImage2D   (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
}
function renderer_create_program(gl: WebGL2RenderingContext, vs: string, fs: string): [WebGLProgram, true] | [null, false] {
    const vs_shader = gl.createShader(gl.VERTEX_SHADER);
    assert(vs_shader !== null, "Couldn't create vertex shader.");
    gl.shaderSource(vs_shader, vs.trim());
    gl.compileShader(vs_shader);
    const vertex_shader_status : GLboolean = gl.getShaderParameter(vs_shader, gl.COMPILE_STATUS);
    assert(vertex_shader_status, gl.getShaderInfoLog(vs_shader));

    const fs_shader = gl.createShader(gl.FRAGMENT_SHADER);
    assert(fs_shader !== null, "Couldn't create fragment shader.");
    gl.shaderSource(fs_shader, fs.trim());
    gl.compileShader(fs_shader);
    const fragment_shader_status : GLboolean = gl.getShaderParameter(fs_shader, gl.COMPILE_STATUS);
    assert(fragment_shader_status, gl.getShaderInfoLog(fs_shader));

    const program = gl.createProgram();
    assert(program !== null, "Couldn't create program.");
    gl.attachShader(program, vs_shader);
    gl.attachShader(program, fs_shader);
    gl.linkProgram(program);
    const program_status : GLboolean = gl.getProgramParameter(program, gl.LINK_STATUS);
    assert(program_status, gl.getProgramInfoLog(program));

    return [program, true];
}

function renderer_update_camera_matrix_main(camera: Camera_Orthographic): void {
    camera.projection_matrix = matrix4_make_orthographic_projection(
        game.renderer.window_size[0]*-0.5, game.renderer.window_size[0]*0.5,
        game.renderer.window_size[1]*0.5, game.renderer.window_size[1]*-0.5,
        -1,                                 +1,
    );

    // camera.transform_matrix = matrix4_identity();
    // camera.transform_matrix *= mat4Rotate(.{ 0, 0, 1 }, camera.rotation);
    // camera.transform_matrix *= make_scale_matrix4(.{ 1/camera.zoom, 1/camera.zoom, 0 });
    // camera.transform_matrix *= transpose(make_translation_matrix4(make_vector3(camera.position, 0)));

    camera.view_matrix = matrix4_identity();
    camera.view_projection_matrix = matrix4_multiply(camera.view_matrix, camera.projection_matrix);
}

// :inputs
type Inputs = {
    quit_requested:             boolean;
    window_resized:             boolean;
    window_is_focused:          boolean;
    keyboard_was_used:          boolean;
    keys:                       { [key in Keyboard_Key]: Key_State };
    mouse_was_used:             boolean;
    mouse_keys:                 { [key in Mouse_Key]: Key_State };
    mouse_position:             Vector2;
    mouse_wheel:                Vector2;
    mouse_moved:                boolean;
    controller_was_used:        boolean;
    // controllers:                [MAX_CONTROLLERS]Controller_State;
}
type Key_State = {
    pressed:        boolean; // The key was pressed this frame
    down:           boolean; // The key is down
    released:       boolean; // The key was released this frame
}
// I really hate that i have to do this, but this is JavaScript so here we go...
enum Keyboard_Key {
    "_0" = "0",
    "_1" = "1",
    "_2" = "2",
    "_3" = "3",
    "_4" = "4",
    "_5" = "5",
    "_6" = "6",
    "_7" = "7",
    "_8" = "8",
    "_9" = "9",
    "a" = "a",
    "b" = "b",
    "c" = "c",
    "d" = "d",
    "e" = "e",
    "f" = "f",
    "g" = "g",
    "h" = "h",
    "i" = "i",
    "j" = "j",
    "k" = "k",
    "l" = "l",
    "m" = "m",
    "n" = "n",
    "o" = "o",
    "p" = "p",
    "q" = "q",
    "r" = "r",
    "s" = "s",
    "t" = "t",
    "u" = "u",
    "v" = "v",
    "w" = "w",
    "x" = "x",
    "y" = "y",
    "z" = "z",
    "²" = "²",
    "F1" = "F1",
    "F2" = "F2",
    "F3" = "F3",
    "F4" = "F4",
    "F5" = "F5",
    "F6" = "F6",
    "F7" = "F7",
    "F8" = "F8",
    "F9" = "F9",
    "F10" = "F10",
    "F11" = "F11",
    "F12" = "F12",
    "Tab" = "Tab",
    "Shift" = "Shift",
    "Control" = "Control",
    "Meta" = "Meta",
    " " = " ",
    "Alt" = "Alt",
    "AltGraph" = "AltGraph",
    "ArrowDown" = "ArrowDown",
    "ArrowLeft" = "ArrowLeft",
    "ArrowRight" = "ArrowRight",
    "ArrowUp" = "ArrowUp",
};
enum Mouse_Key {
    NONE,
    LEFT,
    MIDDLE,
    RIGHT,
    COUNT,
}

function inputs_init(): Inputs {
    // @ts-ignore
    const inputs: Inputs = { keys: {}, mouse_keys: {} };
    inputs.mouse_position = [0,0];
    inputs.mouse_wheel = [0,0];
    const keys = Object.values(Keyboard_Key);
    for (let key_index = 0; key_index < keys.length; key_index++) {
        const key = keys[key_index];
        inputs.keys[key] = { pressed: false, down: false, released: false };
    }
    const mouse_keys = Object.values(Keyboard_Key);
    for (let key_index = 0; key_index < mouse_keys.length; key_index++) {
        const key = mouse_keys[key_index];
        inputs.mouse_keys[key] = { pressed: false, down: false, released: false };
    }
    return inputs;
}
function inputs_on_key(event: KeyboardEvent) {
    const key_state = game.inputs.keys[event.key];
    if (!key_state) {
        console.warn("Unrecognized key:", event.key);
        return;
    }
    key_state.down = event.type == "keydown";
    key_state.released = event.type == "keyup";
    key_state.pressed = event.type == "keydown";
}
function inputs_reset(inputs: Inputs) {
    inputs.mouse_wheel[0] = 0;
    inputs.mouse_wheel[1] = 0;
    inputs.mouse_moved = false;
    inputs.quit_requested = false;
    inputs.window_resized = false;

    inputs.keyboard_was_used = false;
    for (const key_state of Object.values(inputs.keys)) {
        if (key_state.pressed || key_state.down || key_state.released) {
            inputs.keyboard_was_used = true;
            break;
        }
    }
    inputs.mouse_was_used = false;
    for (const key_state of Object.values(inputs.mouse_keys)) {
        if (key_state.pressed || key_state.down || key_state.released) {
            inputs.mouse_was_used = true;
            break;
        }
    }
    inputs.controller_was_used = false;
    // for controller_state : inputs.controllers {
    //     for key_state : controller_state.buttons {
    //         if key_state.pressed || key_state.down || key_state.released {
    //             inputs.controller_was_used = true;
    //             break;
    //         }
    //     }
    //     for axis_state : controller_state.axes {
    //         if abs(axis_state) > CONTROLLER_DEADZONE {
    //             inputs.controller_was_used = true;
    //             break;
    //         }
    //     }
    // }

    for (const key_state of Object.values(inputs.keys)) {
        key_state.pressed = false;
        key_state.released = false;
    }
    for (const key_state of Object.values(inputs.mouse_keys)) {
        key_state.pressed = false;
        key_state.released = false;
    }
    // for controller_state : inputs.controllers {
    //     for *key_state : controller_state.buttons {
    //         key_state.pressed = false;
    //         key_state.released = false;
    //     }
    // }
}

function log_matrix(matrix: Matrix4) {
    let str = "";
    for (let i = 0; i < matrix.length; i++) {
        if (i > 0 && i % 4 == 0) {
            str += "\n";
        }
        str += `${matrix[i].toString().padStart(4)}, `;
    }
    console.log(str);
}
function load_image(url: string): Promise<HTMLImageElement> {
    const image = new Image();
    image.src = url;
    return new Promise((resolve, reject) => {
        image.onload = function(_event: Event) {
            console.log("Image loaded", image);
            resolve(image);
        };
        image.onerror = reject;
    });
}
function sin_01(time: float, frequency: float = 1.0): float {
    return 0.5 * (1 + Math.sin(2 * Math.PI * frequency * time));
}
function assert(condition: Boolean, message: string | null = ""): asserts condition {
    if (!__RELEASE__ && !condition) {
        debugger;
        if (message) {
            console.error("Assertion failed:");
            throw Error(message);
        } else {
            throw Error("Assertion failed!");
        }
    }
}

/*
Mapping from jai structs (_11 - _44) to flat array indices (0-15).
_11 = 0
_12 = 1
_13 = 2
_14 = 3
_21 = 4
_22 = 5
_23 = 6
_24 = 7
_31 = 8
_32 = 9
_33 = 10
_34 = 11
_41 = 12
_42 = 13
_43 = 14
_44 = 15
 */
function matrix4_make_orthographic_projection(left: float, right: float, bottom: float, top: float, near: float, far: float): Matrix4 {
    const result = matrix4_zero();

    result[0] = 2.0 / (right - left);
    result[3] = - (right + left) / (right - left);

    result[5] = 2.0 / (top - bottom);
    result[7] = - (top + bottom) / (top - bottom);

    result[10] = -2 / (far - near);
    result[11] = - (far + near) / (far - near);
    result[15] = 1.0;

    return result;
}
function matrix4_multiply(m: Matrix4, n: Matrix4): Matrix4 {
    assert(m.length === n.length);
    assert(m.length === 16);
    const result = matrix4_zero();

    var b00 = n[0 * 4 + 0];
    var b01 = n[0 * 4 + 1];
    var b02 = n[0 * 4 + 2];
    var b03 = n[0 * 4 + 3];
    var b10 = n[1 * 4 + 0];
    var b11 = n[1 * 4 + 1];
    var b12 = n[1 * 4 + 2];
    var b13 = n[1 * 4 + 3];
    var b20 = n[2 * 4 + 0];
    var b21 = n[2 * 4 + 1];
    var b22 = n[2 * 4 + 2];
    var b23 = n[2 * 4 + 3];
    var b30 = n[3 * 4 + 0];
    var b31 = n[3 * 4 + 1];
    var b32 = n[3 * 4 + 2];
    var b33 = n[3 * 4 + 3];
    var a00 = m[0 * 4 + 0];
    var a01 = m[0 * 4 + 1];
    var a02 = m[0 * 4 + 2];
    var a03 = m[0 * 4 + 3];
    var a10 = m[1 * 4 + 0];
    var a11 = m[1 * 4 + 1];
    var a12 = m[1 * 4 + 2];
    var a13 = m[1 * 4 + 3];
    var a20 = m[2 * 4 + 0];
    var a21 = m[2 * 4 + 1];
    var a22 = m[2 * 4 + 2];
    var a23 = m[2 * 4 + 3];
    var a30 = m[3 * 4 + 0];
    var a31 = m[3 * 4 + 1];
    var a32 = m[3 * 4 + 2];
    var a33 = m[3 * 4 + 3];
    result[ 0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    result[ 1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    result[ 2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    result[ 3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
    result[ 4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    result[ 5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    result[ 6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    result[ 7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
    result[ 8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    result[ 9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    result[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    result[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
    result[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    result[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    result[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    result[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

    return result;
}
function matrix4_zero(): Matrix4 {
    return [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
    ];
}
function matrix4_identity(): Matrix4 {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
}
function matrix4_make_scale(x: float, y: float, z: float): Matrix4 {
    const result = matrix4_zero();

    result[0] = x;
    result[5] = y;
    result[10] = z;
    result[15] = 1;

    return result;
}
function matrix4_make_translation(x: float, y: float, z: float): Matrix4 {
    const result = matrix4_identity();

    result[12] = x;
    result[13] = y;
    result[14] = z;

    return result
}
function matrix4_transpose(m: Matrix4): Matrix4 {
    const result = matrix4_zero();

    result[ 0] = m[0];
    result[ 1] = m[4];
    result[ 2] = m[8];
    result[ 3] = m[12];
    result[ 4] = m[1];
    result[ 5] = m[5];
    result[ 6] = m[9];
    result[ 7] = m[13];
    result[ 8] = m[2];
    result[ 9] = m[6];
    result[10] = m[10];
    result[11] = m[14];
    result[12] = m[3];
    result[13] = m[7];
    result[14] = m[11];
    result[15] = m[15];

    return result;
}
function matrix4_rotate_z(m: Matrix4, angle_in_radians: float): Matrix4 {
    const result = matrix4_zero();

    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var c = Math.cos(angle_in_radians);
    var s = Math.sin(angle_in_radians);

    result[ 0] = c * m00 + s * m10;
    result[ 1] = c * m01 + s * m11;
    result[ 2] = c * m02 + s * m12;
    result[ 3] = c * m03 + s * m13;
    result[ 4] = c * m10 - s * m00;
    result[ 5] = c * m11 - s * m01;
    result[ 6] = c * m12 - s * m02;
    result[ 7] = c * m13 - s * m03;

    if (m !== result) {
      result[ 8] = m[ 8];
      result[ 9] = m[ 9];
      result[10] = m[10];
      result[11] = m[11];
      result[12] = m[12];
      result[13] = m[13];
      result[14] = m[14];
      result[15] = m[15];
    }

    return result;
}

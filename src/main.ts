// :shader
const sprite_vs = `
    #version 300 es
    precision highp float;
    precision highp int;

    layout(location=0) in vec4 position;
    layout(location=1) in vec2 uv;
    layout(location=2) in vec4 i_color;
    layout(location=3) in vec2 i_position;
    layout(location=4) in vec2 i_scale;

    uniform mat4 u_matrix;

    out vec4 v_color;
    out vec2 v_uv;

    void main() {
        vec4 pos = vec4((u_matrix * vec4(i_position, 1, 1)).xy, 0, 1);
        gl_Position = (position * vec4(i_scale, 1, 1)) + (pos);
        v_uv = uv;
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

class Game {
    mode:       number;
    renderer:   Renderer;
    texture0:   WebGLTexture;
};
class Renderer {
    gl:                 WebGL2RenderingContext;
    sprite_pass:        Sprite_Pass;
    camera_main:        Camera_Orthographic;
    window_size:        Vector2;
    size_changed:       boolean;
};
class Sprite_Pass {
    program:                WebGLProgram;
    vao:                    WebGLVertexArrayObject;
    indices:                WebGLBuffer;
    instance_data:          WebGLBuffer;
    location_matrix:        WebGLUniformLocation;
    // location_resolution:    WebGLUniformLocation;
}
class Camera_Orthographic {
    position:                   Vector2;
    rotation:                   number;
    zoom:                       number;
    projection_matrix:          Matrix4;
    transform_matrix:           Matrix4;
    view_matrix:                Matrix4;
    view_projection_matrix:     Matrix4;
}

type Vector2 = Float32Array;
type Vector3 = Float32Array;
type Vector4 = Float32Array;
type Matrix4 = Float32Array;
type float   = number;

const ENABLE_SPRITE_PASS = true;
let game: Game;

(function main() {
    requestAnimationFrame(update);
}());

function update() {
    if (game === undefined) {
        game = new Game();

        const [renderer, renderer_ok] = renderer_init();
        if (!renderer_ok) {
            console.error("Couldn't initialize renderer.");
            return;
        }

        game.renderer = renderer;
        renderer_update_camera_matrix_main(game.renderer.camera_main);

        if (ENABLE_SPRITE_PASS) {
            game.renderer.sprite_pass = renderer_make_sprite_pass(game.renderer.gl);
            // TODO: Don't render the game while the assets are loading
            load_image("/public/favicon-16x16.png").then(image => { game.texture0 = renderer_create_texture(image, game.renderer.gl); });
            // load_image("/public/screenshots/hubside/banner-large.jpg").then(image => { renderer_create_texture(image, game.renderer.gl); });
        }
    }

    const gl = game.renderer.gl;

    game.renderer.size_changed = window.innerWidth !== game.renderer.window_size[0] || window.innerHeight !== game.renderer.window_size[1];
    game.renderer.window_size[0] = window.innerWidth;
    game.renderer.window_size[1] = window.innerHeight;
    gl.canvas.width = game.renderer.window_size[0];
    gl.canvas.height = game.renderer.window_size[1];

    if (game.renderer.size_changed) {
        renderer_update_camera_matrix_main(game.renderer.camera_main);
    }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // :render
    render: {
        gl.clearColor(0.25, 0.25, 0.25, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        function make_scale_matrix4(v: Vector3): Matrix4 {
            const result = Matrix4_Zero();

            result[0] = v[0];
            result[5] = v[1];
            result[10] = v[2];

            return result;
        }
        // function make_scale_matrix4(v: Vector3): Matrix4 {
        //     const sx = v[0];
        //     const sy = v[1];
        //     const sz = v[2];
        //     return new Float32Array([
        //         sx, 0, 0, 0,
        //         0, sy, 0, 0,
        //         0, 0, sz, 0,
        //         0, 0,  0, 1,
        //     ]);
        // }

        if (ENABLE_SPRITE_PASS) {
            gl.useProgram(game.renderer.sprite_pass.program);

            // gl.uniformMatrix4fv(game.renderer.sprite_pass.location_matrix, false, Matrix4_Identity());
            gl.uniformMatrix4fv(game.renderer.sprite_pass.location_matrix, false, game.renderer.camera_main.view_projection_matrix);

            gl.bindTexture(gl.TEXTURE_2D, game.texture0);
            gl.bindBuffer(gl.ARRAY_BUFFER, game.renderer.sprite_pass.instance_data);
            const t = sin_01(Date.now(), 1.0 / 1000);
            const instance_data = new Float32Array([
                /* color */ 0.0, 0.5, t,   1.0, /* position */ 0, 0,                                /* scale */ 1.0, 1.0,
                /* color */ 1.0, 0.5, 0.0, 1.0, /* position */ t * game.renderer.window_size[0], 0, /* scale */ 0.5, 0.5,
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, instance_data, gl.STREAM_DRAW);
            gl.bindVertexArray(game.renderer.sprite_pass.vao);
            const instance_count = 2;
            gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, game.renderer.sprite_pass.indices as GLintptr, instance_count);
        }
    }

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

    const renderer = new Renderer();
    renderer.gl = _gl;

    renderer.sprite_pass = new Sprite_Pass();
    renderer.window_size = new Float32Array([window.innerWidth, window.innerHeight]);
    renderer.camera_main = new Camera_Orthographic();

    return [renderer, true];
}
function renderer_make_sprite_pass(gl: WebGL2RenderingContext): Sprite_Pass {
    const pass = new Sprite_Pass();
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

        const location_color = gl.getAttribLocation(pass.program, "i_color");
        assert(location_color != -1, "Couldn't get attrib location i_color.");
        gl.enableVertexAttribArray(location_color);
        gl.vertexAttribPointer(location_color, 4, gl.FLOAT, false, 32, 0);
        gl.vertexAttribDivisor(location_color, 1);

        const location_position = gl.getAttribLocation(pass.program, "i_position");
        assert(location_position != -1, "Couldn't get attrib location i_position.");
        gl.enableVertexAttribArray(location_position);
        gl.vertexAttribPointer(location_position, 2, gl.FLOAT, false, 32, 16);
        gl.vertexAttribDivisor(location_position, 1);

        const location_scale = gl.getAttribLocation(pass.program, "i_scale");
        assert(location_scale != -1, "Couldn't get attrib location i_scale.");
        gl.enableVertexAttribArray(location_scale);
        gl.vertexAttribPointer(location_scale, 2, gl.FLOAT, false, 32, 24);
        gl.vertexAttribDivisor(location_scale, 1);
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
    gl.pixelStorei  (gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture  (gl.TEXTURE_2D, texture);
    gl.texImage2D   (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

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

// 11 = 0
// 12 = 1
// 13 = 2
// 14 = 3
// 21 = 4
// 22 = 5
// 23 = 6
// 24 = 7
// 31 = 8
// 32 = 9
// 33 = 10
// 34 = 11
// 41 = 12
// 42 = 13
// 43 = 14
// 44 = 15

function orthographic_projection_matrix(left: float, right: float, bottom: float, top: float, near: float, far: float): Matrix4 {
    const result = Matrix4_Zero();

    result[0] = 2.0 / (right - left);
    result[3] = - (right + left) / (right - left);

    result[5] = 2.0 / (top - bottom);
    result[7] = - (top + bottom) / (top - bottom);

    result[10] = -2 / (far - near);
    result[11] = - (far + near) / (far - near);
    result[15] = 1.0;

    return result;
}
function matrix4_mul(m: Matrix4, n: Matrix4): Matrix4 {
    assert(m.byteLength === n.byteLength);
    const result = Matrix4_Zero();

    // result[0] = m[0]*n[0] + m[1]*n[4] + m[2]*n[8] + m[3]*n[12];
    // result[4] = m[4]*n[0] + m[5]*n[4] + m[6]*n[8] + m[7]*n[12];
    // result[8] = m[8]*n[0] + m[9]*n[4] + m[10]*n[8] + m[11]*n[12];
    // result[12] = m[12]*n[0] + m[13]*n[4] + m[14]*n[8] + m[15]*n[12];

    // result[1] = m[0]*n[1] + m[1]*n[5] + m[2]*n[9] + m[3]*n[13];
    // result[5] = m[4]*n[1] + m[5]*n[5] + m[6]*n[9] + m[7]*n[13];
    // result[9] = m[8]*n[1] + m[9]*n[5] + m[10]*n[9] + m[11]*n[13];
    // result[13] = m[12]*n[1] + m[13]*n[5] + m[14]*n[9] + m[15]*n[13];

    // result[2] = m[0]*n[2] + m[1]*n[6] + m[2]*n[10] + m[3]*n[14];
    // result[6] = m[4]*n[2] + m[5]*n[6] + m[6]*n[10] + m[7]*n[14];
    // result[10] = m[8]*n[2] + m[9]*n[6] + m[10]*n[10] + m[11]*n[14];
    // result[14] = m[12]*n[2] + m[13]*n[6] + m[14]*n[10] + m[15]*n[14];

    // result[3] = m[0]*n[3] + m[1]*n[7] + m[2]*n[11] + m[3]*n[15];
    // result[7] = m[4]*n[3] + m[5]*n[7] + m[6]*n[11] + m[7]*n[15];
    // result[11] = m[8]*n[3] + m[9]*n[7] + m[10]*n[11] + m[11]*n[15];
    // result[15] = m[12]*n[3] + m[13]*n[7] + m[14]*n[11] + m[15]*n[15];

    var a00 = m[0],
        a01 = m[1],
        a02 = m[2],
        a03 = m[3];
    var a10 = m[4],
        a11 = m[5],
        a12 = m[6],
        a13 = m[7];
    var a20 = m[8],
        a21 = m[9],
        a22 = m[10],
        a23 = m[11];
    var a30 = m[12],
        a31 = m[13],
        a32 = m[14],
        a33 = m[15]; // Cache only the current line of the second matrix

    var b0 = n[0],
        b1 = n[1],
        b2 = n[2],
        b3 = n[3];
    result[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    result[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    result[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    result[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = n[4];
    b1 = n[5];
    b2 = n[6];
    b3 = n[7];
    result[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    result[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    result[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    result[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = n[8];
    b1 = n[9];
    b2 = n[10];
    b3 = n[11];
    result[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    result[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    result[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    result[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = n[12];
    b1 = n[13];
    b2 = n[14];
    b3 = n[15];
    result[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    result[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    result[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    result[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    return result;
}
function matrix4_inverse(mat: Matrix4): Matrix4 {
    return mat;
}

function Matrix4_Zero(): Matrix4 {
    return new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
    ])
}
function Matrix4_Identity(): Matrix4 {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ])
}

function renderer_update_camera_matrix_main(camera: Camera_Orthographic): void {
    camera.projection_matrix = orthographic_projection_matrix(
        -game.renderer.window_size[0]/2,    +game.renderer.window_size[0]/2,
        +game.renderer.window_size[1]/2,    -game.renderer.window_size[1]/2,
        -1,                                 +1,
    );

    camera.transform_matrix = Matrix4_Identity();
    // camera.transform_matrix *= mat4Rotate(.{ 0, 0, 1 }, camera.rotation);
    // camera.transform_matrix *= make_scale_matrix4(.{ 1/camera.zoom, 1/camera.zoom, 0 });
    // camera.transform_matrix *= transpose(make_translation_matrix4(make_vector3(camera.position, 0)));

    camera.view_matrix = matrix4_inverse(camera.transform_matrix);
    camera.view_projection_matrix = matrix4_mul(camera.view_matrix, camera.projection_matrix);
    console.table({
        projection_matrix: camera.projection_matrix,
        view_matrix: camera.view_matrix,
        view_projection_matrix: camera.view_projection_matrix,
    });
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

function sin_01(time: number, frequency: number = 1.0): number {
    return 0.5 * (1 + Math.sin(2 * Math.PI * frequency * time));
}

function assert(condition: Boolean, message: string | null = ""): asserts condition {
    if (!condition) {
        debugger;
        if (message) {
            console.error("Assertion failed:");
            throw Error(message);
        } else {
            throw Error("Assertion failed!");
        }
    }
}

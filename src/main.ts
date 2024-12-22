// :shader
const sprite_vs = `
    #version 300 es
    precision highp float;
    precision highp int;

    layout(location=0) in vec2 position;
    layout(location=1) in vec2 uv;
    layout(location=2) in vec4 i_color;
    layout(location=3) in mat4 i_matrix;

    uniform mat4 u_matrix;

    out vec4 v_color;
    out vec2 v_uv;

    void main() {
        gl_Position = u_matrix * (i_matrix * vec4(position, 0, 1));
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

    gl.viewport(0, 0, game.renderer.window_size[0], game.renderer.window_size[1]);

    // :render
    render: {
        gl.clearColor(0.25, 0.25, 0.25, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (ENABLE_SPRITE_PASS) {
            gl.useProgram(game.renderer.sprite_pass.program);

            const projection = matrix_ortho3d_f32(
                game.renderer.window_size[0]*-0.5, game.renderer.window_size[0]*0.5,
                game.renderer.window_size[1]*-0.5, game.renderer.window_size[1]*0.5,
                -1,                                +1,
            );
            let view = Matrix4_Identity();
            // view = matrix4_mul(view, matrix4_translate_f32(100, 0, 0));
            gl.uniformMatrix4fv(game.renderer.sprite_pass.location_matrix, false, matrix4_mul(projection, view));
            // gl.uniformMatrix4fv(game.renderer.sprite_pass.location_matrix, false, game.renderer.camera_main.view_projection_matrix);

            const t = sin_01(Date.now(), 1.0 / 1000);

            gl.bindVertexArray(game.renderer.sprite_pass.vao);
            gl.bindTexture(gl.TEXTURE_2D, game.texture0);

            const items: Float32Array[] = [];
            {
                let matrix = Matrix4_Identity();
                matrix = matrix4_mul(matrix, matrix4_translate_f32(100, 0, 0));
                // FIXME: find out why translation isn't working here
                matrix = matrix4_mul(matrix, matrix4_scale_f32(32*2, 32*2, 0));
                matrix = z_rotate(matrix, t);
                items.push(new Float32Array([
                    /* color */ 1.0, 0.0, 0.0, 1.0, /* matrix */ ...matrix,
                ]));
            }
            {
                let matrix = Matrix4_Identity();
                matrix = matrix4_mul(matrix, matrix4_scale_f32(32*1, 32*1, 1));
                // matrix = matrix4_mul(matrix, make_scale_matrix4(32, 32, 1));
                items.push(new Float32Array([
                    /* color */ 0.0, 1.0, t, 1.0, /* matrix */ ...matrix,
                ]));
            }
            const instance_data = Float32Array.from([...items[0], ...items[1]]); // FIXME: this allocates a lot of junk!

            gl.bindBuffer(gl.ARRAY_BUFFER, game.renderer.sprite_pass.instance_data);
            gl.bufferData(gl.ARRAY_BUFFER, instance_data, gl.STREAM_DRAW);

            gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, game.renderer.sprite_pass.indices as GLintptr, items.length);
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
        gl.vertexAttribPointer(location_color, 4, gl.FLOAT, false, 80, 0);
        gl.vertexAttribDivisor(location_color, 1);

        const location_matrix = gl.getAttribLocation(pass.program, "i_matrix");
        assert(location_matrix != -1, "Couldn't get attrib location i_matrix.");
        const bytesPerMatrix = 16 + 4 * 16;
        for (let i = 0; i < 3; ++i) {
            const loc = location_matrix + i;
            gl.enableVertexAttribArray(loc);
            // note the stride and offset
            const offset = 16 + i * 4 * 4;  // 4 floats per row, 4 bytes per float
            gl.vertexAttribPointer(
                loc,              // location
                4,                // size (num values to pull from buffer per iteration)
                gl.FLOAT,         // type of data in buffer
                false,            // normalize
                bytesPerMatrix,   // stride, num bytes to advance to get to next set of values
                offset,           // offset in buffer
            );
            // this line says this attribute only changes for each 1 instance
            gl.vertexAttribDivisor(loc, 1);
        }
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

// _11 = 0
// _12 = 1
// _13 = 2
// _14 = 3
// _21 = 4
// _22 = 5
// _23 = 6
// _24 = 7
// _31 = 8
// _32 = 9
// _33 = 10
// _34 = 11
// _41 = 12
// _42 = 13
// _43 = 14
// _44 = 15

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

function matrix4_scale_f32(x: number, y: number, z: number): Matrix4 {
    const result = Matrix4_Zero();
    result[0] = x;
    result[5] = y;
    result[10] = z;
    result[15] = 1;
    return result;
}
function matrix_ortho3d_f32(left: number, right: number, bottom: number, top: number, near: number, far: number, flip_z_axis: boolean = true): Matrix4 {
    const m = Matrix4_Zero();
    m[0] = +2 / (right - left);
    m[5] = +2 / (top - bottom);
    m[10] = +2 / (far - near);
    m[3] = -(right + left)   / (right - left);
    m[7] = -(top   + bottom) / (top - bottom);
    m[11] = -(far + near) / (far- near);
    m[15] = 1;

    if (flip_z_axis) {
        m[2] = -m[2];
    }

    return m;
}
function matrix4_translate_f32(x: number, y: number, z: number): Matrix4 {
    const m = Matrix4_Identity();
    m[12] = x;
    m[13] = y;
    m[14] = z;
    return m
}

function transpose(m: Matrix4): Matrix4 {
    const result = Matrix4_Zero();

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

// Returns a translation matrix given a translation vector.
function make_translation_matrix4(x: number, y: number, z: number): Matrix4 {
    const result = Matrix4_Identity();

    // result[3] = x;
    // result[7] = y;
    // result[11] = z;

    result[ 0] = 1;
    result[ 1] = 0;
    result[ 2] = 0;
    result[ 3] = 0;
    result[ 4] = 0;
    result[ 5] = 1;
    result[ 6] = 0;
    result[ 7] = 0;
    result[ 8] = 0;
    result[ 9] = 0;
    result[10] = 1;
    result[11] = 0;
    result[12] = x;
    result[13] = y;
    result[14] = z;
    result[15] = 1;

    return result;
}

function z_rotate(m: Matrix4, angle_in_radians:number): Matrix4 {
    // This is the optimized version of
    // return multiply(m, zRotation(angle_in_radians), dst);
    // dst = dst || new MatType(16);
    const dst = Matrix4_Zero();

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

    dst[ 0] = c * m00 + s * m10;
    dst[ 1] = c * m01 + s * m11;
    dst[ 2] = c * m02 + s * m12;
    dst[ 3] = c * m03 + s * m13;
    dst[ 4] = c * m10 - s * m00;
    dst[ 5] = c * m11 - s * m01;
    dst[ 6] = c * m12 - s * m02;
    dst[ 7] = c * m13 - s * m03;

    /* if (m !== dst)  */{
      dst[ 8] = m[ 8];
      dst[ 9] = m[ 9];
      dst[10] = m[10];
      dst[11] = m[11];
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }

    return dst;
}

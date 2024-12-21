const sprite_vs = `
    #version 300 es
    precision highp float;
    precision highp int;

    layout (location=0) in vec4 position;
    layout (location=1) in vec2 uv;
    layout (location=2) in vec4 i_color;
    layout (location=3) in vec2 i_position;
    out vec4 v_color;
    out vec2 v_uv;

    void main() {
        gl_Position = position + vec4(i_position, 0, 0);
        v_uv = uv;
        v_color = i_color;
    }
`;
const sprite_fs = `
    #version 300 es
    precision highp float;

    uniform sampler2D u_texture;
    in vec2 v_uv;
    in vec4 v_color;
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
};
class Sprite_Pass {
    program:                WebGLProgram;
    vao:                    WebGLVertexArrayObject;
    indices:                WebGLBuffer;
    instance_data:          WebGLBuffer;
    location_resolution:    WebGLUniformLocation;
    location_color:         WebGLUniformLocation;
}

const ENABLE_SPRITE_PASS = true;
let game: Game;

requestAnimationFrame(update);

function update() {
    if (game === undefined) {
        game = new Game();

        const [renderer, renderer_ok] = renderer_init();
        if (renderer_ok) {
            game.renderer = renderer;
        } else {
            console.error("Couldn't initialize renderer.");
            return;
        }

        if (ENABLE_SPRITE_PASS) {
            game.renderer.sprite_pass = renderer_make_sprite_pass(game.renderer.gl);
            load_image("/public/favicon-16x16.png").then(image => { game.texture0 = renderer_create_texture(image, game.renderer.gl); });
            // load_image("/public/screenshots/hubside/banner-large.jpg").then(image => { renderer_create_texture(image, game.renderer.gl); });
        }
    }

    const gl = game.renderer.gl;

    render: {
        gl.canvas.width = window.innerWidth;
        gl.canvas.height = window.innerHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0.25, 0.25, 0.25, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (ENABLE_SPRITE_PASS) {
            gl.useProgram(game.renderer.sprite_pass.program);
            gl.bindTexture(gl.TEXTURE_2D, game.texture0);
            gl.bindBuffer(gl.ARRAY_BUFFER, game.renderer.sprite_pass.instance_data);
            const t = sin_01(Date.now(), 1.0 / 1000);
            const colors = new Float32Array([
                /* color */ 1.0, 0.5, 0.0, 1.0, /* position */ t,   1.0,
                /* color */ 0.0, 0.5, t,   1.0, /* position */ 0.0, 0.0,
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STREAM_DRAW);
            gl.bindVertexArray(game.renderer.sprite_pass.vao);
            gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, game.renderer.sprite_pass.indices as GLintptr, 2);
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

    return [renderer, true];
}

function renderer_make_sprite_pass(gl: WebGL2RenderingContext): Sprite_Pass {
    const pass = new Sprite_Pass();
    const [program, program_ok] = create_program(gl, sprite_vs, sprite_fs);
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

        const position = gl.getAttribLocation(pass.program, "position");
        assert(position != -1, "Couldn't get attrib position position.");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0);

        const uv = gl.getAttribLocation(pass.program, "uv");
        assert(uv != -1, "Couldn't get attrib position uv.");
        gl.enableVertexAttribArray(uv);
        gl.vertexAttribPointer(uv, 2, gl.FLOAT, true, 16, 8);
    }

    {
        const instance_data = gl.createBuffer();
        assert(instance_data !== null, "Couldn't create instance_data buffer.");
        pass.instance_data = instance_data;
        gl.bindBuffer(gl.ARRAY_BUFFER, pass.instance_data);

        const color = gl.getAttribLocation(pass.program, "i_color");
        assert(color != -1, "Couldn't get attrib position i_color.");
        gl.enableVertexAttribArray(color);
        gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 24, 0);
        gl.vertexAttribDivisor(color, 1);

        const position = gl.getAttribLocation(pass.program, "i_position");
        assert(position != -1, "Couldn't get attrib position i_position.");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 24, 16);
        gl.vertexAttribDivisor(position, 1);
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

function create_program(gl: WebGL2RenderingContext, vs: string, fs: string): [WebGLProgram, true] | [null, false] {
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

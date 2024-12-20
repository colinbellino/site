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

type Pass_Common = {
    program:            WebGLProgram;
    vs_shader:          WebGLShader;
    fs_shader:          WebGLShader;
};
type State = {
    gl:                 WebGL2RenderingContext;
    sprite_pass: {
        common:                 Pass_Common;
        colors:                 WebGLBuffer;
        vao:                    WebGLVertexArrayObject;
        indices:                WebGLBuffer;
        location_resolution:    WebGLUniformLocation;
        location_color:         WebGLUniformLocation;
        image0:                 HTMLImageElement;
        texture0:               WebGLTexture;
    },
};

var gl: WebGL2RenderingContext;
var state: State;
var enable_sprite_pass = true;

main();

function main() {
    // @ts-ignore
    state = {
        // @ts-ignore
        sprite_pass: { common: {} },
        // @ts-ignore
        sprite_pass: { common: {} },
    };

    const canvas = document.querySelector("canvas");
    assert(canvas !== null, "Canvas not found");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const _gl = canvas.getContext("webgl2");
    // TODO: gracefully handle this case
    assert(_gl !== null, "Couldn't get WebGL2 context.");
    gl = _gl;

    if (enable_sprite_pass) {
        create_program(state.sprite_pass.common, sprite_vs, sprite_fs);

        var vertexArray = gl.createVertexArray();
        gl.bindVertexArray(vertexArray);

        const vertices = new Float32Array([
            // position     // uv
            +0.5, +0.5,     1, 1,
            -0.5, +0.5,     0, 1,
            -0.5, -0.5,     0, 0,
            +0.5, -0.5,     1, 0,
        ]);
        var vertexPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        const position = gl.getAttribLocation(state.sprite_pass.common.program, "position");
        assert(position != -1);
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0);
        const uv = gl.getAttribLocation(state.sprite_pass.common.program, "uv");
        assert(uv != -1);
        gl.enableVertexAttribArray(uv);
        gl.vertexAttribPointer(uv, 2, gl.FLOAT, true, 16, 8);

        {
            var color_buffer = gl.createBuffer();
            assert(color_buffer !== null);
            state.sprite_pass.colors = color_buffer;
            const color = gl.getAttribLocation(state.sprite_pass.common.program, "i_color");
            assert(color != -1);
            gl.bindBuffer(gl.ARRAY_BUFFER, state.sprite_pass.colors);
            gl.enableVertexAttribArray(color);
            gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 24, 0);
            gl.vertexAttribDivisor(color, 1);

            const position = gl.getAttribLocation(state.sprite_pass.common.program, "i_position");
            assert(position != -1);
            // gl.bindBuffer(gl.ARRAY_BUFFER, state.sprite_pass.positions);
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
            state.sprite_pass.indices = indices_buffer;
        }

        gl.bindVertexArray(null);

        load_image("/public/favicon-16x16.png", state.sprite_pass.image0, state.sprite_pass.texture0);
    }

    requestAnimationFrame(render);

    function render() {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0.25, 0.25, 0.25, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (enable_sprite_pass) {
            gl.useProgram(state.sprite_pass.common.program);
            gl.bindBuffer(gl.ARRAY_BUFFER, state.sprite_pass.colors);
            var colors = new Float32Array([
                1.0, 0.5, 0.0, 1.0,                            /*  */ sin_01(Date.now(), 1.0 / 1000), 1.0,
                0.0, 0.5, sin_01(Date.now(), 1.0 / 1000), 1.0, /*  */ 0.0, 0.0,
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STREAM_DRAW);
            gl.bindVertexArray(vertexArray);
            gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, state.sprite_pass.indices as GLintptr, 2);
        }

        requestAnimationFrame(render);
    }
}

function load_image(url: string, image_ptr: HTMLImageElement, texture_ptr: WebGLTexture) {
    var img = new Image();
    img.src = url;
    img.onload = function(event: Event) {
        const image = event.target as HTMLImageElement;
        const texture = gl.createTexture();
        assert(texture !== null, "Couldn't create texture.");

        gl.activeTexture(gl.TEXTURE0);
        gl.pixelStorei  (gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture  (gl.TEXTURE_2D, texture);
        gl.texImage2D   (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        image_ptr = image;
        texture_ptr = texture;
        console.log("Image loaded", image);
    };
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

function create_program(common: Pass_Common, vs: string, fs: string) {
    const vs_shader = gl.createShader(gl.VERTEX_SHADER);
    assert(vs_shader !== null, "Couldn't create vertex shader.");
    gl.shaderSource(vs_shader, vs.trim());
    gl.compileShader(vs_shader);
    const vertex_shader_status : GLboolean = gl.getShaderParameter(vs_shader, gl.COMPILE_STATUS);
    assert(vertex_shader_status, gl.getShaderInfoLog(vs_shader));
    common.vs_shader = vs_shader;

    const fs_shader = gl.createShader(gl.FRAGMENT_SHADER);
    assert(fs_shader !== null, "Couldn't create fragment shader.");
    gl.shaderSource(fs_shader, fs.trim());
    gl.compileShader(fs_shader);
    const fragment_shader_status : GLboolean = gl.getShaderParameter(fs_shader, gl.COMPILE_STATUS);
    assert(fragment_shader_status, gl.getShaderInfoLog(fs_shader));
    common.fs_shader = fs_shader;

    const _program = gl.createProgram();
    assert(_program !== null, "Couldn't create program.");
    gl.attachShader(_program, vs_shader);
    gl.attachShader(_program, fs_shader);
    gl.linkProgram(_program);
    const program_status : GLboolean = gl.getProgramParameter(_program, gl.LINK_STATUS);
    assert(program_status, gl.getProgramInfoLog(_program));
    common.program = _program;
}

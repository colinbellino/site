const sprite_vs = `
    #version 300 es
    layout (location=0) in vec4 position;
    layout (location=1) in vec2 uv;
    layout (location=2) in vec2 i_position;
    out vec2 v_uv;

    void main() {
        gl_Position = position + vec4(i_position, 0, 0);
        v_uv = uv;
    }
`;
const sprite_fs = `
    #version 300 es
    precision highp float;

    uniform sampler2D u_texture;
    in vec2 v_uv;
    out vec4 frag_color;

    void main() {
        frag_color = texture(u_texture, v_uv);
        // frag_color = v_color;
    }
`;
const test_vs = `
    #version 300 es
    #define POSITION_LOCATION 0
    #define COLOR_LOCATION 1

    precision highp float;
    precision highp int;

    layout(location = POSITION_LOCATION) in vec2 pos;
    layout(location = COLOR_LOCATION) in vec4 color;
    flat out vec4 v_color;

    void main()
    {
        v_color = color;
        gl_Position = vec4(pos + vec2(float(gl_InstanceID) - 0.5, 0.0), 0.0, 1.0);
    }
`;
const test_fs = `
    #version 300 es
    precision highp float;
    precision highp int;

    flat in vec4 v_color;
    out vec4 color;

    void main()
    {
        color = v_color;
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
        common:             Pass_Common;
        vertices:           WebGLBuffer;
        indices:            WebGLBuffer;
        positions:          WebGLBuffer;
        vao:                WebGLVertexArrayObject;
        image0:             HTMLImageElement;
        texture0:           WebGLTexture;
    },
    test_pass: {
        common:                 Pass_Common;
        colors:                 WebGLBuffer;
        vao:                    WebGLVertexArrayObject;
        location_resolution:    WebGLUniformLocation;
        location_color:         WebGLUniformLocation;
    },
};

var gl: WebGL2RenderingContext;
var state: State;
var enable_sprite_pass = true;
var enable_test_pass = true;

main();

function main() {
    // @ts-ignore
    state = {
        // @ts-ignore
        sprite_pass: { common: {} },
        // @ts-ignore
        test_pass: { common: {} },
    };

    const canvas = document.querySelector("canvas");
    assert(canvas !== null, "Canvas not found");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const _gl = canvas.getContext("webgl2");
    // TODO: gracefully handle this case
    assert(_gl !== null, "Couldn't get WebGL2 context.");
    gl = _gl;

    if (enable_test_pass) {
        create_program(state.test_pass.common, test_vs, test_fs);

        // -- Init Vertex Array
        var vertexArray = gl.createVertexArray();
        gl.bindVertexArray(vertexArray);

        // -- Init Buffers
        var vertexPosLocation = 0;  // set with GLSL layout qualifier
        var vertices = new Float32Array([
            -0.3, -0.5,
            0.3, -0.5,
            0.0,  0.5
        ]);
        var vertexPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(vertexPosLocation);
        gl.vertexAttribPointer(vertexPosLocation, 2, gl.FLOAT, false, 0, 0);

        var vertexColorLocation = 1;  // set with GLSL layout qualifier
        var vertexColorBuffer = gl.createBuffer();
        assert(vertexColorBuffer !== null);
        state.test_pass.colors = vertexColorBuffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, state.test_pass.colors);
        gl.enableVertexAttribArray(vertexColorLocation);
        gl.vertexAttribPointer(vertexColorLocation, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(vertexColorLocation, 1); // attribute used once per instance

        gl.bindVertexArray(null);
    }
    if (enable_sprite_pass) {
        create_program(state.sprite_pass.common, sprite_vs, sprite_fs);

        {
            const vertices = new Float32Array([
                // position     // uv
                +0.5, +0.5,     1, 1,
                -0.5, +0.5,     0, 1,
                -0.5, -0.5,     0, 0,
                +0.5, -0.5,     1, 0,
            ]);
            const vertices_buffer = gl.createBuffer();
            assert(vertices_buffer != null, "Couldn't create vertices_buffer.");
            gl.bindBuffer(gl.ARRAY_BUFFER, vertices_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
            const position = gl.getAttribLocation(state.sprite_pass.common.program, "position");
            console.log("position", position);
            gl.enableVertexAttribArray(position);
            gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0);
            const uv = gl.getAttribLocation(state.sprite_pass.common.program, "uv");
            console.log("uv", uv);
            gl.enableVertexAttribArray(uv);
            gl.vertexAttribPointer(uv, 2, gl.FLOAT, true, 16, 8);
            state.sprite_pass.vertices = vertices_buffer;
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

        load_image("/public/favicon-16x16.png", state.sprite_pass.image0, state.sprite_pass.texture0);
    }

    requestAnimationFrame(render);

    function render() {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0.25, 0.25, 0.25, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (enable_sprite_pass) {
            gl.useProgram(state.sprite_pass.common.program);
            gl.bindVertexArray(null);

            const texture = gl.getUniformLocation(state.sprite_pass.common.program, "u_texture");
            gl.uniform1i(texture, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, state.sprite_pass.vertices);

            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, state.sprite_pass.indices as GLintptr);
        }
        if (enable_test_pass) {
            gl.useProgram(state.test_pass.common.program);
            gl.bindBuffer(gl.ARRAY_BUFFER, state.test_pass.colors);
            var colors = new Float32Array([
                1.0, 0.5, sin_01(Date.now(), 1.0 / 1000),
                0.0, 0.5, sin_01(Date.now(), 1.0 / 1000),
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STREAM_DRAW);
            gl.bindVertexArray(vertexArray);
            gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 2);
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
        if (message) {
            console.error("Assertion failed:");
            throw Error(message);
        } else {
            throw Error("Assertion failed!");
        }
        // debugger;
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

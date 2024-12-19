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

    in vec2 a_position;
    uniform vec2 u_resolution;

    // all shaders have a main function
    void main() {
        // convert the position from pixels to 0.0 to 1.0
        vec2 zeroToOne = a_position / u_resolution;

        // convert from 0->1 to 0->2
        vec2 zeroToTwo = zeroToOne * 2.0;

        // convert from 0->2 to -1->+1 (clipspace)
        vec2 clipSpace = zeroToTwo - 1.0;

        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
`;
const test_fs = `
    #version 300 es
    precision highp float;

    uniform vec4 u_color;
    out vec4 outColor;

    void main() {
        outColor = u_color;
        // outColor = vec4(1, 0, 0, 1);
    }
`;

type State = {
    // canvas:             HTMLCanvasElement;
    gl:                 WebGL2RenderingContext;
    sprite_pass: {
        program:            WebGLProgram;
        vs_shader:          WebGLShader;
        fs_shader:          WebGLShader;
        vertices:           WebGLBuffer;
        indices:            WebGLBuffer;
        positions:          WebGLBuffer;
        vao:                WebGLVertexArrayObject;
        image0:             HTMLImageElement;
        texture0:           WebGLTexture;
    },
    test_pass: {
        program:                WebGLProgram;
        vs_shader:              WebGLShader;
        fs_shader:              WebGLShader;
        positions:              WebGLBuffer;
        vao:                    WebGLVertexArrayObject;
        location_resolution:    WebGLUniformLocation;
        location_color:         WebGLUniformLocation;
    },
};

var state: State;
var test_pass = true;

main();

function main() {
    init: {
        {
            // @ts-ignore
            state = {};

            const canvas = document.querySelector("canvas");
            assert(canvas !== null, "Canvas not found");
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const gl = canvas.getContext("webgl2");
            // TODO: gracefully handle this case
            assert(gl !== null, "Couldn't get WebGL2 context.");
            state.gl = gl;
        }

        if (test_pass) {
            // @ts-ignore
            state.test_pass = {};

            {
                const vs_shader = state.gl.createShader(state.gl.VERTEX_SHADER);
                assert(vs_shader !== null, "Couldn't create vertex shader.");
                state.gl.shaderSource(vs_shader, test_vs.trim());
                state.gl.compileShader(vs_shader);
                const vertex_shader_status : GLboolean = state.gl.getShaderParameter(vs_shader, state.gl.COMPILE_STATUS);
                assert(vertex_shader_status, state.gl.getShaderInfoLog(vs_shader));
                state.test_pass.vs_shader = vs_shader;

                const fs_shader = state.gl.createShader(state.gl.FRAGMENT_SHADER);
                assert(fs_shader !== null, "Couldn't create fragment shader.");
                state.gl.shaderSource(fs_shader, test_fs.trim());
                state.gl.compileShader(fs_shader);
                const fragment_shader_status : GLboolean = state.gl.getShaderParameter(fs_shader, state.gl.COMPILE_STATUS);
                assert(fragment_shader_status, state.gl.getShaderInfoLog(fs_shader));
                state.test_pass.fs_shader = fs_shader;
            }

            {
                const program = state.gl.createProgram();
                assert(program !== null, "Couldn't create program.");
                state.gl.attachShader(program, state.test_pass.vs_shader);
                state.gl.attachShader(program, state.test_pass.fs_shader);
                state.gl.linkProgram(program);
                const program_status : GLboolean = state.gl.getProgramParameter(program, state.gl.LINK_STATUS);
                assert(program_status, state.gl.getProgramInfoLog(program));
                state.test_pass.program = program;
            }

            state.test_pass.location_resolution = state.gl.getUniformLocation(state.test_pass.program, "u_resolution") as WebGLUniformLocation;
            state.test_pass.location_color = state.gl.getUniformLocation(state.test_pass.program, "u_color") as WebGLUniformLocation;
            const a_position = state.gl.getAttribLocation(state.test_pass.program, "a_position");
            {
                const positions_buffer = state.gl.createBuffer();
                assert(positions_buffer != null, "Couldn't position buffer.");
                const vao = state.gl.createVertexArray();
                assert(vao != null, "Couldn't create vao.");
                console.log("a_position", a_position);
                state.gl.bindVertexArray(vao);
                state.gl.enableVertexAttribArray(a_position);
                state.gl.bindBuffer(state.gl.ARRAY_BUFFER, positions_buffer);
                state.gl.vertexAttribPointer(a_position, 2, state.gl.FLOAT, false, 0, 0);
                state.test_pass.vao = vao;
                state.test_pass.positions = positions_buffer;
                assert(state.test_pass.vao !== null);
                assert(state.test_pass.positions !== null);
            }
        } else {
            // @ts-ignore
            state.sprite_pass = {};
            {
                const vs_shader = state.gl.createShader(state.gl.VERTEX_SHADER);
                assert(vs_shader !== null, "Couldn't create vertex shader.");
                state.gl.shaderSource(vs_shader, sprite_vs.trim());
                state.gl.compileShader(vs_shader);
                const vertex_shader_status : GLboolean = state.gl.getShaderParameter(vs_shader, state.gl.COMPILE_STATUS);
                assert(vertex_shader_status, state.gl.getShaderInfoLog(vs_shader));
                state.sprite_pass.vs_shader = vs_shader;

                const fs_shader = state.gl.createShader(state.gl.FRAGMENT_SHADER);
                assert(fs_shader !== null, "Couldn't create fragment shader.");
                state.gl.shaderSource(fs_shader, sprite_fs.trim());
                state.gl.compileShader(fs_shader);
                const fragment_shader_status : GLboolean = state.gl.getShaderParameter(fs_shader, state.gl.COMPILE_STATUS);
                assert(fragment_shader_status, state.gl.getShaderInfoLog(fs_shader));
                state.sprite_pass.fs_shader = fs_shader;
            }

            {
                const program = state.gl.createProgram();
                assert(program !== null, "Couldn't create program.");
                state.gl.attachShader(program, state.sprite_pass.vs_shader);
                state.gl.attachShader(program, state.sprite_pass.fs_shader);
                state.gl.linkProgram(program);
                const program_status : GLboolean = state.gl.getProgramParameter(program, state.gl.LINK_STATUS);
                assert(program_status, state.gl.getProgramInfoLog(program));
                state.sprite_pass.program = program;
            }

            {
                const vertices = new Float32Array([
                    // position     // uv
                    +0.5, +0.5,     1, 1,
                    -0.5, +0.5,     0, 1,
                    -0.5, -0.5,     0, 0,
                    +0.5, -0.5,     1, 0,
                ]);
                const vertices_buffer = state.gl.createBuffer();
                assert(vertices_buffer != null, "Couldn't create vertices_buffer.");
                state.gl.bindBuffer(state.gl.ARRAY_BUFFER, vertices_buffer);
                state.gl.bufferData(state.gl.ARRAY_BUFFER, vertices, state.gl.STATIC_DRAW);
                const position = state.gl.getAttribLocation(state.sprite_pass.program, "position");
                console.log("position", position);
                state.gl.enableVertexAttribArray(position);
                state.gl.vertexAttribPointer(position, 2, state.gl.FLOAT, false, 16, 0);
                const uv = state.gl.getAttribLocation(state.sprite_pass.program, "uv");
                console.log("uv", uv);
                state.gl.enableVertexAttribArray(uv);
                state.gl.vertexAttribPointer(uv, 2, state.gl.FLOAT, true, 16, 8);
                state.sprite_pass.vertices = vertices_buffer;
            }

            {
                const indices = new Uint8Array([
                    0, 1, 2,
                    0, 2, 3,
                ]);
                const indices_buffer = state.gl.createBuffer();
                assert(indices_buffer != null, "Couldn't create indices_buffer.");
                state.gl.bindBuffer(state.gl.ELEMENT_ARRAY_BUFFER, indices_buffer);
                state.gl.bufferData(state.gl.ELEMENT_ARRAY_BUFFER, indices, state.gl.STATIC_DRAW);
                state.sprite_pass.indices = indices_buffer;
            }

            load_image("/public/favicon-16x16.png", state.sprite_pass.image0, state.sprite_pass.texture0);
        }
    }

    requestAnimationFrame(render);
}

function render() {
    state.gl.viewport(0, 0, state.gl.canvas.width, state.gl.canvas.height);

    state.gl.clearColor(0.25, 0.25, 0.25, 1);
    state.gl.clear(state.gl.COLOR_BUFFER_BIT | state.gl.DEPTH_BUFFER_BIT);

    if (test_pass) {
        const rects = [
            new Float32Array([100, 100, 200, 100, 1, 0, 1, 1]),
            new Float32Array([0,   0,   200, 100, 1, 1, 0, 1]),
        ];
        function draw_rect(x: number, y: number, w: number, h: number, r: number, g: number, b: number, a: number) {
            state.gl.useProgram(state.test_pass.program);
            state.gl.bindVertexArray(state.test_pass.vao);
            state.gl.uniform2f(state.test_pass.location_resolution, state.gl.canvas.width, state.gl.canvas.height);
            state.gl.bindBuffer(state.gl.ARRAY_BUFFER, state.test_pass.positions);

            var x1 = x;
            var x2 = x + w;
            var y1 = y;
            var y2 = y + h;
            state.gl.bufferData(state.gl.ARRAY_BUFFER, new Float32Array([
                x1, y1,
                x2, y1,
                x1, y2,
                x1, y2,
                x2, y1,
                x2, y2,
            ]), state.gl.STATIC_DRAW);

            state.gl.uniform4fv(state.test_pass.location_color, [r, g, b, a]);

            state.gl.drawArrays(state.gl.TRIANGLES, 0, 6);
        }
        for (let rect_index = 0; rect_index < rects.length; rect_index++) {
            const rect = rects[rect_index];
            draw_rect(rect[0], rect[1], rect[2], rect[3], rect[4], rect[5], rect[6], rect[7]);
        }
    } else {
        state.gl.useProgram(state.sprite_pass.program);

        const texture = state.gl.getUniformLocation(state.sprite_pass.program, "u_texture");
        const i_position = state.gl.getAttribLocation(state.sprite_pass.program, "i_position");
        assert(texture !== null);
        assert(i_position !== null);

        state.gl.uniform1i(texture, 0);
        state.gl.bindBuffer(state.gl.ARRAY_BUFFER, state.sprite_pass.vertices);

        state.gl.drawElements(state.gl.TRIANGLES, 6, state.gl.UNSIGNED_BYTE, state.sprite_pass.indices as GLintptr);
    }

    requestAnimationFrame(render);
}

function load_image(url: string, image_ptr: HTMLImageElement, texture_ptr: WebGLTexture) {
    var img = new Image();
    img.src = url;
    img.onload = function(event: Event) {
        const image = event.target as HTMLImageElement;
        const texture = state.gl.createTexture();
        assert(texture !== null, "Couldn't create texture.");

        state.gl.activeTexture(state.gl.TEXTURE0);
        state.gl.pixelStorei  (state.gl.UNPACK_FLIP_Y_WEBGL, true);
        state.gl.bindTexture  (state.gl.TEXTURE_2D, texture);
        state.gl.texImage2D   (state.gl.TEXTURE_2D, 0, state.gl.RGBA, state.gl.RGBA, state.gl.UNSIGNED_BYTE, image);
        state.gl.texParameteri(state.gl.TEXTURE_2D, state.gl.TEXTURE_MAG_FILTER, state.gl.NEAREST);
        state.gl.texParameteri(state.gl.TEXTURE_2D, state.gl.TEXTURE_MIN_FILTER, state.gl.NEAREST);

        image_ptr = image;
        texture_ptr = texture;
        console.log("Image loaded", image);
    };
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

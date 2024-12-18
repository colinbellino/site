const vertex_shader_source = `
    #version 300 es
    layout (location=0) in vec4 position;
    layout (location=1) in vec2 uv;
    layout (location=2) in vec4 color;
    out vec4 v_color;

    void main() {
        gl_Position = position;
        v_color = color;
    }
`;
const fragment_shader_source = `
    #version 300 es
    precision highp float;

    in vec4 v_color;
    out vec4 fragColor;

    void main() {
        fragColor = v_color;
    }
`;

const COLOR_WHITE = [1, 1, 1, 1];

type State = {
    canvas:             HTMLCanvasElement;
    gl:                 WebGL2RenderingContext;
    sprite_pass: {
        program:            WebGLProgram;
        vertex_shader:      WebGLShader;
        fragment_shader:    WebGLShader;
        vertices:           WebGLBuffer;
        indices:            WebGLBuffer;
    },
};
// @ts-ignore
const state: State = {}; // @ts-ignore

main();

function main() {
    const canvas = document.querySelector("canvas");
    assert(canvas !== null, "Canvas not found");
    state.canvas = canvas;
    state.canvas.width = window.innerWidth;
    state.canvas.height = window.innerHeight;

    const gl = state.canvas.getContext("webgl2");
    assert(gl !== null, "Couldn't get WebGL2 context.");
    // TODO: gracefully handle this case

    init: {
        gl.clearColor(0.25, 0.25, 0.25, 1);

        // @ts-ignore
        state.sprite_pass = {};
        {
            const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
            assert(vertex_shader !== null, "Couldn't create vertex shader.");
            gl.shaderSource(vertex_shader, vertex_shader_source.trim());
            gl.compileShader(vertex_shader);
            const vertex_shader_status : GLboolean = gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS);
            assert(vertex_shader_status, gl.getShaderInfoLog(vertex_shader));
            state.sprite_pass.vertex_shader = vertex_shader;

            const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
            assert(fragment_shader !== null, "Couldn't create fragment shader.");
            gl.shaderSource(fragment_shader, fragment_shader_source.trim());
            gl.compileShader(fragment_shader);
            const fragment_shader_status : GLboolean = gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS);
            assert(fragment_shader_status, gl.getShaderInfoLog(fragment_shader));
            state.sprite_pass.fragment_shader = fragment_shader;
        }

        {
            const program = gl.createProgram();
            assert(program !== null, "Couldn't create program.");
            gl.attachShader(program, state.sprite_pass.vertex_shader);
            gl.attachShader(program, state.sprite_pass.fragment_shader);
            gl.linkProgram(program);
            const program_status : GLboolean = gl.getProgramParameter(program, gl.LINK_STATUS);
            assert(program_status, gl.getProgramInfoLog(program));
            state.sprite_pass.program = program;
        }

        {
            const vertices = new Float32Array([
                // position         // uv     // color
                +0.5, +0.5,         1, 1,     0, 0, 1, 1,
                -0.5, +0.5,         0, 1,     0, 1, 1, 1,
                -0.5, -0.5,         0, 0,     1, 1, 0, 1,
                +0.5, -0.5,         1, 0,     1, 0, 1, 1,
            ]);
            const vertices_buffer = gl.createBuffer();
            assert(vertices_buffer != null, "Couldn't create vertices_buffer.");
            gl.bindBuffer(gl.ARRAY_BUFFER, vertices_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 32, 0);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(1, 2, gl.FLOAT, true,  32, 8);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16);
            gl.enableVertexAttribArray(2);
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

        // {
        //     const bla = new Uint8Array([
        //         0, 1, 2,
        //         0, 2, 3,
        //     ]);
        //     const bla_buffer = gl.createBuffer();
        //     assert(bla_buffer != null, "Couldn't create bla_buffer.");
        //     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bla_buffer);
        //     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bla, gl.STATIC_DRAW);
        //     // state.sprite_pass.indices = indices_buffer;
        // }

        // {
        //     const texture = gl.createTexture();
        //     assert(texture === null, "Couldn't create texture.");
        //     gl.bindTexture(gl.TEXTURE_2D, texture);
        //     gl.texImage2D(
        //         gl.TEXTURE_2D,
        //         0,
        //         gl.RGBA,
        //         1,
        //         1,
        //         0,
        //         gl.RGBA,
        //         gl.UNSIGNED_BYTE,
        //         new Uint8Array([0, 0, 255, 255]),
        //     );
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // }
    }

    render: {
        gl.clear(gl.COLOR_BUFFER_BIT);

        {
            gl.useProgram(state.sprite_pass.program);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, state.sprite_pass.indices as GLintptr);
        }
    }
}

function assert(condition: Boolean, message: string | null = ""): asserts condition {
    if (!condition) {
        if (message) {
            console.error("Assertion failed:");
            console.error(message);
        } else {
            console.error("Assertion failed!");
        }
        // debugger;
    }
}

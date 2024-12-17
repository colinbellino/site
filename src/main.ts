const vertex_shader_source = `
    #version 300 es
    layout (location=0) in vec4 position;
    layout (location=1) in vec3 color;
    out vec3 vColor;

    void main() {
        gl_Position = position;
        vColor = color;
    }
`;
const fragment_shader_source = `
    #version 300 es
    precision highp float;

    in vec3 vColor;
    out vec4 fragColor;

    void main() {
        fragColor = vec4(vColor, 1.0);
    }
`;

const COLOR_WHITE = [1, 1, 1, 1];

type State = {
    canvas?: HTMLCanvasElement;
    gl?:     WebGL2RenderingContext;
    program?: WebGLProgram;
};
const state: State = {};

function assert(condition: Boolean, message: string | null = ""): asserts condition {
    if (!condition) {
        if (message) {
            console.error("Assertion failed:");
            console.error(message);
        } else {
            console.error("Assertion failed!");
        }
        debugger;
    }
}

function main() {
    const elements = document.getElementsByTagName("canvas");
    state.canvas = elements[0] as HTMLCanvasElement;
    assert(state.canvas !== null, "Canvas not found");
    state.canvas.width = window.innerWidth;
    state.canvas.height = window.innerHeight;

    const gl = state.canvas.getContext("webgl2");
    assert(gl !== null, "Couldn't get WebGL2 context.");

    {
        gl.clearColor(0.25, 0.25, 0.25, 1);

        // Compile shaders
        const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
        assert(vertex_shader !== null, "Couldn't create vertex shader.");
        gl.shaderSource(vertex_shader, vertex_shader_source.trim());
        gl.compileShader(vertex_shader);
        const vertex_shader_status : GLboolean = gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS);
        assert(vertex_shader_status, gl.getShaderInfoLog(vertex_shader));

        const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
        assert(fragment_shader !== null, "Couldn't create fragment shader.");
        gl.shaderSource(fragment_shader, fragment_shader_source.trim());
        gl.compileShader(fragment_shader);
        const fragment_shader_status : GLboolean = gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS);
        assert(fragment_shader_status, gl.getShaderInfoLog(fragment_shader));

        // Link shaders to WebGL program
        const program = gl.createProgram();
        assert(program !== null, "Couldn't create program.");
        gl.attachShader(program, vertex_shader);
        gl.attachShader(program, fragment_shader);
        gl.linkProgram(program);
        const program_status : GLboolean = gl.getProgramParameter(program, gl.LINK_STATUS);
        assert(program_status, gl.getProgramInfoLog(program));

        gl.useProgram(program);
        state.program = program;

        // Setup Geometry
        // Create a Vertex Buffer Object (VBO) and bind two buffers to it
        // 1. positions
        const positions = new Float32Array([
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
            0.0, 0.5, 0.0,
        ]);
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        // 2. colours
        const colors = new Float32Array([
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0,
        ]);
        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);
    }

    {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}

main();

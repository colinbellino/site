const vsSource = `
    #version 300 es
    layout (location=0) in vec4 position;
    layout (location=1) in vec3 color;
    out vec3 vColor;

    void main() {
        gl_Position = position;
        vColor = color;
    }
`;
const fsSource = `
    #version 300 es
    precision highp float;

    in vec3 vColor;
    out vec4 fragColor;

    void main() {
        fragColor = vec4(vColor, 1.0);
    }
`;

function main() {
    const canvas = document.getElementById("draw-target") as HTMLCanvasElement | null;
    if (canvas === null) {
        console.error("getContext");
        return null;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gl = canvas.getContext("webgl2");
    if (gl === null) {
        console.error("getContext");
        return null;
    }

    {
        // Set background to solid grey
        gl.clearColor(0.25, 0.25, 0.25, 1);

        // Compile shaders
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if (vertexShader === null) {
            console.error("vertexShader");
            return;
        }
        gl.shaderSource(vertexShader, vsSource.trim());
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vertexShader));
        }

        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (fragmentShader === null) {
            console.error("fragmentShader");
            return;
        }
        gl.shaderSource(fragmentShader, fsSource.trim());
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(fragmentShader));
            return;
        }

        // Link shaders to WebGL program
        var program = gl.createProgram();
        if (program === null) {
            console.error("program");
            return;
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (gl.getProgramParameter(program, gl.LINK_STATUS) === null) {
            console.error(gl.getProgramInfoLog(program));
            return;
        }

        // Finally, activate WebGL program
        gl.useProgram(program);

        // Setup Geometry
        // Create a Vertex Buffer Object (VBO) and bind two buffers to it
        // 1. positions
        var positions = new Float32Array([
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
            0.0, 0.5, 0.0,
        ]);
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        // 2. colours
        var colors = new Float32Array([
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0,
        ]);
        var colorBuffer = gl.createBuffer();
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

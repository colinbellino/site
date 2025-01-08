import * as twgl from "./twgl.mjs";

const data = {
  canvas: null,
  context: null,
  program: null,
  vertex_buffer: null,
  program_info: null,
  buffer_info: null,
  attribute_a_position: null,
  tex: null,
};
export let gl;

const sprite_vertex_shader = `
  attribute vec4 position;

  uniform mat4 matrix;
  uniform mat4 textureMatrix;

  varying vec2 texcoord;

  void main () {
    gl_Position = matrix * position;

    texcoord = (textureMatrix * position).xy;
  }
`;
const sprite_fragment_shader = `
  precision mediump float;

  varying vec2 texcoord;
  uniform vec4 color;
  uniform sampler2D texture;

  void main() {
    if (texcoord.x < 0.0 || texcoord.x > 1.0 ||
        texcoord.y < 0.0 || texcoord.y > 1.0)
    {
      discard;
    }
    // gl_FragColor = texture2D(texture, texcoord);
    gl_FragColor = color;
  }
`;

function load_texture(src) {
  return new Promise((resolve, reject) => {
    twgl.createTexture(gl, { src }, function(err, tex, img) {
      // TODO: error handling
      return resolve(tex);
    });
  });
}

export async function renderer_init(canvas) {
  data.context = canvas.getContext("webgl2");
  gl = data.context;

  // data.tex = await load_texture("/public/me.png");

  if (data.context === null) {
    console.error("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  {
    // Compile shaders
    const vertex_shader = make_shader(sprite_vertex_shader, gl.VERTEX_SHADER);
    const fragment_shader = make_shader(sprite_fragment_shader, gl.FRAGMENT_SHADER);

    // Create program
    data.program = gl.createProgram();
    data.program_info = twgl.createProgramInfo(gl, [sprite_vertex_shader, sprite_fragment_shader])
    data.buffer_info = twgl.primitives.createXYQuadBufferInfo(gl);

    // Attach and link shaders to the program
    gl.attachShader(data.program, vertex_shader);
    gl.attachShader(data.program, fragment_shader);
    gl.linkProgram(data.program);
    if (gl.getProgramParameter(data.program, gl.LINK_STATUS) === false) {
        console.error("Unable to initialize the shader program");
        return false;
    }

    gl.useProgram(data.program);
  }

  return {
    clear: renderer_clear,
    draw_rect: renderer_draw_rect,
    draw_trail : renderer_draw_trail,
  };
}

export function renderer_quit() {
  data.context = null;
}

export function renderer_clear(color) {
  gl.clearColor(color.r, color.g, color.b, color.a);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

// FIXME: handle canvas resize properly
// TODO: update to snake_case
export function renderer_draw_rect(rect, color) {
  var mat  = twgl.m4.identity();
  var tmat = twgl.m4.identity();

  var uniforms = {
    matrix: mat,
    textureMatrix: tmat,
    texture: data.tex,
    color: [color.r, color.g, color.b, color.a],
  };

  // these adjust the unit quad to generate texture coordinates
  // to select part of the src texture
  const texWidth = 16;
  const texHeight = 16;
  const srcX = 0;
  const srcY = 0;
  const srcWidth = 16;
  const srcHeight = 16;

  twgl.m4.translate(tmat, [srcX / texWidth, srcY / texHeight, 0], tmat);
  twgl.m4.scale(tmat, [srcWidth / texWidth, srcHeight / texHeight, 1], tmat);

  // these convert from pixels to clip space
  const targetWidth = gl.canvas.width;
  const targetHeight = gl.canvas.height;
  twgl.m4.ortho(0, targetWidth, targetHeight, 0, -1, 1, mat)

  // these move and scale the unit quad into the size we want in the target as pixels
  const dstX = rect.x;
  const dstY = rect.y;
  const dstWidth = rect.width;
  const dstHeight = rect.height;
  twgl.m4.translate(mat, [dstX, dstY, 0], mat);
  twgl.m4.scale(mat, [dstWidth, dstHeight, 1], mat);

  gl.useProgram(data.program_info.program);
  twgl.setBuffersAndAttributes(gl, data.program_info, data.buffer_info);
  twgl.setUniforms(data.program_info, uniforms);
  twgl.drawBufferInfo(gl, data.buffer_info);
}

export function renderer_draw_trail({ x, y }, size, color) {
  renderer_draw_rect({ x, y, width: size, height: size }, color);
}

function make_shader(src, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert("Error compiling shader: " + gl.getShaderInfoLog(shader));
      return;
  }
  return shader;
}

function m4_orthographic(left, right, bottom, top, near, far) {
  return [
    2 / (right - left), 0, 0, 0,
    0, 2 / (top - bottom), 0, 0,
    0, 0, 2 / (near - far), 0,

    (left + right) / (left - right),
    (bottom + top) / (bottom - top),
    (near + far) / (near - far),
    1,
  ];
}

function m4_translate(m, tx, ty, tz) {
  return twgl.m4.multiply(m, twgl.m4.translation(tx, ty, tz));
}

function m4_xRotate(m, angleInRadians) {
  return twgl.m4.multiply(m, twgl.m4.xRotation(angleInRadians));
}

function m4_yRotate(m, angleInRadians) {
  return twgl.m4.multiply(m, twgl.m4.yRotation(angleInRadians));
}

function m4_zRotate(m, angleInRadians) {
  return twgl.m4.multiply(m, twgl.m4.zRotation(angleInRadians));
}

function m4_scale(m, sx, sy, sz) {
  return twgl.m4.multiply(m, twgl.m4.scaling(sx, sy, sz));
}

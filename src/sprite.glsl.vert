#version 300 es
precision highp float;
precision highp int;

layout(location=0) in vec2 position;
layout(location=1) in vec2 uv;
layout(location=2) in vec4 i_color;
layout(location=3) in vec4 i_matrix0;
layout(location=4) in vec4 i_matrix1;
layout(location=5) in vec4 i_matrix2;
layout(location=6) in vec4 i_matrix3;
layout(location=7) in vec2 i_tex_position;
layout(location=8) in vec2 i_tex_size;

uniform mat4 u_matrix;

out vec4 v_color;
out vec2 v_uv;

vec2 uv_fat_pixel( vec2 uv, ivec2 texture_size, float texels_per_pixel) {
    vec2 pixel = uv * vec2(texture_size);

    vec2 fat_pixel = floor(pixel) + 0.5;
    // subpixel aa algorithm (COMMENT OUT TO COMPARE WITH POINT SAMPLING)
    fat_pixel += 1.0 - clamp((1.0 - fract(pixel)) * texels_per_pixel, 0.0, 1.0);

    return fat_pixel / vec2(texture_size);
}

void main() {
    v_color = i_color;
    v_uv = i_tex_size*uv + i_tex_position;
    mat4 i_matrix = mat4(i_matrix0, i_matrix1, i_matrix2, i_matrix3);
    gl_Position = u_matrix * i_matrix * vec4(position, 0, 1);
}

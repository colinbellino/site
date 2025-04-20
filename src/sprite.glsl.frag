 #version 300 es
precision highp float;

uniform sampler2D u_texture;
in vec4 v_color;
in vec2 v_uv;
out vec4 frag_color;

void main() {
    frag_color = texture(u_texture, v_uv) * v_color;
}

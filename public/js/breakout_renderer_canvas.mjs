const renderer = {
  canvas: null,
  context: null,
};

export async function renderer_init(canvas) {
  renderer.canvas = canvas;
  renderer.context = canvas.getContext("2d");

  return {
    clear: renderer_clear,
    draw_rect: renderer_draw_rect,
    draw_trail : renderer_draw_trail,
  };
}

export function renderer_quit() {
  renderer.context = null;
}

export function renderer_clear(color) {
  renderer.context.clearRect(0, 0, renderer.canvas.width, renderer.canvas.height);
}

export function renderer_draw_rect({ x, y, width, height }, color) {
  renderer.context.fillStyle = color_to_rgba_string(color);
  renderer.context.fillRect(x, y, width, height);
}

export function renderer_draw_trail({ x, y }, size, color) {
  renderer.context.beginPath();
  renderer.context.fillStyle = color_to_rgba_string(color);
  renderer.context.moveTo(x, y);
  renderer.context.fillRect(x, y, size, size);
}

function color_to_rgba_string(color) {
  return `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`;
}

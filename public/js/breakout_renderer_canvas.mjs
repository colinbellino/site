const renderer = {
  canvas: null,
  context: null,
};

export function renderer_init(canvas) {
  renderer.context = canvas.getContext("2d");

  return {
    clear_rect: renderer_clear_rect,
    draw_rect: renderer_draw_rect,
    draw_trail : renderer_draw_trail,
  };
}
export function renderer_quit() {
  renderer.context = null;
}

export function renderer_clear_rect({ x, y, width, height }) {
  renderer.context.clearRect(x, y, width, height);
}

export function renderer_draw_rect({ x, y, width, height }, color) {
  renderer.context.fillStyle = color;
  renderer.context.fillRect(x, y, width, height);
}

export function renderer_draw_trail({ x, y }, size, color) {
  renderer.context.beginPath();
  renderer.context.fillStyle = color;
  renderer.context.moveTo(x, y);
  renderer.context.fillRect(x, y, size, size);
}

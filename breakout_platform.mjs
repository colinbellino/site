import {
  KEY_MOVE_LEFT,
  KEY_MOVE_RIGHT,
  KEY_CONFIRM,
  KEY_CANCEL,
  KEY_PAUSE,
  game_update,
  game_keydown,
  game_keyup,
  game_resize,
} from "./breakout_game.mjs"

const renderer = {
  canvas: null,
  context: null,
};

const platformKeys = {
  37: KEY_MOVE_LEFT,
  39: KEY_MOVE_RIGHT,
  32: KEY_CONFIRM,
  27: KEY_CANCEL,
  80: KEY_PAUSE,
};

let blocks = [];

function platform_keydown(e) {
  const key = platformKeys[e.keyCode];
  if (key === undefined) {
    // console.log("e.keyCode", e.keyCode);
    return;
  }
  game_keydown(key);
}

function platform_keyup(e) {
  const key = platformKeys[e.keyCode];
  if (key === undefined) {
    // console.log("e.keyCode", e.keyCode);
    return;
  }
  game_keyup(key);
}

function platform_resize() {
  console.log("platform_resize", window.innerWidth, window.innerHeight);
  renderer.canvas.width = window.innerWidth;
  renderer.canvas.height = window.innerHeight;
  game_resize(renderer.canvas.width, renderer.canvas.height);
}

function platform_update(currentTime) {
  game_update(currentTime);
  window.requestAnimationFrame(platform_update);
}

export function platform_log(...args) {
  console.log(args);
}

export function platform_error(...args) {
  console.log(args);
}

export function platform_clear_rect({ x, y, width, height }) {
  renderer.context.clearRect(x, y, width, height);
}

export function platform_render_rect({ x, y, width, height }, color) {
  renderer.context.fillStyle = color;
  renderer.context.fillRect(x, y, width, height);
}

export function platform_render_text(x, y, text, size, color) {
  renderer.context.font = `${size}px sans-serif`;
  renderer.context.fillStyle = color;
  renderer.context.fillText(text, x, y + size);
}

export function platform_destroy_block(blockIndex) {
  const block = blocks[blockIndex];
  block.classList.add("breakout-destroyed");
}

export function platform_get_blocks() {
  return blocks;
}

// TODO: Update blocks position on resize ?
export function platform_init() {
  renderer.canvas = document.createElement("canvas");
  renderer.canvas.style = "position: absolute; inset: 0; display: block; width: 100%; height: 100%; pointer-events: none;";
  renderer.context = renderer.canvas.getContext("2d");
  document.body.appendChild(renderer.canvas);

  blocks = Array.from(document.querySelectorAll(".avatar, section > *:not(ul), li > a"));
  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const block = blocks[blockIndex];
    block.classList.add("breakout-block");
  }

  window.requestAnimationFrame(platform_update);
  document.addEventListener("keydown", platform_keydown);
  document.addEventListener("keyup", platform_keyup);
  window.addEventListener("resize", platform_resize);

  platform_resize();
  platform_update();
}

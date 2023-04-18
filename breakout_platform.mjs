import {
  KEY_MOVE_LEFT,
  KEY_MOVE_RIGHT,
  KEY_CONFIRM,
  KEY_CANCEL,
  KEY_PAUSE,
  KEY_DEBUG_1,
  KEY_DEBUG_2,
  KEY_DEBUG_3,
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
  // 27: KEY_CANCEL,
  27: KEY_PAUSE,
  112: KEY_DEBUG_1,
  113: KEY_DEBUG_2,
  114: KEY_DEBUG_3,
};

let blocks = [];
let help = null;

function keydown(e) {
  const key = platformKeys[e.keyCode];
  if (key === undefined) {
    // console.log("e.keyCode", e.keyCode);
    return;
  }
  game_keydown(key);
}

function keyup(e) {
  const key = platformKeys[e.keyCode];
  if (key === undefined) {
    // console.log("e.keyCode", e.keyCode);
    return;
  }
  game_keyup(key);
}

// FIXME: Update blocks position on resize
function resize() {
  // console.log("resize", window.innerWidth, window.innerHeight);
  renderer.canvas.width = window.innerWidth;
  renderer.canvas.height = window.innerHeight;
  game_resize(renderer.canvas.width, renderer.canvas.height);
}

function split_in_blocks(selector) {
  document.querySelectorAll(selector).forEach((root) => {
    root.childNodes.forEach((node) => {
      if (node.tagName !== undefined)
        return;

      const replacement = document.createElement("span");
      const words = node.textContent.split(" ");
      let i = 0;
      words.forEach((word) => {
        if (word === "")
          return;

        const span = document.createElement("span");
        span.classList.add("breakout-preblock");
        if (i % 2 !== 0)
          span.classList.add("odd");
        span.innerHTML = word;
        replacement.appendChild(span);
        const space = document.createElement("span");
        space.innerHTML = " ";
        replacement.appendChild(space);

        i += 1;
      });
      node.innerHTML = replacement.innerHTML;
      root.replaceChild(replacement, node);
    });
  });
}

export function platform_log(...args) {
  console.log(...args);
}

export function platform_error(...args) {
  console.error(...args);
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
  block.classList.add("destroyed");
}

export function platform_get_blocks() {
  return blocks;
}

export function platform_show_help() {
  help.classList.remove("hidden");

  const block = help.firstChild;
  block.classList.add("breakout-block");
  blocks.push(block);
}

export function platform_hide_help() {
  help.classList.add("hidden");
}

export function platform_start() {
  renderer.canvas = document.createElement("canvas");
  renderer.canvas.classList.add("breakout-canvas");
  renderer.context = renderer.canvas.getContext("2d");
  document.body.appendChild(renderer.canvas);

  if (help === null)
  {
    help = document.createElement("aside");
    help.classList.add("breakout-help");
    help.classList.add("hidden");
    help.innerHTML = `<p>Use <b>${"LEFT"}</b> and <b>${"RIGHT"}</b> arrows to move your paddle.<br>Press <b>${"SPACE"}</b> to shoot a ball.</p>`;
    document.body.appendChild(help);
  }

  {
    split_in_blocks("section > h1");
    split_in_blocks("section > h2");
    split_in_blocks("section > p");
    const selectors = [
      ".avatar",
      ".hire-me",
      "li > a",
      ".breakout-preblock",
    ];
    blocks = Array.from(document.querySelectorAll(selectors.join(", ")));
    if (blocks.length === 0) {
      platform_error("No valid blocks were found on the page, refusing to start the game like this.");
      return;
    }

    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
      const block = blocks[blockIndex];
      block.classList.add("breakout-block");
    }
  }

  document.addEventListener("keydown", keydown);
  document.addEventListener("keyup", keyup);
  window.addEventListener("resize", resize);

  document.body.classList.add("no-animation");
  resize();

  return new Promise((resolve, reject) => {
    window.requestAnimationFrame(function update(currentTime) {
      const result = game_update(currentTime / 1000);
      if (result > 0) {
        // Clean up
        help.remove();
        document.body.classList.remove("no-animation");
        return resolve(result);
      }
      window.requestAnimationFrame(update);
    });
  });
}

export function platform_stop() {
  blocks.forEach((block) => {
    block.classList.remove("breakout-block");
    block.classList.remove("destroyed");
  });
  renderer.canvas.remove();
}

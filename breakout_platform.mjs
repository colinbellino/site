import { clamp } from "./math.mjs";
import {
  KEY_MOUSE_LEFT,
  KEY_MOUSE_RIGHT,
  KEY_MOVE_LEFT,
  KEY_MOVE_RIGHT,
  KEY_CONFIRM,
  KEY_CANCEL,
  KEY_PAUSE,
  KEY_DEBUG_1,
  KEY_DEBUG_2,
  KEY_DEBUG_3,
  AUDIO_CLIPS,
  game_update,
  game_keydown,
  game_keyup,
  game_mousemove,
  game_resize,
} from "./breakout_game.mjs"
const VOLUME_SFX_INITIAL = 0.2;
const VOLUME_MUSIC_INITIAL = 0.2;
const VOLUME_MUSIC_PAUSED = 0.01;

const codeToKey = {
  37: KEY_MOVE_LEFT, // Left arrow
  39: KEY_MOVE_RIGHT, // Right arrow
  32: KEY_CONFIRM, // Space
  // 27: KEY_CANCEL,
  27: KEY_PAUSE, // Escape
  112: KEY_DEBUG_1, // F1
  84: KEY_DEBUG_1, // F1
  113: KEY_DEBUG_2, // F2
  114: KEY_DEBUG_3, // F3
};

const data = {
  renderer: {
    canvas: null,
    context: null,
  },
  audio: {
    available: false,
    context: null,
    gainMusic: null,
    gainSfx: null,
    clips: [],
    sources: [],
  },
  blocks: [],
  ui: {
    help: null,
    score: null,
    pause: null,
  },
  settings: {
    volumeSfx: 0,
    volumeMusic: 0,
  },
};

export function platform_log(...args) {
  console.log(...args);
}

export function platform_warn(...args) {
  console.warn(...args);
}

export function platform_error(...args) {
  console.error(...args);
}

export function platform_clear_rect({ x, y, width, height }) {
  data.renderer.context.clearRect(x, y, width, height);
}

export function platform_draw_rect({ x, y, width, height }, color) {
  data.renderer.context.fillStyle = color;
  data.renderer.context.fillRect(x, y, width, height);
}

export function platform_draw_trail({ x, y }, size, color) {
  data.renderer.context.beginPath();
  data.renderer.context.fillStyle = color;
  data.renderer.context.moveTo(x, y);
  data.renderer.context.fillRect(x, y, size, size);

}

export function platform_destroy_block(blockIndex) {
  const block = data.blocks[blockIndex];
  block.classList.add("destroyed");
}

export function platform_get_blocks() {
  return data.blocks;
}

export function platform_show_help() {
  data.ui.help.classList.remove("hidden");

  const block = data.ui.help.firstChild;
  block.classList.add("breakout-block");
  data.blocks.push(block);
}

export function platform_hide_help() {
  data.ui.help.classList.add("hidden");
}

export function platform_show_score(score, multiplier) {
  data.ui.score.classList.remove("hidden");
  data.ui.score.innerHTML = `Score: ${score} (x${multiplier.toFixed(1)})`;
}

export function platform_hide_score() {
  data.ui.score.classList.add("hidden");
}

export function platform_show_pause() {
  data.renderer.canvas.classList.add("blocking")
  data.ui.pause.classList.remove("hidden");
  data.audio.gainMusic.gain.value = VOLUME_MUSIC_PAUSED;
}

export function platform_hide_pause() {
  data.renderer.canvas.classList.remove("blocking")
  data.ui.pause.classList.add("hidden");
  data.audio.gainMusic.gain.value = data.settings.volumeSfx;
}

export function platform_play_audio_clip(key, group = 0, loop = false) {
  if (data.audio.available === false)
    return;

  const index = AUDIO_CLIPS.indexOf(key);
  const clip = data.audio.clips[index];
  const source = data.audio.context.createBufferSource();
  source.buffer = clip.buffer;
  source.loop = loop;
  if (group === 0)
    source.connect(data.audio.gainSfx);
  else
    source.connect(data.audio.gainMusic);
  source.start();
  data.audio.sources[index] = source;
}

export function platform_stop_audio_clip(key, group = 0, fadeDuration = 0) {
  if (data.audio.available === false)
    return;

  const index = AUDIO_CLIPS.indexOf(key);
  if (fadeDuration === 0) {
    data.audio.sources[index].stop();
    return;
  }

  const tempGain = data.audio.context.createGain();
  data.audio.sources[index].disconnect();
  data.audio.sources[index].connect(tempGain).connect(data.audio.context.destination);
  if (group === 0)
    tempGain.gain.value = data.audio.gainSfx.gain.value;
  else
    tempGain.gain.value = data.audio.gainMusic.gain.value;
  tempGain.gain.linearRampToValueAtTime(0, data.audio.context.currentTime + fadeDuration);
}

export async function platform_start() {
  data.renderer.canvas = document.createElement("canvas");
  data.renderer.canvas.classList.add("breakout-canvas");
  data.renderer.context = data.renderer.canvas.getContext("2d");
  document.body.appendChild(data.renderer.canvas);

  data.settings.volumeSfx = VOLUME_SFX_INITIAL;
  data.settings.volumeMusic = VOLUME_MUSIC_INITIAL;

  if (data.ui.help === null)
  {
    data.ui.help = document.createElement("aside");
    data.ui.help.classList.add("breakout-help");
    data.ui.help.classList.add("hidden");
    data.ui.help.innerHTML = `<p>Use <b>${"LEFT"}</b> and <b>${"RIGHT"}</b> arrows to move your paddle.<br>Press <b>${"SPACE"}</b> to shoot a ball.</p>`;
    document.body.appendChild(data.ui.help);
  }

  if (data.ui.score === null)
  {
    data.ui.score = document.createElement("aside");
    data.ui.score.classList.add("breakout-score");
    data.ui.score.classList.add("hidden");
    data.ui.score.innerHTML = 0;
    document.body.appendChild(data.ui.score);
  }

  if (data.ui.pause === null)
  {
    data.ui.pause = document.createElement("section");
    data.ui.pause.classList.add("breakout-pause");
    data.ui.pause.classList.add("hidden");
    data.ui.pause.innerHTML = "<p>PAUSED</p>";
    document.body.appendChild(data.ui.pause);
  }

  {
    split_in_blocks("h1 a");
    split_in_blocks("h2");
    split_in_blocks("main > nav > p > b");
    split_in_blocks("main > section > p");
    split_in_blocks("main > footer > p");
    const selectors = [
      ".breakout-preblock",
      ".avatar img",
      ".hire-me",
      "li > a",
    ];
    data.blocks = Array.from(document.querySelectorAll(selectors.join(", ")));
    if (data.blocks.length === 0) {
      platform_error("No valid blocks were found on the page, refusing to start the game like this.");
      return;
    }

    for (let blockIndex = 0; blockIndex < data.blocks.length; blockIndex++) {
      const block = data.blocks[blockIndex];
      block.classList.add("breakout-block");
    }
  }

  const canPlayAudio = window.AudioContext !== undefined;
  if (canPlayAudio) {
    data.audio.available = true;
    data.audio.context = new AudioContext();
    data.audio.gainMusic = data.audio.context.createGain();
    data.audio.gainMusic.connect(data.audio.context.destination);
    data.audio.gainMusic.gain.value = VOLUME_MUSIC_INITIAL;
    data.audio.gainSfx = data.audio.context.createGain();
    data.audio.gainSfx.connect(data.audio.context.destination);
    data.audio.gainSfx.gain.value = VOLUME_SFX_INITIAL;

    // Debug stuff
    if (window.location.search.includes("no_music"))
      data.audio.gainMusic.gain.value = 0;
    if (window.location.search.includes("no_sfx"))
      data.audio.gainSfx.gain.value = 0;

    // Load audio clips
    data.audio.clips = AUDIO_CLIPS.map(key => ({
      url: `/public/audio/${key}.mp3`,
      buffer: null,
    }));
    const loadPromises = data.audio.clips.map((clip) => load_audio(clip.url));
    const buffers = await Promise.all(loadPromises);
    for (let clipIndex = 0; clipIndex < buffers.length; clipIndex++)
      data.audio.clips[clipIndex].buffer = buffers[clipIndex];
      platform_log("Audio clips loaded:", data.audio.clips.length);
  } else {
    data.audio.available = false;
    platform_warn("Web Audio API not available, continuing without audio.");
  }

  document.addEventListener("mouseup", mouseup);
  document.addEventListener("mousedown", mousedown);
  document.addEventListener("mousemove", mousemove);
  document.addEventListener("keydown", keydown);
  document.addEventListener("keyup", keyup);
  window.addEventListener("resize", resize);

  resize();

  return new Promise((resolve, reject) => {
    const fps = 120;
    const then = window.performance.now();
    const startTime = then;
    let now = 0;
    let elapsed = 0;

    update(window.performance.now());

    function update(newTime) {
      now = newTime;
      elapsed = now - then;

      const [result, score] = game_update(elapsed / 1000);
      if (result > 0) {
        clean_up();
        return resolve([result, score]);
      }

      requestAnimationFrame(update);
    }
  });
}

export function platform_stop() {
  platform_warn("platform_stop not implemented");
  // TODO: actually stop the game
  // clean_up();
}

function clean_up() {
  data.blocks.forEach((block) => {
    block.classList.remove("breakout-block");
    block.classList.remove("destroyed");
  });
  data.blocks = [];
  data.renderer.canvas.remove();
  data.renderer.canvas = null;
  data.renderer.context = null;
  data.audio.context.close();
  data.audio.context = null;
  data.audio.gainMusic = null;
  data.audio.gainSfx = null;
  data.audio.clips = [];
  data.audio.sources = [];
  data.ui.help.remove();
  data.ui.help = null;
  data.ui.score.remove();
  data.ui.score = null;
  data.ui.pause.remove();
  data.ui.pause = null;

  document.removeEventListener("mouseup", mouseup);
  document.removeEventListener("mousedown", mousedown);
  document.removeEventListener("mousemove", mousemove);
  document.removeEventListener("keydown", keydown);
  document.removeEventListener("keyup", keyup);
  window.removeEventListener("resize", resize);
}

function mousedown(e) {
  if (e.which === 1)
    return game_keydown(KEY_MOUSE_LEFT);
  if (e.which === 3)
    return game_keydown(KEY_MOUSE_RIGHT);
  // console.log(e.which);
}

function mouseup(e) {
  if (e.which === 1)
    return game_keyup(KEY_MOUSE_LEFT);
  if (e.which === 3)
    return game_keyup(KEY_MOUSE_RIGHT);
  // console.log(e.which);
}

function mousemove(e) {
  game_mousemove(e.clientX, e.clientY);
}

function keydown(e) {
  const key = codeToKey[e.keyCode];
  if (key === undefined) {
    // console.log("e.keyCode", e.keyCode);
    return;
  }
  game_keydown(key);
}

function keyup(e) {
  const key = codeToKey[e.keyCode];
  if (key === undefined) {
    // console.log("e.keyCode", e.keyCode);
    return;
  }
  game_keyup(key);
}

function set_sfx_volume(volume) {
  data.audio.gainSfx.gain.value = clamp(volume, 0, 1);
  platform_log("SFX volume:", data.audio.gainSfx.gain.value);
}

function resize() {
  platform_log("Window resized:", window.innerWidth, window.innerHeight);
  data.renderer.canvas.width = window.innerWidth;
  data.renderer.canvas.height = window.innerHeight;
  game_resize(data.renderer.canvas.width, data.renderer.canvas.height);
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

function load_audio(url) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", url);
    request.responseType = "arraybuffer";
    request.onload = function () {
      const undecodedAudio = request.response;
      data.audio.context.decodeAudioData(undecodedAudio, resolve);
    };
    request.onerror = reject;
    request.send();
  });
}

function wait_for_milliseconds(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

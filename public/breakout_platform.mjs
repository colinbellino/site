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
  game_quit,
} from "./breakout_game.mjs"

const VOLUME_SFX_MULTIPLIER = 0.2;
const VOLUME_MUSIC_MULTIPLIER = 0.2;
const VOLUME_MUSIC_PAUSED_MULTIPLIER = 0.05;

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
    requestId: 0,
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
    lives: null,
    musicSlider: null,
    sfxSlider: null,
  },
  settings: {
    volumeSfx: 0,
    volumeMusic: 0,
  },
  debug: {
    noMusic: false,
    noSfx: false,
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

export async function platform_show_score(score, multiplier) {
  data.ui.score.classList.remove("hidden");
  if (multiplier > 3)
    data.ui.score.classList.add("bounce-2");
  else if (multiplier > 5)
    data.ui.score.classList.add("bounce-3");
  else
    data.ui.score.classList.add("bounce-1");
  data.ui.score.innerHTML = `Score: ${score} (x${multiplier.toFixed(1)})`;

  await wait_for_milliseconds(300);
  data.ui.score.classList.remove("bounce-1", "bounce-2", "bounce-3");
}

export function platform_hide_score() {
  data.ui.score.classList.add("hidden");
}

export function platform_show_pause() {
  data.renderer.canvas.classList.add("blocking")
  data.ui.pause.classList.remove("hidden");
  data.ui.musicSlider.setAttribute("value", data.settings.volumeMusic);
  data.ui.sfxSlider.setAttribute("value", data.settings.volumeSfx);
  data.paused = true;
  set_volume_music(data.settings.volumeMusic);
}

export function platform_hide_pause() {
  data.paused = false;
  data.renderer.canvas.classList.remove("blocking");
  data.ui.pause.classList.add("hidden");
  set_volume_music(data.settings.volumeMusic);
}

export async function platform_show_lives(lives) {
  data.ui.lives.classList.remove("hidden");
  data.ui.lives.classList.add("bounce-3");
  data.ui.lives.innerHTML = `Lives: ${lives + 1}`;

  await wait_for_milliseconds(300);
  data.ui.lives.classList.remove("bounce-3");
}

export function platform_hide_lives() {
  data.ui.lives.classList.add("hidden");
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
    tempGain.gain.value = data.audio.gainSfx.gain.value * VOLUME_SFX_MULTIPLIER;
  else
    tempGain.gain.value = data.audio.gainMusic.gain.value * VOLUME_MUSIC_MULTIPLIER;
  tempGain.gain.linearRampToValueAtTime(0, data.audio.context.currentTime + fadeDuration)
}

export async function platform_start() {
  data.renderer.canvas = document.createElement("canvas");
  data.renderer.canvas.classList.add("breakout-canvas");
  data.renderer.context = data.renderer.canvas.getContext("2d");
  document.body.appendChild(data.renderer.canvas);

  data.settings.volumeSfx = 1;
  data.settings.volumeMusic = 1;

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

    const root = document.createElement("div");
    data.ui.pause.appendChild(root);

    const title = document.createElement("h3");
    title.innerHTML = "PAUSED";
    root.appendChild(title);

    {
      const slider = document.createElement("input");
      slider.setAttribute("name", "volumeMusic");
      slider.setAttribute("type", "range");
      slider.setAttribute("min", 0);
      slider.setAttribute("max", 1);
      slider.setAttribute("step", 0.1);
      slider.addEventListener("change", (e) => {
        const rawValue = parseFloat(e.target.value);
        const volume = rawValue * VOLUME_MUSIC_MULTIPLIER;
        data.settings.volumeMusic = volume;
        set_volume_music(volume);
      });
      data.ui.musicSlider = slider;

      const label = document.createElement("label");
      label.innerHTML = "Music volume:";
      label.setAttribute("for", "volumeMusic");

      const parent = document.createElement("div");
      parent.classList.add("slider");
      parent.appendChild(label);
      parent.appendChild(slider);

      root.appendChild(parent);
    }

    {
      const slider = document.createElement("input");
      slider.setAttribute("name", "volumeSfx");
      slider.setAttribute("type", "range");
      slider.setAttribute("min", 0);
      slider.setAttribute("max", 1);
      slider.setAttribute("step", 0.1);
      slider.addEventListener("change", (e) => {
        const rawValue = parseFloat(e.target.value);
        const volume = rawValue * VOLUME_SFX_MULTIPLIER;
        data.settings.volumeSfx = volume;
        set_volume_sfx(volume);
      });
      data.ui.sfxSlider = slider;

      const label = document.createElement("label");
      label.innerHTML = "Sounds volume:";
      label.setAttribute("for", "volumeSfx");

      const parent = document.createElement("div");
      parent.classList.add("slider");
      parent.appendChild(label);
      parent.appendChild(slider);

      root.appendChild(parent);
    }

    if (data.ui.lives === null)
    {
      data.ui.lives = document.createElement("aside");
      data.ui.lives.classList.add("breakout-lives");
      data.ui.lives.classList.add("hidden");
      data.ui.lives.innerHTML = 0;
      document.body.appendChild(data.ui.lives);
    }

    const quitButton = document.createElement("button");
    quitButton.innerHTML = "Quit";
    quitButton.classList.add("link");
    quitButton.addEventListener("click", platform_stop);
    root.appendChild(quitButton);

    document.body.appendChild(data.ui.pause);
  }

  if (data.blocks.length === 0) {
    if (window.prepare_page_for_breakout !== undefined)
      window.prepare_page_for_breakout();

    const toSplit = document.querySelectorAll(".breakout-to-split");
    split_in_blocks(document.querySelectorAll(".breakout-to-split"));
    const nodes = document.querySelectorAll(".breakout-preblock");
    document.querySelectorAll(".breakout-to-hide").forEach((element) => {
      element.classList.add("breakout-hidden");
    });

    data.blocks = Array.from(nodes);
  }

  {
    if (data.blocks.length === 0) {
      return Promise.reject(new Error("No valid blocks were found on the page, refusing to start the game like this."));
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
    set_volume_music(data.settings.volumeMusic);
    data.audio.gainSfx = data.audio.context.createGain();
    data.audio.gainSfx.connect(data.audio.context.destination);
    set_volume_sfx(data.settings.volumeSfx);

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

  // Debug stuff
  {
    data.debug.noMusic = window.location.search.includes("no_music");
    if (data.debug.noMusic)
      data.audio.gainMusic.gain.value = 0;

    data.debug.noSfx = window.location.search.includes("no_sfx");
    if (data.debug.noSfx)
      data.audio.gainSfx.gain.value = 0;
  }

  resize();

  document.body.classList.add("game-running");

  document.addEventListener("mouseup", mouseup);
  document.addEventListener("mousedown", mousedown);
  document.addEventListener("mousemove", mousemove);
  document.addEventListener("keydown", keydown);
  document.addEventListener("keyup", keyup);
  window.addEventListener("resize", resize);

  console.log("Starting game with blocks:", data.blocks.length);

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

      data.renderer.requestId = window.requestAnimationFrame(update);
    }
  });
}

export function platform_stop() {
  platform_log("Stopping the game");
  game_quit();
}

function clean_up() {
  document.querySelectorAll(".breakout-hidden").forEach((element) => {
    element.classList.remove("breakout-hidden");
  });
  data.blocks.forEach((element) => {
    element.classList.remove("breakout-block");
    element.classList.remove("destroyed");
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
  data.ui.lives.remove();
  data.ui.lives = null;
  data.ui.musicSlider = null;
  data.ui.sfxSlider = null;

  document.body.classList.remove("game-running");

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
  // platform_log(e.which);
}

function mouseup(e) {
  if (e.which === 1)
    return game_keyup(KEY_MOUSE_LEFT);
  if (e.which === 3)
    return game_keyup(KEY_MOUSE_RIGHT);
  // platform_log(e.which);
}

function mousemove(e) {
  game_mousemove(e.clientX, e.clientY);
}

function keydown(e) {
  const key = codeToKey[e.keyCode];
  if (key === undefined) {
    // platform_log("e.keyCode", e.keyCode);
    return;
  }
  game_keydown(key);
}

function keyup(e) {
  const key = codeToKey[e.keyCode];
  if (key === undefined) {
    // platform_log("e.keyCode", e.keyCode);
    return;
  }
  game_keyup(key);
}

function resize() {
  platform_log("Window resized:", window.innerWidth, window.innerHeight);
  data.renderer.canvas.width = window.innerWidth;
  data.renderer.canvas.height = window.innerHeight;
  game_resize(data.renderer.canvas.width, data.renderer.canvas.height);
}

function split_in_blocks(nodes) {
  nodes.forEach((root) => {
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

function set_volume_music(value) {
  if (data.debug.noMusic)
    return;

  if (data.paused)
    value *= VOLUME_MUSIC_PAUSED_MULTIPLIER;

  value *= VOLUME_MUSIC_MULTIPLIER;

  data.audio.gainMusic.gain.value = value;
  platform_log("Music volume:", data.audio.gainMusic.gain.value);
}

function set_volume_sfx(value) {
  if (data.debug.noSfx)
    return;

  value *= VOLUME_SFX_MULTIPLIER;

  data.audio.gainSfx.gain.value = value;
  platform_log("SFX volume:", data.audio.gainSfx.gain.value);
}

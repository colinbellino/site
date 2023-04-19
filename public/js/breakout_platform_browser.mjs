const VOLUME_SFX_MULTIPLIER = 0.2;
const VOLUME_MUSIC_MULTIPLIER = 0.2;
const VOLUME_MUSIC_PAUSED_MULTIPLIER = 0.05;

const mouseCodes = {
  LEFT: 1,
  RIGHT: 3,
}
const keyCodes = {
  ARROW_LEFT: 37,
  ARROW_RIGHT: 39,
  SPACE: 32,
  ESCAPE: 27,
  F1: 112,
  F2: 113,
};

const data = {
  animationFrameId: 0,
  canvas: null,
  audio: {
    available: false,
    context: null,
    gainMusic: null,
    gainSfx: null,
    clips: {},
    sources: {},
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
    volumeSfx: 1,
    volumeMusic: 0,
  },
  debug: {
    noMusic: false,
    noSfx: false,
  },

  state: {
    quit: false,
    mouse: {
      x: 0,
      y: 0,
      changed: false,
    },
    /*
    [key]: {
      down: false,
      released: false,
    }
    */
    mouse_keys: {},
    keys: {},
    window: {
      width: 800,
      height: 600,
      resized: false,
    },
  }
};

function platform_log(...args) {
  console.log(...args);
}

function platform_warn(...args) {
  console.warn(...args);
}

function platform_error(...args) {
  console.error(...args);
}

function platform_destroy_block(blockIndex) {
  const block = data.blocks[blockIndex];
  block.classList.add("destroyed");
}

function platform_get_blocks() {
  return data.blocks;
}

function platform_show_help() {
  data.ui.help.classList.remove("hidden");

  const block = data.ui.help.firstChild;
  block.classList.add("breakout-block");
  data.blocks.push(block);
}

function platform_hide_help() {
  data.ui.help.classList.add("hidden");
}

async function platform_show_score(score, multiplier) {
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

function platform_hide_score() {
  data.ui.score.classList.add("hidden");
}

function platform_show_pause() {
  data.canvas.classList.add("blocking")
  data.ui.pause.classList.remove("hidden");
  data.ui.musicSlider.setAttribute("value", data.settings.volumeMusic);
  data.ui.sfxSlider.setAttribute("value", data.settings.volumeSfx);
  data.paused = true;
  set_volume_music(data.settings.volumeMusic);
}

function platform_hide_pause() {
  data.paused = false;
  data.canvas.classList.remove("blocking");
  data.ui.pause.classList.add("hidden");
  set_volume_music(data.settings.volumeMusic);
  set_volume_sfx(data.settings.volumeSfx);
}

async function platform_show_lives(lives) {
  data.ui.lives.classList.remove("hidden");
  data.ui.lives.classList.add("bounce-3");
  data.ui.lives.innerHTML = `Lives: ${lives + 1}`;

  await wait_for_milliseconds(300);
  data.ui.lives.classList.remove("bounce-3");
}

function platform_hide_lives() {
  data.ui.lives.classList.add("hidden");
}

async function platform_load_audio_clip(key) {
  const clip = {
    key,
    url: `/public/audio/${key}.mp3`,
    buffer: null,
  };
  clip.buffer = await load_audio(clip.url);
  data.audio.clips[key] = clip;
}

function platform_play_audio_clip(key, group = 0, loop = false) {
  if (data.audio.available === false)
    return;

  const clip = data.audio.clips[key];
  const source = data.audio.context.createBufferSource();
  source.buffer = clip.buffer;
  source.loop = loop;
  if (group === 0)
    source.connect(data.audio.gainSfx);
  else
    source.connect(data.audio.gainMusic);
  source.start();
  data.audio.sources[key] = source;
}

function platform_stop_audio_clip(key, group = 0, fadeDuration = 0) {
  if (data.audio.available === false)
    return;

  if (fadeDuration === 0) {
    data.audio.sources[key].stop();
    return;
  }

  const tempGain = data.audio.context.createGain();
    data.audio.sources[key].disconnect();
    data.audio.sources[key].connect(tempGain).connect(data.audio.context.destination);
    if (group === 0)
      tempGain.gain.value = data.audio.gainSfx.gain.value * VOLUME_SFX_MULTIPLIER;
    else
      tempGain.gain.value = data.audio.gainMusic.gain.value * VOLUME_MUSIC_MULTIPLIER;
    tempGain.gain.linearRampToValueAtTime(0, data.audio.context.currentTime + fadeDuration)
}

export async function platform_init() {
  data.state.quit = false;
  data.canvas = document.createElement("canvas");
  data.canvas.classList.add("breakout-canvas");
  data.canvas.setAttribute("id", "breakout");
  document.body.appendChild(data.canvas);

  {
    for (let keycode = 0; keycode < 256; keycode++) {
      data.state.keys[keycode] = {
        down: false,
        released: false,
      };
    }
    for (let keycode = 0; keycode <= 3; keycode++) {
      data.state.mouse_keys[keycode] = {
        down: false,
        released: false,
      };
    }
  }

  if (data.ui.help === null)
  {
    data.ui.help = document.createElement("aside");
    data.ui.help.classList.add("breakout-help");
    data.ui.help.classList.add("hidden");
    data.ui.help.innerHTML = `<p>Use <b>LEFT</b> and <b>RIGHT</b> arrows to move your paddle.<br>Press <b>SPACE</b> to shoot a ball, <b>ESCAPE</b> to pause / open the settings.</p>`;
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

    const root = document.createElement("section");
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
        data.settings.volumeMusic = rawValue;
        set_volume_music(rawValue);
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
        data.settings.volumeSfx = rawValue;
        set_volume_sfx(rawValue);
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

    platform_log("Blocks found on the page:", data.blocks.length);
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const canPlayAudio = AudioContext !== undefined;
  if (canPlayAudio) {
    data.audio.available = true;
    data.audio.context = new AudioContext();
    data.audio.gainMusic = data.audio.context.createGain();
    data.audio.gainMusic.connect(data.audio.context.destination);
    set_volume_music(data.settings.volumeMusic);
    data.audio.gainSfx = data.audio.context.createGain();
    data.audio.gainSfx.connect(data.audio.context.destination);
    set_volume_sfx(data.settings.volumeSfx);
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

  document.addEventListener("contextmenu", contextmenu);
  document.addEventListener("mouseup", mouseup);
  document.addEventListener("mousedown", mousedown);
  document.addEventListener("mousemove", mousemove);
  document.addEventListener("keydown", keydown);
  document.addEventListener("keyup", keyup);
  window.addEventListener("resize", resize);

  return {
    get_blocks: platform_get_blocks,
    destroy_block: platform_destroy_block,
    show_help: platform_show_help,
    hide_help: platform_hide_help,
    show_score: platform_show_score,
    hide_score: platform_hide_score,
    show_pause: platform_show_pause,
    hide_pause: platform_hide_pause,
    show_lives: platform_show_lives,
    hide_lives: platform_hide_lives,
    load_audio_clip: platform_load_audio_clip,
    play_audio_clip: platform_play_audio_clip,
    stop_audio_clip: platform_stop_audio_clip,
    log: platform_log,
    error: platform_error,
    mouseCodes: mouseCodes,
    keyCodes: keyCodes,
    state: data.state,
    canvas: data.canvas,
  };
}

export function platform_start(game_update) {
  return new Promise((resolve, reject) => {
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

        window.cancelAnimationFrame(data.animationFrameId);
        return resolve([result, score]);
      }

      data.animationFrameId = window.requestAnimationFrame(update);
      data.state.window.resized = false;
      // Reset input state at the end of the frame
      data.state.mouse.changed = 0;
      for (const [key, value] of Object.entries(data.state.keys)) {
        data.state.keys[key].released = false;
      }
      for (const [key, value] of Object.entries(data.state.mouse_keys)) {
        data.state.mouse_keys[key].released = false;
      }
    }
  });
}

export function platform_stop() {
  platform_log("Stopping the game");
  data.state.quit = true;
}

function clean_up() {
  document.querySelectorAll(".breakout-hidden").forEach((element) => {
    element.classList.remove("breakout-hidden");
  });
  data.blocks.forEach((element) => {
    element.classList.remove("breakout-block");
    element.classList.remove("destroyed");
  });
  data.blocks = [];
  data.canvas.remove();
  data.canvas = null;
  if (data.audio.context)
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

  document.removeEventListener("contextmenu", contextmenu);
  document.removeEventListener("mouseup", mouseup);
  document.removeEventListener("mousedown", mousedown);
  document.removeEventListener("mousemove", mousemove);
  document.removeEventListener("keydown", keydown);
  document.removeEventListener("keyup", keyup);
  window.removeEventListener("resize", resize);
}

function contextmenu(e) {
  e.preventDefault();
}

function mousedown(e) {
  data.state.mouse_keys[e.which].down = true;
}

function mouseup(e) {
  data.state.mouse_keys[e.which].down = false;
  data.state.mouse_keys[e.which].released = true;
}

function mousemove(e) {
  data.state.mouse.x = e.clientX;
  data.state.mouse.y = e.clientY;
  data.state.mouse.changed = true;
}

function keydown(e) {
  data.state.keys[e.keyCode].down = true;
}

function keyup(e) {
  data.state.keys[e.keyCode].down = false;
  data.state.keys[e.keyCode].released = true;
}

function resize() {
  platform_log("Window resized:", window.innerWidth, window.innerHeight);
  data.canvas.width = window.innerWidth;
  data.canvas.height = window.innerHeight;
  data.state.window.width = data.canvas.width;
  data.state.window.height = data.canvas.height;
  data.state.window.resized = true;
}

function split_in_blocks(nodes) {
  nodes.forEach((root) => {
    let prependSpace = false;
    root.childNodes.forEach((node) => {
      if (node.tagName === "A") {
        node.classList.add("breakout-preblock");
        return;
      }

      if (node.tagName !== undefined)
        return;

      const replacement = document.createElement("span");
      const words = node.textContent.split(" ");
      let i = 0;
      words.forEach((word, index) => {
        if (word === "") {
          prependSpace = true;
          return;
        }

        const span = document.createElement("span");
        span.classList.add("breakout-preblock");
        span.innerHTML = word;
        if (prependSpace)
          span.innerHTML = " " + span.innerHTML;

        if (index < words.length - 1)
          span.innerHTML += " "
        replacement.appendChild(span);

        i += 1;
      });
      node.innerHTML = replacement.innerHTML;
      root.replaceChild(replacement, node);
      prependSpace = false;
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
  if (data.debug.noMusic || data.audio.available === false)
    return;

  platform_log("Music volume:", value);
  if (data.paused)
    value *= VOLUME_MUSIC_PAUSED_MULTIPLIER;
  else
    value *= VOLUME_MUSIC_MULTIPLIER;

  data.audio.gainMusic.gain.value = value;
}

function set_volume_sfx(value) {
  if (data.debug.noSfx || data.audio.available === false)
    return;

  platform_log("SFX volume:", value);
  value *= VOLUME_SFX_MULTIPLIER;

  data.audio.gainSfx.gain.value = value;
}

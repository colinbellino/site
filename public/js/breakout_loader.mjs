{
  const startButton = document.querySelector(".start-game");
  let dialog = null;
  let gameIsRunning = false;
  let style = null;
  let platform = null;
  let game = null;
  let startButtonIsOn = false;

  let minWidth = 700;
  let minHeight = 700;
  if (document.body.hasAttribute("data-breakout-min-width"))
    minWidth = parseInt(document.body.getAttribute("data-breakout-min-width"));
  if (document.body.hasAttribute("data-breakout-min-height"))
    minHeight = parseInt(document.body.getAttribute("data-breakout-min-height"));

  bindStartButton();
  window.addEventListener("resize", bindStartButton);

  if (window.location.search.includes("start_game"))
    start_game();

  function bindStartButton() {
    const canStartGame = startButton && window.innerWidth >= minWidth && window.innerHeight >= minHeight;
    if (canStartGame) {
      if (startButtonIsOn === false) {
        dialog = document.createElement("p");
        dialog.setAttribute("role", "tooltip");
        dialog.classList.add("dialog");
        dialog.innerHTML = "How about a nice game of breakout?";
        startButton.classList.add("clickable");
        startButton.appendChild(dialog);
        startButton.addEventListener("click", start_game);
        startButtonIsOn = true;
      }
      return;
    }

    if (startButtonIsOn) {
      dialog.remove();
      startButton.classList.remove("clickable");
      startButton.removeEventListener("click", start_game);
      startButtonIsOn = false;
    }
  }

  function import_style(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
        link.setAttribute("href", url);
        link.setAttribute("rel", "stylesheet");
        link.onload = resolve;
        document.body.appendChild(link);
    });
  }

  async function start_game(e) {
    try {
      if (e) {
        e.preventDefault();
      }

      if (gameIsRunning) {
        return;
      }

      if (game === null) {
        console.log("Loading game files.");
        [style, platform, game] = await Promise.all([
          import_style("/public/breakout.css"),
          import("/public/js/breakout_platform_browser.mjs"),
          import("/public/js/breakout_game.mjs"),
        ]);
      }

      gameIsRunning = true;

      const [result, score] = await platform.platform_start(game.game_init, game.game_update);
      gameIsRunning = false;

      if (result === game.STATE_QUIT) {
        return;
      }

      console.log(`Game over: ${(result === 1 ? "WIN" : "LOSE")} (${score})`);
      start_game();
    } catch (error) {
      console.error(error);
    }
  }
}

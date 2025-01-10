let worldmap_game;

{
    const can_hover = matchMedia("(hover: hover)").matches;
    if (can_hover) {
        document.addEventListener("mousemove", flip_avatar);
    }

    const worldmap_start_button = document.querySelector("button#worldmap_start");
    if (worldmap_start_button && location.search.includes("worldmap")) {
        worldmap_start_button.classList.add("visible");
        worldmap_start_button.addEventListener("click", worldmap_start_or_stop);
    }
}

function flip_avatar(e) {
    const avatar = document.querySelector("#avatar");
    const rect = avatar.getBoundingClientRect();
    if (e.clientX < rect.x) {
        avatar.classList.add("flipped");
    } else if (e.clientX > rect.x + rect.width) {
        avatar.classList.remove("flipped");
    }
}

function worldmap_start_or_stop() {
    const is_running = document.body.classList.contains("worldmap_running");
    const is_loading = document.body.classList.contains("worldmap_loading");
    const is_closing = document.body.classList.contains("worldmap_closing");
    if (is_running) {
        if (is_loading || is_closing) { return; }

        document.body.classList.add("worldmap_closing");
        setTimeout(() => {
            document.body.classList.remove("worldmap_running", "worldmap_closing");
            worldmap_game.stop();
        }, 1000);
    } else {
        if (is_loading || is_closing) { return; }

        if (worldmap_game === undefined) {
            document.body.classList.add("worldmap_loading");
            Promise.all([
                import      ("/worldmap/dist/game.js"),
                import_style("/worldmap/worldmap.css"),
                new Promise(resolve => setTimeout(resolve, 300)),
            ]).then((results) => {
                worldmap_game = results[0];
                worldmap_game.start(loaded_callback);
            });
        } else {
            worldmap_game.update();
            loaded_callback();
        }

        function loaded_callback() {
            document.body.classList.remove("worldmap_loading");
            document.body.classList.add("worldmap_running");
            document.activeElement.blur();
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
    }
}

function prepare_page_for_breakout() {
    document.body.setAttribute("data-breakout-min-width", 1000);
    document.body.setAttribute("data-breakout-min-height", 700);
    const blocks = [".avatar img", ".hire-me", "li > a"];
    document.querySelectorAll(blocks).forEach((node) => node.classList.add("breakout-preblock"));
    const toSplit = ["h1 a", "h2", "main > nav > p > b", "main > section > p", "main > footer > p"];
    document.querySelectorAll(toSplit).forEach((node) => node.classList.add("breakout-to-split"));
}

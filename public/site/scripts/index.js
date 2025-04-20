let worldmap_game;

{
    const can_hover = matchMedia("(hover: hover)").matches;
    if (can_hover) {
        document.addEventListener("mousemove", flip_avatar);
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

function prepare_page_for_breakout() {
    document.body.setAttribute("data-breakout-min-width", 1000);
    document.body.setAttribute("data-breakout-min-height", 700);
    const blocks = [".avatar img", ".hire-me", "li > a"];
    document.querySelectorAll(blocks).forEach((node) => node.classList.add("breakout-preblock"));
    const toSplit = ["h1 a", "h2", "main > nav > p > b", "main > section > p", "main > footer > p"];
    document.querySelectorAll(toSplit).forEach((node) => node.classList.add("breakout-to-split"));
}

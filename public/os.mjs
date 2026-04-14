class OS_Root extends HTMLElement {
    connectedCallback() {
        this.shortcuts = Array.from(this.querySelectorAll("os-shortcut"));
        this.windows = Array.from(this.querySelectorAll("os-window"));
        this.tasks = Array.from(this.querySelectorAll("os-task"));
    }

    window_open(window_id) {
        const window = this.windows.find(window => window.window_id === window_id);
        if (window) { window.open(); }
        const task = this.tasks.find(task => task.window_id === window_id);
        if (task) { task.open(); }
    }
    window_close(window_id) {
        const window = this.windows.find(window => window.window_id === window_id);
        if (window) { window.close(); }
        const task = this.tasks.find(task => task.window_id === window_id);
        if (task) { task.close(); }
    }
}

class OS_Shortcut extends HTMLElement {
    connectedCallback() {
        this.link = this.querySelector("a");
        this.link.addEventListener("click", this.link_on_click.bind(this));
        this.window_id = this.getAttribute("window");
    }

    link_on_click(event) {
        event.preventDefault();
        os_root.window_open(this.window_id);
    }
}

class OS_Task extends HTMLElement {
    connectedCallback() {
        this.button = this.querySelector("button");
        this.button.addEventListener("click", this.button_on_click.bind(this));
        this.window_id = this.getAttribute("window");
    }


    open() {
        this.classList.toggle("closed", false);
    }
    close() {
        this.classList.toggle("closed", true);
    }

    button_on_click(event) {
        event.preventDefault();
        os_root.window_open(this.window_id);
    }
}

class OS_Window extends HTMLElement {
    connectedCallback() {
        this.window_id = this.getAttribute("id");
        this.header = this.querySelector(".window-header");
        this.minimize_button = this.querySelector(".window-button.minimize");
        this.close_button = this.querySelector(".window-button.close");
        this.x = 0;
        this.y = 0;

        const closed = this.classList.contains("closed") || false;

        this.classList.toggle("closed", closed);

        this.header.addEventListener("mousedown", this.header_on_mousedown.bind(this));
        this.minimize_button.addEventListener("click", this.minimize_button_on_click.bind(this));
        this.close_button.addEventListener("click", this.close_button_on_click.bind(this));
    }
    attributeChangedCallback(name, oldValue, newValue) {
        console.log("name, oldValue, newValue", name, oldValue, newValue);
    }

    open() {
        this.classList.toggle("closed", false);
    }
    close() {
        this.classList.toggle("closed", true);
    }
    move(x, y) {
        // TODO: keep window in bounds
        this.style.left = this.offsetLeft - (this.x - x) + "px";
        this.style.top = this.offsetTop - (this.y - y) + "px";
        this.x = x;
        this.y = y;
    }

    document_on_mousemove(event) {
        this.move(event.clientX, event.clientY);
    }
    document_on_mouseup() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
    header_on_mousedown(event) {
        this.x = this.clientX;
        this.y = this.clientY;
        document.onmousemove = this.document_on_mousemove.bind(this);
        document.onmouseup = this.document_on_mouseup.bind(this);
    }
    minimize_button_on_click(event) {
        console.log("minimize_button_on_click", event);
    }
    close_button_on_click(event) {
        os_root.window_close(this.window_id);
    }
}

export function start() {
    window.customElements.define("os-root", OS_Root);
    window.customElements.define("os-shortcut", OS_Shortcut);
    window.customElements.define("os-window", OS_Window);
    window.customElements.define("os-task", OS_Task);
}

const os_root = document.querySelector("os-root");

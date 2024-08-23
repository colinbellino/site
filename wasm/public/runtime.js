let allocated; // A global reference of the WASM’s memory area so that we can look up pointers
const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
window.addEventListener("resize", resize_canvas_to_window);

// These are all the functions that we declared as "#foreign" in our Jai code.
// They let you interact with the JS and DOM world from within Jai.
// If you forget to implement one, the Proxy below will log a nice error.
const exported_js_functions = {
    wasm_write_string: (s_count, s_data, to_standard_error) => {
        const string = js_string_from_jai_string(s_data, s_count);
        write_to_console_log(string, to_standard_error);
    },
    wasm_debug_break: () => {
        debugger;
    },
    wasm_resize_canvas: (width, height) => {
        canvas.width = width;
        canvas.height = height;
    },
    wasm_log: (s_count, s_data, is_error) => {
        exported_js_functions.wasm_log_console(s_count, s_data, is_error);
        exported_js_functions.wasm_log_dom(s_count, s_data, is_error);
    },
    wasm_log_console: (s_count, s_data, is_error) => {
        const string = js_string_from_jai_string(s_data, s_count);
        if (is_error) {
            console.error(string);
        } else {
            console.log(string);
        }
    },
    wasm_log_dom: (s_count, s_data, is_error) => {
        const log = document.querySelector("#log");
        const string = js_string_from_jai_string(s_data, s_count);
        const lines = string.split("\n");
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line && i == lines.length - 1) { continue; } // Don’t create an extra empty line after the last newline

            const element = document.createElement("div");
            if (is_error) { element.style.color = "#d33"; }
            element.innerText = line;
            log.appendChild(element);

            log.scrollTop = log.scrollHeight;
        }
    }
}

// Create the environment for the WASM file,
// which includes the exported JS functions for the WASM:
const imports = {
    "env": new Proxy(exported_js_functions, {
        get(target, prop, receiver) {
            if (target.hasOwnProperty(prop)) {
                return target[prop];
            }

            return () => { throw new Error("Missing function: " + prop); };
        },
    }),
}

// Load the WASM file we compiled and run its main.
WebAssembly.instantiateStreaming(fetch("main.wasm"), imports).then(wasm_init);

function wasm_init(obj) {
    allocated = obj.instance.exports.memory;
    obj.instance.exports.main(0, BigInt(0));
    resize_canvas_to_window();
}

const text_decoder = new TextDecoder();
function js_string_from_jai_string(pointer, length) {
    const u8 = new Uint8Array(allocated.buffer);
    const bytes = u8.subarray(Number(pointer), Number(pointer) + Number(length));
    return text_decoder.decode(bytes);
}

function js_string_from_c_string(pointer) {

}

// console.log and console.error always add newlines so we need to buffer the output from write_string
// to simulate a more basic I/O behavior. We’ll flush it after a certain time so that you still
// see the last line if you forget to terminate it with a newline for some reason.
let console_buffer = "";
let console_buffer_is_standard_error;
let console_timeout;
const FLUSH_CONSOLE_AFTER_MS = 3;

function write_to_console_log(str, to_standard_error) {
    if (console_buffer && console_buffer_is_standard_error != to_standard_error) {
        flush_buffer();
    }

    console_buffer_is_standard_error = to_standard_error;
    const lines = str.split("\n");
    for (let i = 0; i < lines.length - 1; i++) {
        console_buffer += lines[i];
        flush_buffer();
    }

    console_buffer += lines[lines.length - 1];

    clearTimeout(console_timeout);
    if (console_buffer) {
        console_timeout = setTimeout(() => {
            flush_buffer();
        }, FLUSH_CONSOLE_AFTER_MS);
    }

    function flush_buffer() {
        if (!console_buffer) { return; }

        if (console_buffer_is_standard_error) {
            console.error(console_buffer);
        } else {
            console.log(console_buffer);
        }

        console_buffer = "";
    }
}

function resize_canvas_to_window() {
    exported_js_functions.wasm_resize_canvas(window.innerWidth, window.innerHeight);
}

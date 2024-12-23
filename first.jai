#import "Compiler";
#import "Basic";
#import "Process";
#import "String";
#import "File_Watcher";
#import "Thread";

watcher: File_Watcher(void);
config: Config;

Config :: struct {
    release: bool;
}

#run {
    root_options := get_build_options();

    config.release = array_find(root_options.compile_time_command_line, "-release");

    thread_group: Thread_Group;
    init(*thread_group, 1, compile_work);
    thread_group.name    = "SWC";
    thread_group.logging = false;
    start(*thread_group);
    add_work(*thread_group, null, tprint("Work item 0"));

    args := string.[tprint("./bin/%/simple-http-server", OS), "public"];
    process_result, output, error := run_command(..args, capture_and_return_output = false, print_captured_output = true);
}

compile_work :: (group: *Thread_Group, thread: *Thread, work: *void) -> Thread_Continue_Status {
    if !init(*watcher, file_change_callback, null, events_to_watch = .ALL_EVENTS, verbose = false) {
        log_error("Could not initialize watcher");
        exit(4);
    }

    dirs_to_watch: [..]string;
    array_add(*dirs_to_watch, "src");
    if !add_directories(*watcher, ..dirs_to_watch) {
        log_error("Could not watch directories %", dirs_to_watch);
        exit(4);
    }

    run_compile_command("src/game.ts", config.release);

    while true {
        sleep_milliseconds(100);
        process_changes(*watcher);
    }
    return .CONTINUE;
}

file_change_callback :: (watcher: *File_Watcher(void), change: *File_Change, user_data: *void) {
    // log("change %", change.*);
    if change.events & .MODIFIED && ends_with(change.full_path, ".ts") {
        run_compile_command(change.full_path, config.release);
    }
}

run_compile_command :: (file_full_path: string, is_release: bool) {
    remove_whitespace :: (str: string) -> string {
        return replace(replace(str, "\n", ""), " ", "");
    }
    to_dist_path :: (path: string) -> string {
        return replace(replace(path, ".ts", ".js"), "src/", "public/dist/");
    }

    config := tprint(#string STRING
        {
            "jsc": {
                "target": "es6",
                "minify": { "mangle": %1, "compress": %1 },
                "transform": {
                    "optimizer": {
                        "globals": { "vars": { "__RELEASE__": "%1" } }
                    }
                }
            },
            "module": { "type": "es6" },
            "minify": %1
        }
    STRING, ifx is_release then "true" else "false");
    args := string.[
        tprint("./bin/%/swc", OS),
        "compile", file_full_path,
        "--out-file", to_dist_path(file_full_path),
        "--source-maps", ifx is_release then "false" else "true",
        "--config-json", remove_whitespace(config),
    ];
    process_result, output, error := run_command(..args, capture_and_return_output = true);
    log("[SWC] ❯ %", join(..args, " "));
    if error {
        log_error("[SWC] %", error);
    } else {
        #import "File";
        data, read_ok := read_entire_file(to_dist_path(file_full_path));
        log("[SWC] % compiled (% bytes).", file_full_path, data.count);
    }
}

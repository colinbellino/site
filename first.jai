#import "Basic";
#import "Process";
#import "String";
#import "File_Watcher";

watcher: File_Watcher(void);

#run {
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
    
    log("Watching files...");
    while true {
        process_changes(*watcher);
    }
}

file_change_callback :: (watcher: *File_Watcher(void), change: *File_Change, user_data: *void) {
    // log("change %", change.*);
    if change.events & .MODIFIED && ends_with(change.full_path, ".ts") {
        args := string.[ 
            tprint("./bin/%/swc", OS),
            "compile", change.full_path,
            "--out-file=dist/main.js",
        ];
        process_result, output, error := run_command(..args, capture_and_return_output = true);
        // log("process_result: %", process_result);
        // log("output: %", output);
        if output {
            log_error(error);
        } else {
            log("% recompiled.", change.full_path);
        }
    }
}
#import "Basic";
#import "Process";
#import "String";
#import "File_Watcher";
#import "Thread";

watcher: File_Watcher(void);

#run {
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

        run_compile_command("src/main.ts");

        while true {
            process_changes(*watcher);
        }
        return .CONTINUE;
    }

    {
        thread_group: Thread_Group;
        init(*thread_group, 1, compile_work);
        thread_group.name    = "SWC";
        thread_group.logging = false;

        start(*thread_group);

        add_work(*thread_group, null, tprint("Work item 0"));
    }

    args := string.[tprint("./bin/%/simple-http-server", OS)];
    process_result, output, error := run_command(..args, capture_and_return_output = false, print_captured_output = true);
}

file_change_callback :: (watcher: *File_Watcher(void), change: *File_Change, user_data: *void) {
    // log("change %", change.*);
    if change.events & .MODIFIED && ends_with(change.full_path, ".ts") {
        run_compile_command(change.full_path);
    }
}

run_compile_command :: (file_full_path: string) {
    args := string.[
        tprint("./bin/%/swc", OS),
        "compile", file_full_path,
        "--out-file=dist/main.js",
    ];
    process_result, output, error := run_command(..args, capture_and_return_output = true);
    // log("process_result: %", process_result);
    // log("output: %", output);
    if output {
        log_error("[SWC] %", error);
    } else {
        log("[SWC] % compiled.", file_full_path);
    }
}

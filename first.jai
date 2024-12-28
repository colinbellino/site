#import "Compiler";
#import "Basic";
#import "Process";
#import "String";
#import "File_Watcher";
#import "Thread";

watcher: File_Watcher(void);
config: Config;

Config :: struct {
    release:    bool;
    no_server:  bool;
}

#run {
    root_options := get_build_options();

    config.release = array_find(root_options.compile_time_command_line, "-release");
    config.no_server = array_find(root_options.compile_time_command_line, "-no-server");

    if config.no_server {
        run_compile_command("src/game.ts", config.release);
    } else {
        thread_group: Thread_Group;
        init(*thread_group, 1, compile_work);
        thread_group.name    = "SWC";
        thread_group.logging = false;
        start(*thread_group);
        add_work(*thread_group, null, tprint("Work item 0"));

        args := string.[tprint("./bin/%/http-server", OS), "--port", "8000", "--path", "public"];
        process_result, output, error := run_command(..args, capture_and_return_output = false, print_captured_output = true);
    }
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
    if change.events & .MODIFIED && ends_with(change.full_path, ".ldtk") {
        run_compile_command("./src/game.ts", config.release);
    }
}

run_compile_command :: (file_full_path: string, is_release: bool) {
    remove_whitespace :: (str: string) -> string {
        return replace(replace(str, "\n", ""), " ", "");
    }
    to_dist_path :: (path: string) -> string {
        return replace(replace(path, ".ts", ".js"), "src/", "public/dist/");
    }

    {
        build_config := tprint(#string STRING
            {
                "jsc": {
                    "target": "es2016",
                    "minify": { "mangle": %1, "compress": %1 },
                    "loose": false,
                    "keepClassNames": false,
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
            "--config-json", remove_whitespace(build_config),
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

    {
        sprite_vert, sprite_vert_ok := read_entire_file("./src/sprite.glsl.vert");
        if !sprite_vert_ok { log_error("Couldn't read shader file: sprite.glsl.vert"); return; }
        sprite_frag, sprite_frag_ok := read_entire_file("./src/sprite.glsl.frag");
        if !sprite_frag_ok { log_error("Couldn't read shader file: sprite.glsl.frag"); return; }

        shaders_js := tprint("\nconst sprite_vs = `%`;\nconst sprite_fs = `%`;\n", sprite_vert, sprite_frag);
        inject_js(shaders_js);
        // log("---- injected shaders_js");
    }

    {
        #import "Hash_Table";
        #import,file "./src/ldtk.jai";

        GRID_SIZE : s32 : 16;
        LAYER_ENTITY :: 0;
        LAYER_GRID :: 1;
        Point :: struct {
            grid_position: [2]s32;
            neighbours:    [4]s32;
            project_id:    s32;
        }

        result := ldtk_load("./src/world.ldtk", temp);
        assert(result != null);

        level := *result.levels[0];

        grid: [..]s32;
        points: [..]Point;
        project_id: s32;
        for level.layerInstances[LAYER_GRID].intGridCsv {
            array_add(*grid, it);
        }
        for entity_instance : level.layerInstances[LAYER_ENTITY].entityInstances {
            neighbours := s32.[-1,-1,-1,-1];
            for field_instance, field_index : entity_instance.fieldInstances {
                if field_instance.__value.object == null { continue; }

                if field_instance.__identifier == {
                    case "NORTH"; #through;
                    case "EAST"; #through;
                    case "SOUTH"; #through;
                    case "WEST"; {
                        value, success := table_find(field_instance.__value.object, "entityIid");
                        assert(success);
                        target_entity_iid := value.str;
                        for other, other_index : level.layerInstances[LAYER_ENTITY].entityInstances {
                            if other.iid == target_entity_iid {
                                neighbours[field_index] = cast(s32)other_index;
                                break;
                            }
                        }
                    }
                    case "project_id"; {
                        project_id = cast(s32) field_instance.__value.number;
                    }
                }
            }
            array_add(*points, Point.{
                grid_position = entity_instance.__grid,
                neighbours    = neighbours,
                project_id    = project_id,
            });
        }

        world_str: String_Builder;
        append(*world_str, "{\n");
        append(*world_str, tprint("  width:  %,\n", level.pxWid / GRID_SIZE));
        append(*world_str, tprint("  height: %,\n", level.pxHei / GRID_SIZE));
        append(*world_str, tprint("  grid:   ["));
        for grid { append(*world_str, tprint("%, ", it)); }
        append(*world_str, "],\n");
        append(*world_str, tprint("  points:   ["));
        for points { append(*world_str, tprint("{ grid_position: %, neighbours: %, project_id: % }, ", it.grid_position, it.neighbours, it.project_id)); }
        append(*world_str, "],\n");
        append(*world_str, "}");

        world_js := tprint("\nconst WORLD = %;", builder_to_string(*world_str));
        inject_js(world_js);
        // log("---- world_js injected");
    }
}

inject_js :: (text: string) {
    path := "./public/dist/game.js";

    // js_file_data, js_file_ok := read_entire_file(path);
    // if !js_file_ok {
    //     log_error("Couldn't open js file to append code.");
    //     return;
    // }
    // new_data := join(text, "\n", js_file_data);
    // write_ok := write_entire_file(path, new_data);
    // if !write_ok {
    //     log_error("Couldn't write to js file to append code.");
    //     return;
    // }

    js_file, js_file_ok := file_open(path, for_writing = true, keep_existing_content = true);
    if !js_file_ok {
        log_error("Couldn't open js file to append code.");
        return;
    }
    defer file_close(*js_file);
    // ok, bytes_read := file_read(user_data.file, contents, cast(s64) total_size);
    file_set_position(js_file, file_length(js_file));
    file_write(*js_file, text.data, text.count);
}

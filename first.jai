watcher: File_Watcher(void);
config: Config;

Config :: struct {
    release:    bool;
    no_server:  bool;
}

#run,stallable {
    root_options := get_build_options();
    args := root_options.compile_time_command_line;

    compile := array_find(args, "-compile");
    if compile {
        w := get_current_workspace();
        set_build_options_dc(.{ output_executable_name = "build" }, w);
    } else {
        set_build_options_dc(.{ do_output = false });

        if !build(args) {
            compiler_set_workspace_status(.FAILED);
        }
    }
}

main :: () {
    #import "System";

    set_working_directory(path_strip_filename(get_path_of_running_executable()));
    args := get_command_line_arguments();
    if !build(args) {
        exit(1);
    }
}

build :: (args: []string) -> bool {
    config.release = array_find(args, "-release");
    log("release:   %", config.release);
    config.no_server = array_find(args, "-no-server");
    log("no_server: %", config.no_server);

    if config.release {
        run_minify_html_command();
        run_compress_png_command();
    }

    run_compile_command("src/game.ts", config.release);

    if config.no_server {

    } else {
        thread_group: Thread_Group;
        init(*thread_group, 1, compile_work);
        thread_group.name    = "SWC";
        thread_group.logging = false;
        start(*thread_group);
        add_work(*thread_group, null, tprint("Work item 0"));

        args := string.[tprint("./bin/%/http-server", OS), "--port", "8000", "--path", "public"];
        process_result, output, error := run_command(..args, capture_and_return_output = false, print_captured_output = true);
        return error != "";
    }

    return true;
}

compile_work :: (group: *Thread_Group, thread: *Thread, work: *void) -> Thread_Continue_Status {
    run_compile_command("src/game.ts", config.release);

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

run_compress_png_command :: () {
    log("[PNG] Compressing images.");
    args := string.[
        tprint("./bin/%/oxipng", OS),
        "-r", "public",
    ];
    process_result, output, error := run_command(..args, capture_and_return_output = true);
    // log("[PNG] ❯ %", join(..args, " "));
    if error {
        log_error("[PNG] %", error);
    } else {
        #import "File";
        log("[PNG] Done.");
    }
}
run_minify_html_command :: () {
    files :: string.[
        "breakout",
        "card",
        "changelog",
        "games",
        "index",
        "web",
        "worldmap",
        "resume",
    ];
    for file : files {
        path_input  := tprint("public/%.html", file);
        path_output := tprint("public/%.min.html", file);
        args := string.[
            tprint("./bin/%/minhtml", OS),
            path_input,
            "--output", path_output,
            "--minify-css",
            "--ensure-spec-compliant-unquoted-attribute-values",
        ];
        process_result, output, error := run_command(..args, capture_and_return_output = true);
        // log("[MIN] ❯ %", join(..args, " "));
        if error {
            log_error("[MIN] %", error);
        } else {
            #import "File";
            data, read_ok := read_entire_file(path_output);
            log("[MIN] % minified (% bytes).", path_output, data.count);
        }
    }
}

run_compile_command :: (file_full_path: string, is_release: bool) {
    remove_whitespace :: (str: string) -> string {
        return replace(replace(str, "\n", ""), " ", "");
    }
    to_dist_path :: (path: string) -> string {
        return replace(replace(path, ".ts", ".js"), "src/", "public/worldmap/dist/");
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
        // log("[SWC] ❯ %", join(..args, " "));
        if error {
            log_error("[SWC] %", error);
        } else {
            #import "File";
            data, read_ok := read_entire_file(to_dist_path(file_full_path));
            log("[SWC] % compiled (% bytes).", file_full_path, data.count);
        }
    }

    codegen_str: String_Builder;
    append(*codegen_str, "\nconst __CODEGEN__ = {\n");

    {
        sprite_vert, sprite_vert_ok := read_entire_file("./src/sprite.glsl.vert");
        if !sprite_vert_ok { log_error("Couldn't read shader file: sprite.glsl.vert"); return; }
        sprite_frag, sprite_frag_ok := read_entire_file("./src/sprite.glsl.frag");
        if !sprite_frag_ok { log_error("Couldn't read shader file: sprite.glsl.frag"); return; }

        append(*codegen_str, tprint("sprite_vs: `%`,\n", sprite_vert));
        append(*codegen_str, tprint("sprite_fs: `%`,\n", sprite_frag));
        // log("---- injected shaders_js");
    }

    {
        #import,file "./src/ldtk.jai";

        assert :: (arg: bool, message := "", args: .. Any, loc := #caller_location) {
            Basic :: #import "Basic";
            if config.release {
                Basic.assert(arg, message, args);
            } else if !arg {
                log_error(tprint("[\u001b[31mERROR\u001b[00m] %", message), args);
            }
        };

        LAYER_ENTITY  :: 0;
        LAYER_TILES   :: 1;
        LAYER_WORLD   :: 2;
        Node_Type :: enum {
            EMPTY;
            PROJECT;
            WARP;
            INFO;
        }
        Node :: struct {
            type:               Node_Type;
            grid_position:      [2]float;
            neighbours:         [4]Path;
            project_id:         s32;
            warp_target:        s32;
            warp_camera:        [2]float;
            tooltip:            string;
        }
        Path :: struct {
            path:               [..][2]float;
        }

        find_node_at_position :: (position: [2]float, nodes: []Node) -> int {
            for node, node_index : nodes {
                if node.grid_position[0] == position[0] && node.grid_position[1] == position[1] {
                    return node_index;
                }
            }
            return -1;
        }

        root := ldtk_load("./src/world.ldtk", temp);
        assert(root != null);

        level := *root.levels[0];

        grid: [..]s32;
        tiles: [..]LDTK_Tile_Instance;
        nodes: [..]Node;
        start_position: [2]float;
        grid_size: s32 = level.layerInstances[LAYER_WORLD].__gridSize;
        for level.layerInstances[LAYER_WORLD].intGridCsv {
            array_add(*grid, it);
        }
        for level.layerInstances[LAYER_TILES].gridTiles {
            array_add(*tiles, it);
        }
        entity_instances := level.layerInstances[LAYER_ENTITY].entityInstances;
        for entity_instance : level.layerInstances[LAYER_ENTITY].entityInstances {
            entity_def: LDTK_Entity_Def;
            for root.defs.entities {
                if it.uid == entity_instance.defUid {
                    entity_def = it;
                    break;
                }
            }

            grid_position := float.[ cast(float)entity_instance.__grid[0], cast(float)entity_instance.__grid[1] ];

            if entity_def.identifier == {
                case "Node"; {
                    node := Node.{
                        grid_position   = grid_position,
                        neighbours      = .[.{}, .{}, .{}, .{}],
                    };
                    for field_instance : entity_instance.fieldInstances {
                        obj := field_instance.__value.object;
                        if obj == null { continue; }

                        if field_instance.__identifier == {
                            case "project_id"; {
                                node.project_id = cast(s32) field_instance.__value.number;
                            }
                            case "tooltip";         { node.tooltip = field_instance.__value.str; }
                            case "warp_target";     { node.warp_target = ldtk_get_node_index(obj, entity_instance.defUid, entity_instances); }
                            case "warp_camera";     { node.warp_camera = ldtk_get_grid_position(obj); }
                            case "path_north";    { for field_instance.__value.array { array_add(*node.neighbours[0].path, ldtk_get_grid_position(it.object)); } }
                            case "path_east";     { for field_instance.__value.array { array_add(*node.neighbours[1].path, ldtk_get_grid_position(it.object)); } }
                            case "path_south";    { for field_instance.__value.array { array_add(*node.neighbours[2].path, ldtk_get_grid_position(it.object)); } }
                            case "path_west";     { for field_instance.__value.array { array_add(*node.neighbours[3].path, ldtk_get_grid_position(it.object)); } }
                            case "type"; {
                                if field_instance.__value.str == {
                                    case "EMPTY";    { node.type = .EMPTY; }
                                    case "PROJECT";  { node.type = .PROJECT; }
                                    case "WARP";     { node.type = .WARP; }
                                    case "INFO";     { node.type = .INFO; }
                                    case;            { assert(false, "Unknown node type value: %", field_instance.__value.str); }
                                }
                            }
                            case; {
                                assert(false, "Unknown field_instance: %", field_instance.__identifier);
                            }
                        }
                    }
                    array_add(*nodes, node);
                }
                case "Start_Position"; {
                    start_position = grid_position;
                }
            }
        }

        for node : nodes {
            if node.type == {
                case .PROJECT; { assert(node.project_id > 0, "Invalid project_id! %", node); }
                case .WARP;    {
                    assert(node.warp_target > -1, "Invalid warp_target! %", node);
                    assert(node.warp_camera[0] != 0 && node.warp_camera[1] != 0, "Invalid warp_camera! %", node);
                }
            }
            for neighbour, neighbour_index : node.neighbours {
                if neighbour.path.count > 0 {
                    point := neighbour.path[neighbour.path.count-1];
                    assert(find_node_at_position(point, nodes) > -1, "Invalid path! % (neighbour: %)", node, neighbour_index);
                }
            }
        }

        assert(start_position[0] != 0 && start_position[1] != 0, "Missing start_position");

        append(*codegen_str, "world: {\n");
        append(*codegen_str, tprint("  width:  %,\n", level.pxWid / grid_size));
        append(*codegen_str, tprint("  height: %,\n", level.pxHei / grid_size));
        append(*codegen_str, tprint("  grid:   ["));
        for grid { append(*codegen_str, tprint("%, ", it)); }
        append(*codegen_str, "],\n");
        append(*codegen_str, tprint("  tiles:   ["));
        for tiles { append(*codegen_str, tprint("{ px: %, src: % }, ", it.px, it.src)); }
        append(*codegen_str, "],\n");
        append(*codegen_str, tprint("  nodes:   ["));
        for nodes {
            append(*codegen_str, tprint("{ type: %,", cast(s32)it.type));
            append(*codegen_str, tprint(" grid_position: %,", it.grid_position));
            append(*codegen_str, tprint(" neighbours: ["));
            for neighbour : it.neighbours {
                append(*codegen_str, tprint("{ path: [",));
                for point : neighbour.path {
                    append(*codegen_str, tprint("%, ", point));
                }
                append(*codegen_str, tprint("] }, "));
            }
            append(*codegen_str, tprint(" ],"));
            if it.project_id
                append(*codegen_str, tprint(" project_id: %,", it.project_id));
            if it.warp_target
                append(*codegen_str, tprint(" warp_target: %,", it.warp_target));
            if it.warp_camera[0] != 0 && it.warp_camera[1] != 0
                append(*codegen_str, tprint(" warp_camera: %,", it.warp_camera));
            if it.tooltip
                append(*codegen_str, tprint(" tooltip: `%`,", it.tooltip));
            append(*codegen_str, " }, ");
        }
        append(*codegen_str, "],\n");
        append(*codegen_str, tprint("  start_position: %,\n", start_position));
        append(*codegen_str, "},");
    }

    append(*codegen_str, "\n};");

    inject_js(builder_to_string(*codegen_str));
}

inject_js :: (text: string) {
    path :: "./public/worldmap/dist/game.js";

    js_file, js_file_ok := file_open(path, for_writing = true, keep_existing_content = true);
    if !js_file_ok {
        log_error("Couldn't open js file to append code.");
        return;
    }
    defer file_close(*js_file);
    file_set_position(js_file, file_length(js_file));
    file_write(*js_file, text.data, text.count);
}

#import "Compiler";
#import "Basic";
#import "Process";
#import "String";
#import "File_Watcher";
#import "Thread";
#import "Math";

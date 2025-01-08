// These are injected at build time
declare const __RELEASE__: boolean;
declare const __CODEGEN__: Codegen;

type Codegen = {
    sprite_vs:  string;
    sprite_fs:  string;
    world:      World;
}

type Vector2 = Static_Array<float,2>;
type Vector3 = Static_Array<float,3>;
type Vector4 = Static_Array<float,4>;
type Matrix4 = Static_Array<float, 16>;
type float = GLfloat;
type int = GLint;
type Color = Static_Array<float, 4>;
type Fixed_Size_Array<T, N extends int> = {
    data:   Static_Array<T, N>;
    count:  int;
    total:  N;
};

// :game
type Game = {
    game_mode:              Game_Mode;
    world_mode:             World_Mode;
    world_mode_timer:       int;
    clear_color:            Color;
    player:                 Entity;
    projects:               Fixed_Size_Array<Project, typeof MAX_PROJECTS>,
    nodes:                  Fixed_Size_Array<Map_Node, typeof MAX_NODES>,
    nodes_current:          int;
    destination_node:       int;
    destination_path:       Fixed_Size_Array<Vector2, typeof MAX_PATH>;
    entities:               Fixed_Size_Array<Entity, typeof MAX_ENTITIES>;
    sorted_sprites:         Fixed_Size_Array<Sprite, typeof MAX_SPRITES>;
    sprite_data:            Float32Array;
    world:                  World;
    world_grid:             Cell[];
    tile_grid:              int[];
    camera_move_start:      Vector2;
    camera_move_end:        Vector2;
    render_active:          boolean;
    draw_console:           boolean;
    draw_entities:          boolean;
    draw_world_grid:        boolean;
    draw_world_tile:        boolean;
    draw_tiles:             boolean;
    image_projects:         HTMLImageElement;
    texture0:               WebGLTexture;
    sprite_vs:              string;
    sprite_fs:              string;
    sprite_pass:            Sprite_Pass;
    // engine
    console_lines:          Fixed_Size_Array<Message, typeof MAX_CONSOLE_LINES>;
    renderer:               Renderer;
    frame_count:            int;
    frame_end:              number;
    fps:                    int;
    fps_last_update:        number;
    fps_count:              number;
    inputs:                 Inputs;
}
type World = {
    width:          int;
    height:         int;
    tiles:          Tile[];
    grid:           Grid_Value[];
    nodes:          Map_Node[];
    start_position: Vector2;
}
type Tile = {
    /* Pixel coordinates of the tile in the layer ([x,y] format). Don't forget optional layer offsets, if they exist! */
    px:     Vector2;
    /* Pixel coordinates of the tile in the tileset ([x,y] format) */
    src:    Vector2;
}
type Message = string;
type Cell = int;
type Entity = {
    name:           string;
    sprite:         Sprite;
}
enum Node_Type {
    EMPTY,
    PROJECT,
    WARP,
}
type Map_Node = {
    type:               Node_Type;
    grid_position:      Vector2;
    neighbours:         Static_Array<Neighbour, 4>;
    project_id:         int | undefined;
    warp_target:        int; // index into game.nodes
    warp_camera:        Vector2 | undefined;
    tooltip:            string | undefined;
}
type Neighbour = {
    // node: int; // index into game.nodes, order = NESW
    path: Vector2[];
}

// :constants
const ATLAS_URL = "/worldmap/images/atlas.png";
const THUMBNAIL_SIZE: Vector2 = [256, 160];
const CAMERA_START_POSITION: Vector2 = [24, 9];
const CLEAR_COLOR = 0x2080ffff;
const GRID_SIZE = 48;
const TILESET_POSITION : Vector2 = [0, 192];
const MAX_CONSOLE_LINES : number = 128;
const MAX_ENTITIES : number = 16;
const MAX_PROJECTS : number = 16;
const MAX_NODES : number = 32;
const MAX_SPRITES : number = 1024;
const MAX_PATH: number = 8;
const ATLAS_SIZE : Vector2 = [512, 512];
const SPRITE_PASS_INSTANCE_DATA_SIZE = 24;
const DIRECTIONS : Vector2[] = [
    [ +0, -1 ], // .North
    [ +1, +0 ], // .East
    [ +0, +1 ], // .South
    [ -1, +0 ], // .West
];
const enum Direction { NORTH, EAST, SOUTH, WEST }
const enum World_Mode { IDLE, MOVING }
const enum Game_Mode { LOADING, RUNNING }

function COLOR_WHITE(): Color { return [1, 1, 1, 1]; }
function COLOR_RED(): Color { return [1, 0, 0, 1]; }
function COLOR_BLUE(): Color { return [0, 0, 1, 1]; }
function COLOR_GREEN(): Color { return [0, 1, 0, 1]; }
function COLOR_YELLOW(): Color { return [1, 1, 0, 1]; }
function COLOR_PINK(): Color { return [1, 0, 1, 1]; }
function COLOR_GREY(): Color { return [0.5, 0.5, 0.5, 1]; }
function COLOR_BLACK(): Color { return [0, 0, 0, 1]; }

let game: Game;

requestAnimationFrame(update);

function update() {
    try {
        if (!game) {
            if (!__RELEASE__) { console.clear(); }
            // @ts-ignore
            game = {};
            game.game_mode = Game_Mode.LOADING;
            game.world_mode = World_Mode.IDLE;
            game.frame_count = 0;
            game.frame_end = 0;
            game.fps = 0;
            game.fps_last_update = 0;
            game.fps_count = 0;
            game.entities = fixed_array_make(MAX_ENTITIES);
            game.sorted_sprites = fixed_array_make(MAX_SPRITES);
            game.console_lines = fixed_array_make(MAX_CONSOLE_LINES);
            game.destination_path = fixed_array_make(MAX_PATH);
            game.draw_console = location.search.includes("?console");
            game.draw_entities = true;
            game.draw_world_grid = false;
            game.draw_world_tile = true;
            game.draw_tiles = true;
            game.clear_color = hex_to_color(CLEAR_COLOR);

            const [renderer, renderer_ok] = renderer_init();
            if (!renderer_ok) {
                console.error("Couldn't initialize renderer.");
                return;
            }
            game.renderer = renderer;
            renderer_update_camera_matrix_main(game.renderer.camera_main);

            game.inputs = inputs_init();
            game.projects = fixed_array_make(MAX_PROJECTS);
            game.nodes = fixed_array_make(MAX_NODES);

            window.addEventListener("resize", window_on_resize, false);
            window.addEventListener("keydown", inputs_on_key, false);
            window.addEventListener("keyup", inputs_on_key, false);

            if (!__RELEASE__) {
                setInterval(() => {
                    load_image(`${ATLAS_URL}?v=${Date.now()}`).then(image => { game.texture0 = renderer_create_texture(image, game.renderer.gl); });
                }, 1000);
            }

            load_image(ATLAS_URL).then(image => { game.texture0 = renderer_create_texture(image, game.renderer.gl); });
            load_image("/worldmap/images/projects.png").then(image => { game.image_projects = image });
            load_codegen().then((codegen) => {
                game.world = codegen.world;
                game.sprite_vs = codegen.sprite_vs;
                game.sprite_fs = codegen.sprite_fs;
            });
        }

        const gl = game.renderer.gl;
        const now = performance.now();

        inputs_prepare(game.inputs);

        game.renderer.sprites.count = 0;
        if (now >= game.fps_last_update + 1000) {
            game.fps = game.fps_count;
            game.fps_count = 0;
            game.fps_last_update = now;
        }

        if (game.inputs.window_resized) {
            renderer_resize_canvas();
            update_zoom();
        }

        let player_input_move: Vector2 = [0, 0];
        let player_input_confirm = false;
        let player_input_cancel = false;

        // :debug inputs
        if (game.inputs.keys["ShiftLeft"].down) {
            if (!__RELEASE__) {
                if (game.inputs.keys["Backquote"].released || game.inputs.keys["Backquote"].released) {
                    game.draw_console = !game.draw_console;
                }
                if (game.inputs.keys["Digit1"].released) {
                    game.draw_world_grid = !game.draw_world_grid;
                }
                if (game.inputs.keys["Digit2"].released) {
                    game.draw_world_tile = !game.draw_world_tile;
                }
                if (game.inputs.keys["Digit3"].released) {
                    game.draw_entities = !game.draw_entities;
                }
                if (game.inputs.keys["KeyT"].down) {
                    game.renderer.camera_main.zoom = 1;
                    console.log("Zoom reset to 1.");
                }
                if (game.inputs.keys["KeyR"].down) {
                    game.renderer.camera_main.zoom = clamp(game.renderer.camera_main.zoom + 0.1, 1, 16);
                }
                if (game.inputs.keys["KeyF"].down) {
                    game.renderer.camera_main.zoom = clamp(game.renderer.camera_main.zoom - 0.1, 1, 16);
                }
                if (game.inputs.keys["KeyW"].down) {
                    game.renderer.camera_main.position[1] -= 1.0;
                }
                if (game.inputs.keys["KeyS"].down) {
                    game.renderer.camera_main.position[1] += 1.0;
                }
                if (game.inputs.keys["KeyA"].down) {
                    game.renderer.camera_main.position[0] -= 1.0;
                }
                if (game.inputs.keys["KeyD"].down) {
                    game.renderer.camera_main.position[0] += 1.0;
                }
            }
        } else {
            // :player inputs
            if (game.inputs.keys["KeyW"].down || game.inputs.keys["ArrowUp"].down) {
                player_input_move[1] = -1;
            } else if (game.inputs.keys["KeyS"].down || game.inputs.keys["ArrowDown"].down) {
                player_input_move[1] = +1;
            } else if (game.inputs.keys["KeyA"].down || game.inputs.keys["ArrowLeft"].down) {
                player_input_move[0] = -1;
            } else if (game.inputs.keys["KeyD"].down || game.inputs.keys["ArrowRight"].down) {
                player_input_move[0] = +1;
            }

            if (
                (game.inputs.keys["Space"].released || (game.inputs.keys["Space"].down && game.inputs.keys["Space"].reset_next_frame)) ||
                (game.inputs.keys["Enter"].released || (game.inputs.keys["Enter"].down && game.inputs.keys["Enter"].reset_next_frame))
            ) {
                player_input_confirm = true;
            }

            if (
                (game.inputs.keys["Escape"].released || (game.inputs.keys["Escape"].down && game.inputs.keys["Space"].reset_next_frame)) ||
                (game.inputs.keys["Backspace"].released || (game.inputs.keys["Backspace"].down && game.inputs.keys["Enter"].reset_next_frame))
            ) {
                player_input_cancel = true;
            }
        }

        switch (game.game_mode) {
            // :game LOADING
            case Game_Mode.LOADING: {
                let is_loaded = true;
                is_loaded &&= game.world !== undefined;
                is_loaded &&= game.texture0 !== undefined;
                is_loaded &&= game.image_projects !== undefined;
                is_loaded &&= game.sprite_vs !== undefined;
                is_loaded &&= game.sprite_fs !== undefined;
                if (is_loaded) {
                    game.sprite_pass = renderer_make_sprite_pass(game.sprite_vs, game.sprite_fs, game.renderer.gl);
                    // :init world
                    game.tile_grid = Array(game.world.width+1 * game.world.height+1);
                    game.world_grid = Array(game.world.width * game.world.height);
                    assert(game.world.grid.length > 0 && game.world.grid.length === game.world.height * game.world.width, "Invalid world!");
                    for (let y = 0; y < game.world.height; y++) {
                        for (let x = 0; x < game.world.width; x++) {
                            const grid_index = grid_position_to_index(x, y, game.world.width);
                            game.world_grid[grid_index] = game.world.grid[grid_index];
                        }
                    }
                    for (let node_index = 0; node_index < game.world.nodes.length; node_index++) {
                        const node = game.world.nodes[node_index];
                        fixed_array_add(game.nodes, node);

                        if (vector2_equal(node.grid_position, game.world.start_position)) {
                            game.nodes_current = node_index;
                        }
                    }
                    for (let project_index = 0; project_index < PROJECTS.length; project_index++) {
                        fixed_array_add(game.projects, PROJECTS[project_index]);
                    }

                    game.player = fixed_array_add(game.entities, {
                        name: "PLAYER",
                        sprite: {
                            color: COLOR_WHITE(),
                            position: grid_position_center(game.nodes.data[game.nodes_current].grid_position),
                            size: [16, 16],
                            scale: [1, 1],
                            offset: [0, -2],
                            rotation: 0,
                            texture_size: [16, 16],
                            texture_position: [32, 0],
                            z_index: 9,
                        },
                    });

                    game.renderer.camera_main.position = vector2_multiply_float(CAMERA_START_POSITION, GRID_SIZE);
                    renderer_resize_canvas();
                    update_zoom();

                    ui_label_show(game.renderer.ui_up);
                    ui_label_show(game.renderer.ui_right);
                    ui_label_show(game.renderer.ui_down);
                    ui_label_show(game.renderer.ui_left);
                    game.inputs.window_resized = true;
                    game.render_active = true;
                    game.game_mode = Game_Mode.RUNNING;
                }
            } break;
            // :game RUNNING
            case Game_Mode.RUNNING: {
                {
                    // TODO: perf
                    const current_node = game.nodes.data[game.nodes_current];
                    const window_position = world_to_window_position(vector2_multiply_float(current_node.grid_position, GRID_SIZE));
                    const root = game.renderer.ui_node_action.element_root;
                    const margin = 10;
                    const rect = root.getClientRects()[0];
                    const max_x = game.renderer.window_size[0] - rect.width  - margin;
                    const max_y = game.renderer.window_size[1] - rect.height - margin;
                    const x = clamp(window_position[0] - rect.width * 0.5, margin, max_x);
                    const y = clamp(window_position[1] - rect.height - 12 - 8*game.renderer.camera_main.zoom, margin, max_y);
                    root.style.left = `${x}px`;
                    root.style.top  = `${y}px`;
                }

                switch (game.world_mode) {
                    // :world IDLE
                    case World_Mode.IDLE: {
                        if (!vector2_equal(player_input_move, [0, 0])) {
                            const current_node = game.nodes.data[game.nodes_current];
                            const direction = vector_to_direction(player_input_move);
                            const destination = current_node.neighbours[direction];
                            if (destination.path.length > 0) {
                                game.destination_node = find_node_at_position(destination.path[destination.path.length-1]);
                                assert(game.destination_node != -1);
                                game.destination_path.count = 0;
                                fixed_array_add(game.destination_path, current_node.grid_position);
                                if (destination.path.length > 0) {
                                    for (let point_index = 0; point_index < destination.path.length; point_index++) {
                                        fixed_array_add(game.destination_path, destination.path[point_index]);
                                    }
                                }
                                ui_panel_hide(game.renderer.ui_node_project);
                                ui_label_hide(game.renderer.ui_confirm);
                                ui_label_hide(game.renderer.ui_node_action);
                                game.world_mode = World_Mode.MOVING;
                                game.world_mode_timer = now;
                            } else {
                                console.warn("Can't move in this direction: " + direction);
                            }
                        }

                        const node = game.nodes.data[game.nodes_current];
                        const project = game.projects.data[node.project_id];
                        const project_panel_opened = !game.renderer.ui_node_project.element_root.classList.contains("hide");

                        if (player_input_cancel) {
                            if (project_panel_opened) {
                                ui_panel_hide(game.renderer.ui_node_project);
                                ui_label_show(game.renderer.ui_node_action);
                                ui_label_show(game.renderer.ui_confirm, ui_get_node_label(node));
                            }
                        }

                        if (player_input_confirm) {
                            switch (node.type) {
                                case Node_Type.EMPTY: { } break;
                                case Node_Type.PROJECT: {
                                    if (project_panel_opened) {
                                        ui_panel_hide(game.renderer.ui_node_project);
                                        ui_label_show(game.renderer.ui_node_action);
                                        ui_label_show(game.renderer.ui_confirm, ui_get_node_label(node));
                                    } else {
                                        const content = [];
                                        for (let i = 0; i < project.screenshots_count; i++) {
                                            content.push(`<img src="${generate_project_image_url(project, i+1)}" alt="A Screenshot of the app (${i+1} of ${project.screenshots_count})." />`);
                                        }
                                        for (let i = 0; i < project.description.length; i++) {
                                            content.push(project.description[i]);
                                        }
                                        content.push("<ul>");
                                        for (let i = 0; i < project.bullet_points.length; i++) {
                                            content.push(`<li> - ${project.bullet_points[i]}</li>`);
                                        }
                                        content.push("</ul>");

                                        ui_panel_show(game.renderer.ui_node_project, project.name, content.join(""));
                                        ui_label_hide(game.renderer.ui_node_action);
                                        ui_label_show(game.renderer.ui_confirm, "Close");
                                    }
                                } break;
                                case Node_Type.WARP: {
                                    const current_node = game.nodes.data[game.nodes_current];
                                    const destination_node = game.nodes.data[node.warp_target];
                                    game.destination_node = node.warp_target;
                                    game.destination_path.count = 0;
                                    fixed_array_add(game.destination_path, current_node.grid_position);
                                    fixed_array_add(game.destination_path, destination_node.grid_position);

                                    game.camera_move_start = game.renderer.camera_main.position;
                                    game.camera_move_end   = vector2_multiply_float(current_node.warp_camera, GRID_SIZE);
                                    ui_label_hide(game.renderer.ui_confirm);
                                    ui_label_hide(game.renderer.ui_node_action);

                                    game.world_mode = World_Mode.MOVING;
                                    game.world_mode_timer = now;
                                } break;
                            }
                        }
                    } break;
                    // :world MOVING
                    case World_Mode.MOVING: {
                        const current_node = game.nodes.data[game.nodes_current];
                        const destination_node = game.nodes.data[game.destination_node];
                        const is_warp = current_node.type === Node_Type.WARP && destination_node.type == Node_Type.WARP;

                        const distance = manhathan_distance(game.destination_path.data[0], game.destination_path.data[game.destination_path.count-1]);
                        let duration = 200 * distance;
                        if (is_warp) { duration *= 0.5; }
                        const end = game.world_mode_timer + duration;
                        const remaining = end - now;
                        const progress = clamp(1.0 - (1.0 / (duration / remaining)), 0, 1);

                        const [current, next, step_progress] = lerp_indices(game.destination_path.count-1, progress);
                        game.player.sprite.position = vector2_lerp(grid_position_center(game.destination_path.data[current]), grid_position_center(game.destination_path.data[next]), step_progress);

                        if (is_warp) {
                            // TODO: better player animation
                            game.player.sprite.scale = [0, 0];
                            game.renderer.camera_main.position = vector2_lerp(game.camera_move_start, game.camera_move_end, progress);
                        }

                        if (progress === 1) {
                            game.nodes_current = game.destination_node;
                            const node = game.nodes.data[game.nodes_current];
                            if (is_warp) {
                                game.player.sprite.scale = [1, 1];
                            }

                            const label = ui_get_node_label(node);
                            if (label !== "") {
                                ui_label_show(game.renderer.ui_confirm, label);
                                if (node.project_id) {
                                    ui_label_node_show(game.renderer.ui_node_action, label, generate_project_thumbnail_url(node.project_id));
                                } else {
                                    ui_label_node_show(game.renderer.ui_node_action, label, "");
                                }
                                ui_label_show(game.renderer.ui_node_action, label);
                            }
                            game.world_mode = World_Mode.IDLE;
                        }
                    } break;
                }
            } break;
        }

        // :render
        render: {
            if (!game.render_active) { break render; }

            renderer_update_camera_matrix_main(game.renderer.camera_main);

            // :render entities
            if (game.draw_entities) {
                for (let entity_index = 0; entity_index < game.entities.count; entity_index++) {
                    const entity = game.entities.data[entity_index];
                    fixed_array_add(game.renderer.sprites, entity.sprite);
                }
            }
            // :render nodes
            for (let node_index = 0; node_index < game.nodes.count; node_index++) {
                const node = game.nodes.data[node_index];
                let texture_position: Vector2 = [48, 0];
                let texture_size    : Vector2 = [16, 16];
                switch (node.type) {
                    case Node_Type.EMPTY: { } break;
                    case Node_Type.PROJECT: {
                        texture_position = [64, 0];
                    } break;
                    case Node_Type.WARP: {
                        texture_position = [0, 16];
                        texture_size     = [32, 32];
                    } break;
                }
                const sprite: Sprite = {
                    color:              COLOR_WHITE(),
                    position:           grid_position_center(node.grid_position),
                    offset:             [0, 0],
                    size:               texture_size,
                    scale:              [1, 1],
                    rotation:           0,
                    texture_size:       texture_size,
                    texture_position:   texture_position,
                    z_index:            5,
                };
                fixed_array_add(game.renderer.sprites, sprite);
            }
            // :render world grid
            render_world_grid: {
                if (!game.draw_world_grid) { break render_world_grid; }
                if (!game.world_grid) { break render_world_grid; }

                for (let world_cell_index = 0; world_cell_index < game.world_grid.length; world_cell_index++) {
                    const world_cell = game.world_grid[world_cell_index];
                    const world_position = grid_index_to_position(world_cell_index, game.world.width);
                    if (world_cell === 0) { continue; }

                    let color = COLOR_BLACK();
                    if ((world_position[0] + world_position[1]) % 2) { color[1] = 0.2; }
                    color[3] *= 0.3;
                    const sprite: Sprite = {
                        color:              color,
                        position:           [world_position[0]*GRID_SIZE, world_position[1]*GRID_SIZE],
                        offset:             [0, 0],
                        size:               [GRID_SIZE, GRID_SIZE],
                        scale:              [1, 1],
                        rotation:           0,
                        texture_size:       [16, 16],
                        // texture_position:   [48, 96+16],
                        texture_position:   [0, 0],
                        z_index:            2,
                    };
                    fixed_array_add(game.renderer.sprites, sprite);
                }
            }
            // :render world tiles
            render_tiles: {
                if (!game.draw_world_tile) { break render_tiles; }
                if (!game.tile_grid) { break render_tiles; }

                const color: Vector4 = COLOR_WHITE();
                const tile_grid_width = game.world.width + 1;
                const tile_grid_height = game.world.height + 1;
                const tile_grid_size = tile_grid_width * tile_grid_height;
                for (let tile_cell_index = 0; tile_cell_index < tile_grid_size; tile_cell_index++) {
                    const tile_position = grid_index_to_position(tile_cell_index, tile_grid_width);

                    const tile_value = calculate_tile_value(tile_position);
                    // console.log("tile_position", tile_position, tile_value);
                    if (tile_value === 0) { continue; }

                    const tile_index = TILE_VALUES.indexOf(tile_value);
                    assert(tile_index > -1, "Invalid tile_index.");
                    const tile_texture_position = grid_index_to_position(tile_index, AUTO_TILE_SIZE[0]);

                    const texture_position: Vector2 = [
                        tile_texture_position[0]*GRID_SIZE + TILESET_POSITION[0],
                        tile_texture_position[1]*GRID_SIZE + TILESET_POSITION[1],
                    ];

                    const sprite: Sprite = {
                        color:              color,
                        position:           [tile_position[0]*GRID_SIZE - GRID_SIZE/2, tile_position[1]*GRID_SIZE - GRID_SIZE/2],
                        offset:             [0, 0],
                        size:               [GRID_SIZE, GRID_SIZE],
                        scale:              [1, 1],
                        rotation:           0,
                        texture_size:       [GRID_SIZE, GRID_SIZE],
                        texture_position:   texture_position,
                        z_index:            1,
                    }
                    fixed_array_add(game.renderer.sprites, sprite);
                }
            }
            // :render tiles
            if (game.draw_tiles) {
                for (let tile_index = 0; tile_index < game.world.tiles.length; tile_index++) {
                    const tile = game.world.tiles[tile_index];

                    const sprite: Sprite = {
                        color:              COLOR_WHITE(),
                        position:           tile.px,
                        offset:             [0, 0],
                        size:               [GRID_SIZE, GRID_SIZE],
                        scale:              [1, 1],
                        rotation:           0,
                        texture_size:       [GRID_SIZE, GRID_SIZE],
                        texture_position:   tile.src,
                        z_index:            3,
                    };
                    fixed_array_add(game.renderer.sprites, sprite);
                }
            }
            // :render console lines
            // FIXME: don't do this in __RELEASE__
            game.console_lines.count = 0;
            if (game.draw_console) {
                ui_push_console_line("fps:                " + game.fps.toFixed(0));
                ui_push_console_line("window_size:        " + game.renderer.window_size);
                ui_push_console_line("pixel_ratio:        " + game.renderer.pixel_ratio);
                ui_push_console_line("camera_position:    " + game.renderer.camera_main.position);
                ui_push_console_line("camera_zoom:        " + game.renderer.camera_main.zoom);
                ui_push_console_line("entities:           " + game.entities.count);
                ui_push_console_line("player_position:    " + game.player.sprite.position);
                ui_push_console_line("world_draw:         " + game.draw_world_grid);
                if (game.draw_world_grid) {
                    ui_push_console_line("world_count:        " + game.world_grid.length);
                }
                ui_push_console_line("sprites_count:      " + game.renderer.sprites.count);
                ui_push_console_line("tiles_draw:         " + game.draw_world_tile);
                if (game.draw_world_tile) {
                    ui_push_console_line("tiles_count:        " + game.tile_grid.length);
                }
                ui_push_console_line("nodes_current:      " + game.nodes_current);
                // ui_push_console_line("nodes:              ");
                // for (let node_index = 0; node_index < game.nodes.count; node_index++) {
                //     const node = game.nodes.data[node_index];
                //     ui_push_console_line((node_index === game.nodes_current ? "* " : "  ") + node_index + " " + (Node_Type[node.type]) + " " + JSON.stringify(node));
                // }
                // ui_push_console_line("projects:             ");
                // for (let project_index = 0; project_index < game.projects.count; project_index++) {
                //     const project = game.projects.data[project_index];
                //     ui_push_console_line("  " + project_index + " - " + project.id + " name: " + project.name);
                // }
            }
            let console_lines = "";
            if (game.draw_console) {
                for (let line_index = 0; line_index < game.console_lines.count; line_index++) {
                    console_lines += game.console_lines.data[line_index] + "\n";
                }
            }
            ui_set_element_class(game.renderer.ui_console, "open", game.draw_console);
            game.renderer.ui_console.innerHTML = console_lines;

            if (game.inputs.window_resized) {
                gl.viewport(0, 0, game.renderer.window_size[0]*game.renderer.pixel_ratio, game.renderer.window_size[1]*game.renderer.pixel_ratio);
            }

            gl.clearColor(game.clear_color[0], game.clear_color[1], game.clear_color[2], game.clear_color[3]);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            if (game.sprite_pass) {
                game.sorted_sprites.count = game.renderer.sprites.count;
                for (let sprite_index = 0; sprite_index < game.sorted_sprites.count; sprite_index++) {
                    game.sorted_sprites.data[sprite_index] = game.renderer.sprites.data[sprite_index];
                }
                game.sorted_sprites.data.sort(sort_by_z_index);

                // TODO: Don't recreate this every frame
                game.sprite_data = new Float32Array(MAX_SPRITES * SPRITE_PASS_INSTANCE_DATA_SIZE);
                const pixel_size : Vector2 = [
                    1 / ATLAS_SIZE[0],
                    1 / ATLAS_SIZE[1],
                ];
                // :render sprites
                for (let sprite_index = 0; sprite_index < game.sorted_sprites.count; sprite_index++) {
                    const sprite = game.sorted_sprites.data[sprite_index];
                    if (sprite === undefined) { break; } // We have reached the end of the sprites (uninitialized are at the bottom)
                    let offset = SPRITE_PASS_INSTANCE_DATA_SIZE * sprite_index;

                    game.sprite_data.set(sprite.color, offset);
                    offset += 4;

                    let matrix = matrix4_identity();
                    matrix4_multiply(matrix, matrix4_make_scale(sprite.size[0] * sprite.scale[0], sprite.size[1] * sprite.scale[1], 0));
                    matrix4_multiply(matrix, matrix4_make_translation(sprite.position[0] + sprite.offset[0], sprite.position[1] + sprite.offset[1], 0));
                    // matrix = matrix4_rotate_z(matrix, sprite.rotation);
                    game.sprite_data.set(matrix, offset);
                    offset += 16;

                    const texture_position = [
                        sprite.texture_position[0] * pixel_size[0],
                        sprite.texture_position[1] * pixel_size[1],
                    ];
                    game.sprite_data.set(texture_position, offset);
                    offset += 2;

                    const texture_size = [
                        sprite.texture_size[0] * pixel_size[0],
                        sprite.texture_size[1] * pixel_size[1],
                    ];
                    game.sprite_data.set(texture_size, offset);
                    offset += 2;
                }

                gl.useProgram(game.sprite_pass.program);
                gl.uniformMatrix4fv(game.sprite_pass.location_matrix, false, game.renderer.camera_main.view_projection_matrix);
                gl.bindVertexArray(game.sprite_pass.vao);
                gl.bindTexture(gl.TEXTURE_2D, game.texture0);
                gl.bindBuffer(gl.ARRAY_BUFFER, game.sprite_pass.instance_data);
                gl.bufferData(gl.ARRAY_BUFFER, game.sprite_data, gl.STREAM_DRAW);
                gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, game.sprite_pass.indices as GLintptr, game.sorted_sprites.count);
            }
        }

        // TODO: maybe we need to reset the keys state if we lose focus of the window?
        inputs_reset(game.inputs);

        game.frame_count += 1;
        game.fps_count += 1;
        game.frame_end = performance.now();

        requestAnimationFrame(update);
    } catch(e) {
        if (!__RELEASE__) {
            document.body.style.borderTop = "4px solid red";
        }
        // TODO: better error handling for release
        console.error(e);
    }
}

function load_codegen(): Promise<Codegen> {
    if (typeof __CODEGEN__ === "undefined") {
        if (!__RELEASE__) {
            console.log("location.reload");
            window.location.reload();
        }
        return Promise.reject("__CODEGEN__ isn't defined.");
    }
    return Promise.resolve(__CODEGEN__);
}
function update_zoom(): void {
    assert(game.renderer.window_size[0] > 0 || game.renderer.window_size[1] > 0, "Invalid window size.");
    const smallest = Math.min(game.renderer.window_size[0], game.renderer.window_size[1]);
    const threshold = 360;
    game.renderer.camera_main.zoom = Math.max(1.0, Math.floor(smallest / threshold));
}

// :renderer
type Renderer = {
    gl:                 WebGL2RenderingContext;
    offscreen:          CanvasRenderingContext2D;
    ui_root:            HTMLDivElement;
    ui_console:         HTMLPreElement;
    ui_node_project:    UI_Panel;
    ui_up:              UI_Label;
    ui_right:           UI_Label;
    ui_down:            UI_Label;
    ui_left:            UI_Label;
    ui_confirm:         UI_Label;
    ui_cancel:          UI_Label;
    ui_node_action:     UI_Label_Node;
    camera_main:        Camera_Orthographic;
    window_size:        Vector2;
    pixel_ratio:        float;
    sprites:            Fixed_Size_Array<Sprite, typeof MAX_SPRITES>;
}
type Sprite_Pass = {
    program:                WebGLProgram;
    vao:                    WebGLVertexArrayObject;
    indices:                WebGLBuffer;
    instance_data:          WebGLBuffer;
    location_matrix:        WebGLUniformLocation;
}
type Camera_Orthographic = {
    position:                   Vector2;
    rotation:                   number;
    zoom:                       number;
    projection_matrix:          Matrix4;
    transform_matrix:           Matrix4;
    view_matrix:                Matrix4;
    view_projection_matrix:     Matrix4;
}
type Sprite = {
    position:           Vector2;
    offset:             Vector2;
    size:               Vector2;
    scale:              Vector2;
    rotation:           float;
    color:              Color;
    texture_size:       Vector2;
    texture_position:   Vector2;
    z_index:            int;
}
const CAMERA_DEFAULT: Camera_Orthographic = {
    zoom: 0,
    rotation: 0,
    position: [0, 0],
    projection_matrix: matrix4_identity(),
    transform_matrix: matrix4_identity(),
    view_matrix: matrix4_identity(),
    view_projection_matrix: matrix4_identity(),
};
function renderer_resize_canvas() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    let final_width = width;
    let final_height = height;
    if (width % 2)  { final_width -= 1; }
    if (height % 2) { final_height -= 1; }

    game.renderer.pixel_ratio = window.devicePixelRatio;
    if (!Number.isInteger(window.devicePixelRatio)) { // Default to pixel_ratio of 2 in case we have some fucky wucky floating number ratio for now...
        game.renderer.pixel_ratio = 2;
    }
    game.renderer.window_size[0] = final_width;
    game.renderer.window_size[1] = final_height;
    (game.renderer.gl.canvas as HTMLCanvasElement).style.width = `${final_width}px`;
    (game.renderer.gl.canvas as HTMLCanvasElement).style.height = `${final_height}px`;
    game.renderer.gl.canvas.width = final_width * game.renderer.pixel_ratio;
    game.renderer.gl.canvas.height = final_height * game.renderer.pixel_ratio;

    if (!__RELEASE__) {
        console.log("window_size", game.renderer.window_size, "pixel_ratio", game.renderer.pixel_ratio);
    }
}
function renderer_init(): [Renderer, true] | [null, false] {
    const canvas = document.querySelector("canvas");
    assert(canvas !== null, "Canvas not found");

    const _gl = canvas.getContext("webgl2");
    if (_gl === null) {
        return [null, false];
    }

    const offscreen = ui_create_element<HTMLCanvasElement>(document.body, `<canvas id="offscreen"></canvas>`)
    const offscreen_context = offscreen.getContext("2d");
    if (offscreen_context === null) {
        return [null, false];
    }

    // TODO: create ui_root and canvas here
    const ui_root = document.querySelector("#ui_root") as HTMLDivElement;
    assert(ui_root !== undefined);

    ui_create_element(ui_root, `
        <style nonce="style">
            .atlas_icon {
                background-image: url("${ATLAS_URL}");
            }
        </style>
    `);

    const up_root = ui_create_element<HTMLLabelElement>(ui_root, `
        <label class="hud_label anchor_bottom no_label hide up" for="up">
            <span class="content">
                <span class="label"></span>
                <button class="hud_icon atlas_icon icon_up" aria-label="Move: up"></button>
            </span>
        </label>
    `);
    const up_button = up_root.querySelector(".content button") as HTMLButtonElement;
    up_button.addEventListener("click", input_send_key.bind(null, Keyboard_Key.ArrowUp));
    const ui_up: UI_Label = { element_root: up_root, element_button: up_button, element_label: up_root.querySelector(".content .label") };

    const right_root = ui_create_element<HTMLLabelElement>(ui_root, `
        <label class="hud_label anchor_bottom no_label hide right">
            <span class="content">
                <span class="label"></span>
                <button class="hud_icon atlas_icon icon_right" aria-label="Move: right"></button>
            </span>
        </label>
    `);
    const right_button = right_root.querySelector(".content button") as HTMLButtonElement;
    right_button.addEventListener("click", input_send_key.bind(null, Keyboard_Key.ArrowRight));
    const ui_right: UI_Label = { element_root: right_root, element_button: right_button, element_label: right_root.querySelector(".content .label") };

    const down_root = ui_create_element<HTMLLabelElement>(ui_root, `
        <label class="hud_label anchor_bottom no_label hide down">
            <span class="content">
                <span class="label"></span>
                <button class="hud_icon atlas_icon icon_down" aria-label="Move: down"></button>
            </span>
        </label>
    `);
    const down_button = down_root.querySelector(".content button") as HTMLButtonElement;
    down_button.addEventListener("click", input_send_key.bind(null, Keyboard_Key.ArrowDown));
    const ui_down: UI_Label = { element_root: down_root, element_button: down_button, element_label: down_root.querySelector(".content .label") };

    const left_root = ui_create_element<HTMLLabelElement>(ui_root, `
        <label class="hud_label anchor_bottom no_label hide left">
            <span class="content">
                <span class="label"></span>
                <button class="hud_icon atlas_icon icon_left" aria-label="Move: left"></button>
            </span>
        </label>
    `);
    const left_button = left_root.querySelector(".content button") as HTMLButtonElement;
    left_button.addEventListener("click", input_send_key.bind(null, Keyboard_Key.ArrowLeft));
    const ui_left: UI_Label = { element_root: left_root, element_button: left_button, element_label: left_root.querySelector(".content .label") };

    const confirm_root = ui_create_element<HTMLLabelElement>(ui_root, `
        <label class="hud_label hide confirm">
            <span class="content">
                <span class="label"></span>
                <button class="hud_icon atlas_icon icon_confirm" aria-label="Confirm" id="confirm"></button>
            </span>
        </label>
    `);
    const confirm_button = confirm_root.querySelector(".content button") as HTMLButtonElement;
    confirm_button.addEventListener("click", () => { input_send_key(Keyboard_Key.Enter); });
    const ui_confirm: UI_Label = { element_root: confirm_root, element_button: confirm_button, element_label: confirm_root.querySelector(".content .label") };

    const cancel_root = ui_create_element<HTMLLabelElement>(ui_root, `
        <label class="hud_label hide cancel">
            <span class="content">
                <span class="label"></span>
                <button class="hud_icon atlas_icon icon_cancel" aria-label="Confirm" id="cancel"></button>
            </span>
        </label>
    `);
    const cancel_button = cancel_root.querySelector(".content button") as HTMLButtonElement;
    cancel_button.addEventListener("click", () => { input_send_key(Keyboard_Key.Escape); });
    const ui_cancel: UI_Label = { element_root: cancel_root, element_button: cancel_button, element_label: cancel_root.querySelector(".content .label") };

    const node_action_root = ui_create_element<HTMLLabelElement>(ui_root, `
        <label class="hud_label anchor_bottom node_action hide">
            <img />
            <span class="content">
                <span class="label"></span>
                <button class="hud_icon atlas_icon icon_confirm"></button>
            </span>
        </label>
    `);
    const node_action_button = node_action_root.querySelector(".content button") as HTMLButtonElement;
    node_action_button.addEventListener("click", input_send_key.bind(null, Keyboard_Key.Enter));
    const node_action_image = node_action_root.querySelector("img");
    node_action_image.width = THUMBNAIL_SIZE[0]*0.5;
    node_action_image.height = THUMBNAIL_SIZE[1]*0.5;
    const ui_node_action: UI_Label_Node = { element_root: node_action_root, element_button: node_action_button, element_label: node_action_root.querySelector(".content .label"), element_image: node_action_image };
    assert(ui_node_action.element_root !== undefined);
    assert(ui_node_action.element_button !== undefined);
    assert(ui_node_action.element_label !== undefined);
    assert(ui_node_action.element_image !== undefined);

    // TODO: disable this in __RELEASE__
    const ui_console = ui_create_element<HTMLPreElement>(ui_root, `<pre class="ui_console"></pre>`);

    const ui_node_project = ui_create_panel(ui_root, function ui_node_project_close() {
        ui_panel_hide(ui_node_project);
        this.blur();
    });

    const renderer: Renderer = {
        camera_main:        CAMERA_DEFAULT,
        sprites:            fixed_array_make(MAX_SPRITES),
        window_size:        [0, 0],
        pixel_ratio:        1.0,
        gl:                 _gl,
        offscreen:          offscreen_context,
        ui_root:            ui_root,
        ui_console:         ui_console,
        ui_node_project:    ui_node_project,
        ui_up:              ui_up,
        ui_right:           ui_right,
        ui_down:            ui_down,
        ui_left:            ui_left,
        ui_confirm:         ui_confirm,
        ui_cancel:          ui_cancel,
        ui_node_action:     ui_node_action,
    };

    _gl.enable(_gl.BLEND);
    _gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE_MINUS_SRC_ALPHA);
    _gl.getExtension("OES_standard_derivatives");

    return [renderer, true];
}
function renderer_make_sprite_pass(sprite_vs: string, sprite_fs: string, gl: WebGL2RenderingContext): Sprite_Pass {
    // @ts-ignore
    const pass: Sprite_Pass = {};
    const [program, program_ok] = renderer_create_program(gl, sprite_vs, sprite_fs);
    if (program_ok) {
        pass.program = program;
    }

    const vao = gl.createVertexArray();
    assert(vao !== null, "Couldn't create VAO.");
    pass.vao = vao;
    gl.bindVertexArray(vao);

    {
        const vertices = new Float32Array([
            // position     // uv
            +0.5, +0.5,     1, 1,
            -0.5, +0.5,     0, 1,
            -0.5, -0.5,     0, 0,
            +0.5, -0.5,     1, 0,
        ]);
        const buffer = gl.createBuffer();
        assert(buffer !== null, "Couldn't create vertices buffer.");
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const location_position = gl.getAttribLocation(pass.program, "position");
        assert(location_position != -1, "Couldn't get attrib location position.");
        gl.enableVertexAttribArray(location_position);
        gl.vertexAttribPointer(location_position, 2, gl.FLOAT, false, 16, 0);

        const location_uv = gl.getAttribLocation(pass.program, "uv");
        assert(location_uv != -1, "Couldn't get attrib location uv.");
        gl.enableVertexAttribArray(location_uv);
        gl.vertexAttribPointer(location_uv, 2, gl.FLOAT, true, 16, 8);
    }

    // :sprite_pass instance_data
    {
        const instance_data = gl.createBuffer();
        assert(instance_data !== null, "Couldn't create instance_data buffer.");
        pass.instance_data = instance_data;
        gl.bindBuffer(gl.ARRAY_BUFFER, pass.instance_data);

        const STRIDE = SPRITE_PASS_INSTANCE_DATA_SIZE*4;
        let offset = 0;

        const location_color = gl.getAttribLocation(pass.program, "i_color");
        assert(location_color != -1, "Couldn't get attrib location i_color.");
        gl.enableVertexAttribArray(location_color);
        gl.vertexAttribPointer(location_color, 4, gl.FLOAT, false, STRIDE, offset*4);
        gl.vertexAttribDivisor(location_color, 1);
        offset += 4;

        const location_matrix0 = gl.getAttribLocation(pass.program, "i_matrix0");
        assert(location_matrix0 != -1, "Couldn't get attrib location i_matrix0.");
        gl.enableVertexAttribArray(location_matrix0);
        gl.vertexAttribPointer(location_matrix0, 4, gl.FLOAT, false, STRIDE, offset*4);
        gl.vertexAttribDivisor(location_matrix0, 1);
        offset += 4;
        const location_matrix1 = gl.getAttribLocation(pass.program, "i_matrix1");
        assert(location_matrix1 != -1, "Couldn't get attrib location i_matrix1.");
        gl.enableVertexAttribArray(location_matrix1);
        gl.vertexAttribPointer(location_matrix1, 4, gl.FLOAT, false, STRIDE, offset*4);
        gl.vertexAttribDivisor(location_matrix1, 1);
        offset += 4;
        const location_matrix2 = gl.getAttribLocation(pass.program, "i_matrix2");
        // assert(location_matrix2 != -1, "Couldn't get attrib location i_matrix2");
        gl.enableVertexAttribArray(location_matrix2);
        gl.vertexAttribPointer(location_matrix2, 4, gl.FLOAT, false, STRIDE, offset*4);
        gl.vertexAttribDivisor(location_matrix2, 1);
        offset += 4;
        const location_matrix3 = gl.getAttribLocation(pass.program, "i_matrix3");
        // assert(location_matrix3 != -1, "Couldn't get attrib location i_matrix3");
        gl.enableVertexAttribArray(location_matrix3);
        gl.vertexAttribPointer(location_matrix3, 4, gl.FLOAT, false, STRIDE, offset*4);
        gl.vertexAttribDivisor(location_matrix3, 1);
        offset += 4;

        const location_tex_position = gl.getAttribLocation(pass.program, "i_tex_position");
        assert(location_tex_position != -1, "Couldn't get attrib location i_tex_position.");
        gl.enableVertexAttribArray(location_tex_position);
        gl.vertexAttribPointer(location_tex_position, 2, gl.FLOAT, false, STRIDE, offset*4);
        gl.vertexAttribDivisor(location_tex_position, 1);
        offset += 2;

        const location_tex_size = gl.getAttribLocation(pass.program, "i_tex_size");
        assert(location_tex_size != -1, "Couldn't get attrib location i_tex_size.");
        gl.enableVertexAttribArray(location_tex_size);
        gl.vertexAttribPointer(location_tex_size, 2, gl.FLOAT, false, STRIDE, offset*4);
        gl.vertexAttribDivisor(location_tex_size, 1);
        offset += 2;

        assert(SPRITE_PASS_INSTANCE_DATA_SIZE === offset, "SPRITE_PASS_INSTANCE_DATA_SIZE doesn't match the attributes byte size.");
    }

    // :sprite_pass uniform
    {
        const location_matrix = gl.getUniformLocation(pass.program, "u_matrix");
        assert(location_matrix !== null, "Couldn't get uniform location u_matrix.");
        pass.location_matrix = location_matrix;
    }

    {
        const indices = new Uint8Array([
            0, 1, 2,
            0, 2, 3,
        ]);
        const indices_buffer = gl.createBuffer();
        assert(indices_buffer != null, "Couldn't create indices_buffer.");
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        pass.indices = indices_buffer;
    }

    gl.bindVertexArray(null);

    return pass;
}
function renderer_create_texture(image: HTMLImageElement, gl: WebGL2RenderingContext): WebGLTexture {
    const texture = gl.createTexture();
    assert(texture !== null, "Couldn't create texture.");

    gl.activeTexture(gl.TEXTURE0);
    // gl.pixelStorei  (gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture  (gl.TEXTURE_2D, texture);
    gl.texImage2D   (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
}
function renderer_create_program(gl: WebGL2RenderingContext, vs: string, fs: string): [WebGLProgram, true] | [null, false] {
    const vs_shader = gl.createShader(gl.VERTEX_SHADER);
    assert(vs_shader !== null, "Couldn't create vertex shader.");
    gl.shaderSource(vs_shader, vs.trim());
    gl.compileShader(vs_shader);
    const vertex_shader_status : GLboolean = gl.getShaderParameter(vs_shader, gl.COMPILE_STATUS);
    assert(vertex_shader_status, gl.getShaderInfoLog(vs_shader));

    const fs_shader = gl.createShader(gl.FRAGMENT_SHADER);
    assert(fs_shader !== null, "Couldn't create fragment shader.");
    gl.shaderSource(fs_shader, fs.trim());
    gl.compileShader(fs_shader);
    const fragment_shader_status : GLboolean = gl.getShaderParameter(fs_shader, gl.COMPILE_STATUS);
    assert(fragment_shader_status, gl.getShaderInfoLog(fs_shader));

    const program = gl.createProgram();
    assert(program !== null, "Couldn't create program.");
    gl.attachShader(program, vs_shader);
    gl.attachShader(program, fs_shader);
    gl.linkProgram(program);
    const program_status : GLboolean = gl.getProgramParameter(program, gl.LINK_STATUS);
    assert(program_status, gl.getProgramInfoLog(program));

    return [program, true];
}

function renderer_update_camera_matrix_main(camera: Camera_Orthographic): void {
    const s = [
        game.renderer.window_size[0] * 0.5,
        game.renderer.window_size[1] * 0.5,
    ];
    camera.projection_matrix = matrix4_make_orthographic_projection(
        -s[0], +s[0],
        +s[1], -s[1],
        -1,    +1,
    );

    camera.transform_matrix = matrix4_identity();
    matrix4_multiply(camera.transform_matrix, matrix4_make_translation(-camera.position[0], -camera.position[1], 0));
    matrix4_multiply(camera.transform_matrix, matrix4_make_scale(camera.zoom, camera.zoom, 0));

    camera.view_matrix = (camera.transform_matrix);
    camera.view_projection_matrix = matrix4_identity();
    matrix4_multiply(camera.view_projection_matrix, camera.view_matrix);
    matrix4_multiply(camera.view_projection_matrix, camera.projection_matrix);
}

// :inputs
type Inputs = {
    quit_requested:             boolean;
    window_resized:             boolean;
    window_is_focused:          boolean;
    keyboard_was_used:          boolean;
    keys:                       { [key in Keyboard_Key]: Key_State };
    mouse_was_used:             boolean;
    mouse_keys:                 { [key in Mouse_Key]: Key_State };
    mouse_position:             Vector2;
    mouse_wheel:                Vector2;
    mouse_moved:                boolean;
    controller_was_used:        boolean;
    // controllers:                [MAX_CONTROLLERS]Controller_State;
}
type Key_State = {
    pressed:            boolean; // The key was pressed this frame
    down:               boolean; // The key is down
    released:           boolean; // The key was released this frame
    triggered:          boolean; // The key was triggered from an external event (ie: DOM event)
    reset_next_frame:   boolean; // The key will be reset at the end of the frame
}
// I really hate that i have to do this, but this is JavaScript so here we go...
enum Keyboard_Key {
    "Digit0" = "Digit0",
    "Digit1" = "Digit1",
    "Digit2" = "Digit2",
    "Digit3" = "Digit3",
    "Digit4" = "Digit4",
    "Digit5" = "Digit5",
    "Digit6" = "Digit6",
    "Digit7" = "Digit7",
    "Digit8" = "Digit8",
    "Digit9" = "Digit9",
    "KeyA" = "KeyA",
    "KeyB" = "KeyB",
    "KeyC" = "KeyC",
    "KeyD" = "KeyD",
    "KeyE" = "KeyE",
    "KeyF" = "KeyF",
    "KeyG" = "KeyG",
    "KeyH" = "KeyH",
    "KeyI" = "KeyI",
    "KeyJ" = "KeyJ",
    "KeyK" = "KeyK",
    "KeyL" = "KeyL",
    "KeyM" = "KeyM",
    "KeyN" = "KeyN",
    "KeyO" = "KeyO",
    "KeyP" = "KeyP",
    "KeyQ" = "KeyQ",
    "KeyR" = "KeyR",
    "KeyS" = "KeyS",
    "KeyT" = "KeyT",
    "KeyU" = "KeyU",
    "KeyV" = "KeyV",
    "KeyW" = "KeyW",
    "KeyX" = "KeyX",
    "KeyY" = "KeyY",
    "KeyZ" = "KeyZ",
    "Enter" = "Enter",
    "Space" = "Space",
    "Escape" = "Escape",
    "Backspace" = "Backspace",
    "Backquote" = "Backquote",
    "IntlBackslash" = "IntlBackslash",
    "F1" = "F1",
    "F2" = "F2",
    "F3" = "F3",
    "F4" = "F4",
    "F5" = "F5",
    "F6" = "F6",
    "F7" = "F7",
    "F8" = "F8",
    "F9" = "F9",
    "F10" = "F10",
    "F11" = "F11",
    "F12" = "F12",
    "Tab" = "Tab",
    "ShiftLeft" = "ShiftLeft",
    "ControlLeft" = "ControlLeft",
    "MetaLeft" = "MetaLeft",
    "ArrowDown" = "ArrowDown",
    "ArrowLeft" = "ArrowLeft",
    "ArrowRight" = "ArrowRight",
    "ArrowUp" = "ArrowUp",
};
enum Mouse_Key {
    NONE,
    LEFT,
    MIDDLE,
    RIGHT,
    COUNT,
}
function inputs_init(): Inputs {
    const inputs: Inputs = {
        quit_requested:         false,
        window_resized:         false,
        window_is_focused:      true,
        keyboard_was_used:      false,
        controller_was_used:    false,
        mouse_was_used:         false,
        mouse_moved:            false,
        mouse_position:         [0, 0],
        mouse_wheel:            [0, 0],
        keys:                   {} as any,
        mouse_keys:             {} as any,
    };
    inputs.mouse_position = [0,0];
    inputs.mouse_wheel = [0,0];
    const keys = Object.values(Keyboard_Key);
    for (let key_index = 0; key_index < keys.length; key_index++) {
        const key = keys[key_index] as Keyboard_Key;
        inputs.keys[key] = { pressed: false, down: false, released: false, triggered: false, reset_next_frame: false };
    }
    const mouse_keys = Object.values(Mouse_Key);
    for (let key_index = 0; key_index < mouse_keys.length; key_index++) {
        const key = mouse_keys[key_index] as Mouse_Key;
        inputs.mouse_keys[key] = { pressed: false, down: false, released: false, triggered: false, reset_next_frame: false };
    }
    return inputs;
}
function window_on_resize(_event: Event) {
    game.inputs.window_resized = true;
}
function inputs_on_key(event: KeyboardEvent) {
    // console.log("inputs_on_key", event.type, event.code);
    if (!game.inputs.keys.hasOwnProperty(event.code)) {
        console.warn("Unrecognized key:", event.code);
        return;
    }
    const key_state = game.inputs.keys[event.code as Keyboard_Key];
    key_state.down = event.type === "keydown";
    key_state.released = event.type === "keyup";
    key_state.pressed = event.type === "keydown";
}
function inputs_prepare(inputs: Inputs) {
    inputs.keyboard_was_used = false;
    for (const key_state of Object.values(inputs.keys)) {
        if (key_state.pressed || key_state.down || key_state.released) {
            inputs.keyboard_was_used = true;
        }
        if (key_state.triggered) {
            key_state.down = true;
            key_state.triggered = false;
            key_state.reset_next_frame = true;
        }
    }
    inputs.mouse_was_used = false;
    for (const key_state of Object.values(inputs.mouse_keys)) {
        if (key_state.pressed || key_state.down || key_state.released) {
            inputs.mouse_was_used = true;
        }
        if (key_state.triggered) {
            key_state.down = true;
            key_state.triggered = false;
            key_state.reset_next_frame = true;
        }
    }
    inputs.controller_was_used = false;
    // for controller_state : inputs.controllers {
    //     for key_state : controller_state.buttons {
    //         if key_state.pressed || key_state.down || key_state.released {
    //             inputs.controller_was_used = true;
    //             break;
    //         }
    //     }
    //     for axis_state : controller_state.axes {
    //         if abs(axis_state) > CONTROLLER_DEADZONE {
    //             inputs.controller_was_used = true;
    //             break;
    //         }
    //     }
    // }
}

function inputs_reset(inputs: Inputs): void {
    inputs.mouse_wheel[0] = 0;
    inputs.mouse_wheel[1] = 0;
    inputs.mouse_moved = false;
    inputs.quit_requested = false;
    inputs.window_resized = false;

    for (const key_state of Object.values(inputs.keys)) {
        key_state.pressed = false;
        key_state.released = false;
        if (key_state.reset_next_frame) {
            key_state.down = false;
            key_state.reset_next_frame = false;
        }
    }
    for (const key_state of Object.values(inputs.mouse_keys)) {
        key_state.pressed = false;
        key_state.released = false;
        if (key_state.reset_next_frame) {
            key_state.down = false;
            key_state.reset_next_frame = false;
        }
    }
    // for controller_state : inputs.controllers {
    //     for *key_state : controller_state.buttons {
    //         key_state.pressed = false;
    //         key_state.released = false;
    //     }
    // }
}
function input_send_key(key: Keyboard_Key): void {
    game.inputs.keys[key].triggered = true;
}

// :auto_tile
/*
    Every bit represent a side: 1 same tile, 0 different tile:

    0 . 1
    . x . -> 0b0123
    2 . 3

    A top left corner tile would be:
    1 . 0
    . x . -> 0b1010_0000
    1 . 0

    Resources:
    - https://web.archive.org/web/20210909030608/https://codereview.stackexchange.com/questions/257655/algorithm-for-auto-tiling-of-tiles-in-a-2d-tile-map
    - https://web.archive.org/web/20210909030608im_/https://i.stack.imgur.com/9p0st.png
    - https://web.archive.org/web/20210909030608im_/https://i.stack.imgur.com/j3IXI.png
    - https://web.archive.org/web/20220226222317/https://twitter.com/OskSta/status/1448248658865049605
*/
type Grid_Value = number;
const TILE_VALUES = [
    0b0000, // 0 0
    0b1000, // 1 0
    0b1010, // 2 0
    0b1001, // 3 0
    0b1110, // 4 0
    0b1111, // 0 1
    0b0010, // 1 1
    0b0011, // 2 1
    0b0110, // 3 1
    0b1011, // 4 1
    0b0000, // 0 2
    0b0100, // 1 2
    0b0101, // 2 2
    0b1001, // 3 2
    0b1101, // 4 2
    0b0000, // 0 3
    0b0001, // 1 3
    0b1100, // 2 3
    0b0101, // 3 3
    0b0111, // 4 3
];
const AUTO_TILE_SIZE: Vector2 = [5, 4];
function is_same_tile(grid_position: Vector2): int {
    const grid_index = grid_position_to_index(grid_position[0], grid_position[1], game.world.width);
    if (!is_in_bounds(grid_position[0], grid_position[1], game.world.width, game.world.height)) {
        return 0;
    }
    return game.world_grid[grid_index] ? 1 : 0;
}

function calculate_tile_value(tile_position: Vector2): Grid_Value {
    const tl_x = tile_position[0] - 1;
    const tl_y = tile_position[1] - 1;
    const tr_x = tile_position[0] + 0;
    const tr_y = tile_position[1] - 1;
    const bl_x = tile_position[0] - 1;
    const bl_y = tile_position[1] + 0;
    const br_x = tile_position[0] + 0;
    const br_y = tile_position[1] + 0;
    const world_width = game.world.width;
    const world_height = game.world.height;
    let tile_value: Grid_Value = 0;
    if (is_in_bounds(tl_x, tl_y, world_width, world_height))
        tile_value |= game.world_grid[grid_position_to_index(tl_x, tl_y, world_width)] * (1 << 3);
    if (is_in_bounds(tr_x, tr_y, world_width, world_height))
        tile_value |= game.world_grid[grid_position_to_index(tr_x, tr_y, world_width)] * (1 << 2);
    if (is_in_bounds(bl_x, bl_y, world_width, world_height))
        tile_value |= game.world_grid[grid_position_to_index(bl_x, bl_y, world_width)] * (1 << 1);
    if (is_in_bounds(br_x, br_y, world_width, world_height))
        tile_value |= game.world_grid[grid_position_to_index(br_x, br_y, world_width)] * (1 << 0);
    return tile_value;
}

// TypeScript was a mistake... The future is dumb.
type Static_Array<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>;

function fixed_array_make<T>(total: int): Fixed_Size_Array<T, int> {
    return {
        data: Array<T>(total),
        count: 0,
        total: total,
    };
}
function fixed_array_add<T>(arr: Fixed_Size_Array<T, any>, item: T): T {
    assert(arr.count <= arr.total-1, `Fixed array full, can't add more items before clearing it (${arr.count}/${arr.count})`);
    arr.data[arr.count] = item;
    arr.count += 1;
    return arr.data[arr.count-1];
}
function log_matrix(matrix: Matrix4) {
    let str = "";
    for (let i = 0; i < matrix.length; i++) {
        if (i > 0 && i % 4 === 0) {
            str += "\n";
        }
        str += `${matrix[i].toString().padStart(4)}, `;
    }
    console.log(str);
}
function load_image(url: string): Promise<HTMLImageElement> {
    const image = new Image();
    image.src = url;
    return new Promise((resolve, reject) => {
        image.onload = function(_event: Event) {
            // console.log("Image loaded:", url);
            resolve(image);
        };
        image.onerror = function() {
            console.error("Image couldn't be loaded:", url);
            reject();
        };
    });
}
function assert(condition: Boolean, message: string | null = ""): asserts condition {
    if (!__RELEASE__ && !condition) {
        // debugger;
        if (message) {
            console.error("Assertion failed:");
            throw Error(message);
        } else {
            throw Error("Assertion failed!");
        }
    }
}
function sort_by_z_index(a: Sprite, b: Sprite): int {
    return a.z_index - b.z_index;
}
function find_node_at_position(position: Vector2): int {
    for (let node_index = 0; node_index < game.nodes.count; node_index++) {
        const node = game.nodes.data[node_index];
        if (vector2_equal(node.grid_position, position)) {
            return node_index;
        }
    }
    return -1;
}
function world_to_window_position(world_position: Vector2): Vector2 {
    const camera = game.renderer.camera_main;
    return [
        (world_position[0] * camera.zoom) + (game.renderer.window_size[0] / 2) - (camera.position[0] * camera.zoom),
        (world_position[1] * camera.zoom) + (game.renderer.window_size[1] / 2) - (camera.position[1] * camera.zoom),
    ];
}
function generate_project_image_url(project: Project, image_index: int): string {
    if (image_index === 0) {
        return `/site/images/screenshots/${project.screenshots_prefix}/banner-small.png`;
    }
    return `/site/images/screenshots/${project.screenshots_prefix}/screenshot${image_index}-small.png`;
}
function generate_project_thumbnail_url(project_id: int): string {
    const w = THUMBNAIL_SIZE[0];
    const h = THUMBNAIL_SIZE[1];
    game.renderer.offscreen.canvas.width = w;
    game.renderer.offscreen.canvas.height = h;
    game.renderer.offscreen.drawImage(game.image_projects, 0, h * project_id, w, h, 0, 0, w, h);
    return game.renderer.offscreen.canvas.toDataURL();
}

// :debug
function number_to_binary_string(dec: number, size: number = 4): string {
    return (dec >>> 0).toString(2).padStart(size, "0");
}

// :math
function manhathan_distance(a: Vector2, b: Vector2): int {
    return (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]));
}
function hex_to_color(hex_value: number): Color {
    const color = new Array(4) as Color;
    color[0] = ((hex_value >> 24) & 0xff) / 255;
    color[1] = ((hex_value >> 16) & 0xff) / 255;
    color[2] = ((hex_value >> 8) & 0xff) / 255;
    color[3] = ((hex_value) & 0xff) / 255;
    return color;
}
function vector2_copy(arr: Vector2): Vector2 {
    return Array.from(arr) as Vector2;
}
function vector2_equal(vec1: Vector2, vec2: Vector2): boolean {
    return vec1[0] === vec2[0] && vec1[1] === vec2[1];
}
function vector2_add(arr1: Vector2, arr2: Vector2): Vector2 {
    const result: Vector2 = [0, 0];
    result[0] = arr1[0] + arr2[0];
    result[1] = arr1[1] + arr2[1];
    return result;
}
function vector2_multiply_float(arr1: Vector2, value: float): Vector2 {
    const result: Vector2 = [0, 0];
    result[0] = arr1[0] * value;
    result[1] = arr1[1] * value;
    return result;
}
function vector2_lerp(a: Vector2, b: Vector2, t: float): Vector2 {
    const result: Vector2 = [0, 0];
    result[0] = a[0] + t * (b[0] - a[0]);
    result[1] = a[1] + t * (b[1] - a[1]);
    return result;
}
function grid_index_to_position(grid_index: int, grid_width: int): Vector2 {
    return [ grid_index % grid_width, Math.floor(grid_index / grid_width) ];
}
function grid_position_to_index(x: int, y: int, w: int): int {
    return (y * w) + x;
}
function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}
function sin_01(time: float, frequency: float = 1.0): float {
    return 0.5 * (1 + Math.sin(2 * Math.PI * frequency * time));
}
function is_in_bounds(x: int, y: int, w: int, h: int): boolean {
    return x >= 0 && x < w && y >= 0 && y < h;
}
function lerp_indices(length: number, t: float): [int, int, float] {
    let step_current = 0;
    for (let i = 0; i < length; i++) {
        const threshold = i/length;
        if (t > threshold) {
            step_current = i;
        }
    }

    const step_next = Math.min(step_current+1, length);
    const step_duration = 1/length;
    const step_progress = (t - step_current/length) / step_duration;
    // console.log({ t, step_current, step_next, step_duration, step_progress });
    return [step_current, step_next, step_progress];
}

// :matrix
/*
Mapping from jai structs (_11 - _44) to flat array indices (0-15).
_11 = 0
_12 = 1
_13 = 2
_14 = 3
_21 = 4
_22 = 5
_23 = 6
_24 = 7
_31 = 8
_32 = 9
_33 = 10
_34 = 11
_41 = 12
_42 = 13
_43 = 14
_44 = 15
 */
function matrix4_make_orthographic_projection(left: float, right: float, bottom: float, top: float, near: float, far: float): Matrix4 {
    const result = matrix4_zero();

    result[0] = 2.0 / (right - left);
    result[3] = - (right + left) / (right - left);

    result[5] = 2.0 / (top - bottom);
    result[7] = - (top + bottom) / (top - bottom);

    result[10] = -2 / (far - near);
    result[11] = - (far + near) / (far - near);
    result[15] = 1.0;

    return result;
}
// const a = matrix4_identity();
// const b = [
//     2, 0, 0, 0,
//     0, 2, 0, 0,
//     0, 0, 2, 0,
//     0, 0, 0, 2,
// ];
// matrix4_multiply(a, b);
// log_matrix(a);
function matrix4_multiply(m: Matrix4, n: Matrix4): void {
    var b00 = m[0 * 4 + 0];
    var b01 = m[0 * 4 + 1];
    var b02 = m[0 * 4 + 2];
    var b03 = m[0 * 4 + 3];
    var b10 = m[1 * 4 + 0];
    var b11 = m[1 * 4 + 1];
    var b12 = m[1 * 4 + 2];
    var b13 = m[1 * 4 + 3];
    var b20 = m[2 * 4 + 0];
    var b21 = m[2 * 4 + 1];
    var b22 = m[2 * 4 + 2];
    var b23 = m[2 * 4 + 3];
    var b30 = m[3 * 4 + 0];
    var b31 = m[3 * 4 + 1];
    var b32 = m[3 * 4 + 2];
    var b33 = m[3 * 4 + 3];
    var a00 = n[0 * 4 + 0];
    var a01 = n[0 * 4 + 1];
    var a02 = n[0 * 4 + 2];
    var a03 = n[0 * 4 + 3];
    var a10 = n[1 * 4 + 0];
    var a11 = n[1 * 4 + 1];
    var a12 = n[1 * 4 + 2];
    var a13 = n[1 * 4 + 3];
    var a20 = n[2 * 4 + 0];
    var a21 = n[2 * 4 + 1];
    var a22 = n[2 * 4 + 2];
    var a23 = n[2 * 4 + 3];
    var a30 = n[3 * 4 + 0];
    var a31 = n[3 * 4 + 1];
    var a32 = n[3 * 4 + 2];
    var a33 = n[3 * 4 + 3];
    m[ 0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    m[ 1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    m[ 2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    m[ 3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
    m[ 4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    m[ 5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    m[ 6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    m[ 7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
    m[ 8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    m[ 9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    m[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    m[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
    m[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    m[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    m[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    m[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
}
function matrix4_zero(): Matrix4 {
    return [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
    ];
}
function matrix4_identity(): Matrix4 {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
}
function matrix4_make_scale(x: float, y: float, z: float): Matrix4 {
    const result = matrix4_zero();

    result[0] = x;
    result[5] = y;
    result[10] = z;
    result[15] = 1;

    return result;
}
function matrix4_make_translation(x: float, y: float, z: float): Matrix4 {
    const result = matrix4_identity();

    result[12] = x;
    result[13] = y;
    result[14] = z;

    return result
}
function matrix4_transpose(m: Matrix4): Matrix4 {
    const result = matrix4_zero();

    result[ 0] = m[0];
    result[ 1] = m[4];
    result[ 2] = m[8];
    result[ 3] = m[12];
    result[ 4] = m[1];
    result[ 5] = m[5];
    result[ 6] = m[9];
    result[ 7] = m[13];
    result[ 8] = m[2];
    result[ 9] = m[6];
    result[10] = m[10];
    result[11] = m[14];
    result[12] = m[3];
    result[13] = m[7];
    result[14] = m[11];
    result[15] = m[15];

    return result;
}
function matrix_4_inverse(m: Matrix4): Matrix4 {
    const result = matrix4_zero();
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    var tmp_0  = m22 * m33;
    var tmp_1  = m32 * m23;
    var tmp_2  = m12 * m33;
    var tmp_3  = m32 * m13;
    var tmp_4  = m12 * m23;
    var tmp_5  = m22 * m13;
    var tmp_6  = m02 * m33;
    var tmp_7  = m32 * m03;
    var tmp_8  = m02 * m23;
    var tmp_9  = m22 * m03;
    var tmp_10 = m02 * m13;
    var tmp_11 = m12 * m03;
    var tmp_12 = m20 * m31;
    var tmp_13 = m30 * m21;
    var tmp_14 = m10 * m31;
    var tmp_15 = m30 * m11;
    var tmp_16 = m10 * m21;
    var tmp_17 = m20 * m11;
    var tmp_18 = m00 * m31;
    var tmp_19 = m30 * m01;
    var tmp_20 = m00 * m21;
    var tmp_21 = m20 * m01;
    var tmp_22 = m00 * m11;
    var tmp_23 = m10 * m01;

    var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
        (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
        (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
        (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
        (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    result[0] = d * t0;
    result[1] = d * t1;
    result[2] = d * t2;
    result[3] = d * t3;
    result[4] = d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
          (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
    result[5] = d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
          (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
    result[6] = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
          (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
    result[7] = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
          (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
    result[8] = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
          (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
    result[9] = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
          (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
    result[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
          (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
    result[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
          (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
    result[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
          (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
    result[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
          (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
    result[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
          (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
    result[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
          (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));

    return result;
}
function matrix4_rotate_z(m: Matrix4, angle_in_radians: float): Matrix4 {
    const result = matrix4_zero();

    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var c = Math.cos(angle_in_radians);
    var s = Math.sin(angle_in_radians);

    result[ 0] = c * m00 + s * m10;
    result[ 1] = c * m01 + s * m11;
    result[ 2] = c * m02 + s * m12;
    result[ 3] = c * m03 + s * m13;
    result[ 4] = c * m10 - s * m00;
    result[ 5] = c * m11 - s * m01;
    result[ 6] = c * m12 - s * m02;
    result[ 7] = c * m13 - s * m03;

    if (m !== result) {
      result[ 8] = m[ 8];
      result[ 9] = m[ 9];
      result[10] = m[10];
      result[11] = m[11];
      result[12] = m[12];
      result[13] = m[13];
      result[14] = m[14];
      result[15] = m[15];
    }

    return result;
}

function grid_position_center(grid_position: Vector2): Vector2 {
    return [grid_position[0]*GRID_SIZE, grid_position[1]*GRID_SIZE];
}
function vector_to_direction(vec: Vector2): Direction {
    if (vector2_equal(vec, DIRECTIONS[Direction.NORTH])) { return Direction.NORTH; }
    if (vector2_equal(vec, DIRECTIONS[Direction.EAST])) { return Direction.EAST; }
    if (vector2_equal(vec, DIRECTIONS[Direction.SOUTH])) { return Direction.SOUTH; }
    return Direction.WEST;
}

// :ui
type UI_Label = {
    element_root:       HTMLElement;
    element_label:      HTMLSpanElement;
    element_button:     HTMLButtonElement;
}
type UI_Label_Node = UI_Label & {
    element_image:      HTMLImageElement;
}
type UI_Panel = {
    element_root:       HTMLElement;
    element_title:      HTMLDivElement;
    element_close:      HTMLButtonElement;
    element_content:    HTMLDivElement;
}
function ui_push_console_line(line: string) {
    fixed_array_add(game.console_lines, line);
}
function ui_label_show(button: UI_Label, label: string = ""): void {
    if (label) {
        button.element_label.innerHTML = label;
    }
    button.element_root.classList.remove("hide");
}
function ui_label_hide(button: UI_Label): void {
    button.element_root.classList.add("hide");
}
function ui_label_node_show(button: UI_Label_Node, label: string, image_url: string): void {
    if (label) {
        button.element_label.innerHTML = label;
    }
    button.element_root.classList.remove("hide");
    if (image_url) {
        button.element_root.classList.add("thumbnail");
        button.element_image.src = image_url;
    } else {
        button.element_root.classList.remove("thumbnail");
        button.element_image.src = "";
    }
}
function ui_panel_show(button: UI_Panel, title: string, content: string): void {
    button.element_title.innerHTML = title;
    button.element_content.innerHTML = content;
    button.element_root.classList.remove("hide");
}
function ui_panel_hide(button: UI_Panel): void {
    button.element_root.classList.add("hide");
}
function ui_get_node_label(node: Map_Node): string {
    let label = "";
    switch (node.type) {
        case Node_Type.PROJECT: { label = "Open"; } break;
        case Node_Type.WARP:    { label = "Warp"; } break;
    }
    return label;
}
function ui_create_element<T>(ui_root: HTMLElement, html: string): T {
    const parent = document.createElement("div");
    parent.innerHTML = html.trim();
    return ui_root.appendChild(parent.firstChild) as T;
}
function ui_create_panel(ui_root: HTMLDivElement, close_fn: (this: HTMLButtonElement, ev: MouseEvent) => any): UI_Panel {
    const panel_root = ui_create_element<HTMLElement>(ui_root, `
        <section class="panel hide">
            <header>
                <h2></h2>
                <button class="close" aria-label="Close"></button>
            </header>
            <div class="content"></div>
        </section>
    `);
    const panel: UI_Panel = {
        element_root:       panel_root,
        element_title:      panel_root.querySelector("h2"),
        element_close:      panel_root.querySelector(".close"),
        element_content:    panel_root.querySelector(".content"),
    };
    panel.element_close.addEventListener("click", close_fn);
    return panel;
}
function ui_set_element_class(element: HTMLElement, class_name: string, value: boolean) {
    if (value) {
        element.classList.add(class_name);
    } else {
        element.classList.remove(class_name);
    }
}

type Project = {
    id:                 int;
    name:               string;
    url:                string;
    description:        string[];
    bullet_points:      string[];
    screenshots_prefix: string;
    screenshots_count:  int;
}

// :data
const PROJECTS: Project[] = [
    {
        id: 0,
        name: "",
        url: "",
        description: [],
        bullet_points: [],
        screenshots_prefix: "",
        screenshots_count: 0,
    },
    {
        id: 1,
        name: "Feast & Famine",
        url: "https://colinbellino.itch.io/feast",
        description: [
            `<p>A twin stick shooter created in 72 hours with a team of 4 (art, audio & code) for the Ludum Dare 50 game jam.</p>`,
            `<p>Search the rooms of your manor and deal with any enemies you come across. Defeat every enemy to progress to the next level. But be quick because your health is constantly draining!</p>`,
            `<p>Reprehenderit ex ad sint culpa ea culpa aliqua culpa. Irure mollit cillum officia laboris magna culpa exercitation ipsum deserunt sunt magna dolor. Est laboris eiusmod deserunt amet exercitation velit nostrud ea amet aute commodo. Lorem cillum cupidatat duis velit. Sunt dolore minim esse laborum minim sit veniam cupidatat commodo proident sunt. Lorem quis Lorem officia dolore proident laboris ad sunt.</p>`,
            `<p>Sint pariatur veniam irure nulla fugiat enim sit sunt aliquip anim quis duis anim. Voluptate culpa anim consectetur non sit irure. Consectetur exercitation sint consequat incididunt non ut dolor ex non aliquip dolore occaecat dolore pariatur. Nulla do pariatur minim qui quis aliquip fugiat duis ullamco commodo nostrud Lorem magna ex. Voluptate aliqua et voluptate sint Lorem laboris velit mollit ullamco. Elit do elit fugiat aliqua sint qui laboris.</p>`,
        ],
        bullet_points: [
            `Engine: Unity`,
            `Language: C#`,
            `Duration: 72h`,
            `<a href="https://github.com/colinbellino/ludum-dare-50" target="_blank" rel="noopener">Source code</a>`,
        ],
        screenshots_prefix: "feast",
        screenshots_count: 3,
    },
    {
        id: 2,
        name: "Alteration",
        url: "https://colinbellino.itch.io/alteration",
        description: [
            `<p>A puzzle game created in 72 hours with a team of 3 (art, audio & code) for the Ludum Dare 49 game jam.</p>`,
            `<p>You are playing as your astral projection, which is thrown into a surreal maze and your goal is to reach perfect balance, symbolized by the goal of each level. <br />But beware as your mind is yet unbalanced your mood will change your form every couple of turns.</p>`,
        ],
        bullet_points: [
            `Engine: Unity`,
            `Language: C#`,
            `Duration: 72h (+ a couple of days after the jam)`,
            `<a href="https://github.com/colinbellino/ludum-dare-49" target="_blank" rel="noopener">Source code</a>`,
        ],
        screenshots_prefix: "alteration",
        screenshots_count: 6,
    },
    {
        id: 3,
        name: "Project 3",
        url: "",
        description: [
            `<p>Reprehenderit ex ad sint culpa ea culpa aliqua culpa. Irure mollit cillum officia laboris magna culpa exercitation ipsum deserunt sunt magna dolor. Est laboris eiusmod deserunt amet exercitation velit nostrud ea amet aute commodo. Lorem cillum cupidatat duis velit. Sunt dolore minim esse laborum minim sit veniam cupidatat commodo proident sunt. Lorem quis Lorem officia dolore proident laboris ad sunt.</p>`,
            `<p>Sint pariatur veniam irure nulla fugiat enim sit sunt aliquip anim quis duis anim. Voluptate culpa anim consectetur non sit irure. Consectetur exercitation sint consequat incididunt non ut dolor ex non aliquip dolore occaecat dolore pariatur. Nulla do pariatur minim qui quis aliquip fugiat duis ullamco commodo nostrud Lorem magna ex. Voluptate aliqua et voluptate sint Lorem laboris velit mollit ullamco. Elit do elit fugiat aliqua sint qui laboris.</p>`,
        ],
        bullet_points: [],
        screenshots_prefix: "bonbon",
        screenshots_count: 1,
    },
    {
        id: 4,
        name: "Project 4",
        url: "",
        description: [
            `<p>Deserunt consectetur do qui nostrud. Duis qui eu do excepteur occaecat tempor consectetur. Deserunt deserunt laboris non minim ex. Irure ut officia occaecat ad aliquip ea dolore in exercitation proident enim Lorem officia minim. Exercitation in Lorem veniam occaecat ex ullamco sit elit eiusmod Lorem et sunt ea incididunt.</p>`,
            `<p>Pariatur enim voluptate irure sunt nostrud. Ipsum pariatur fugiat adipisicing occaecat qui deserunt. Aliquip irure sint non sint ut adipisicing ullamco deserunt non consequat veniam pariatur. Sit amet deserunt ut velit eu. Non consequat ad reprehenderit officia anim cillum Lorem. Quis enim voluptate aliqua anim cupidatat quis.</p>`,
        ],
        bullet_points: [],
        screenshots_prefix: "flight",
        screenshots_count: 1,
    },
    {
        id: 5,
        name: "Project 5",
        url: "",
        description: [
            `<p>Exercitation quis cillum nisi duis anim ad eu exercitation consequat elit ullamco ad. Dolor dolore reprehenderit est enim adipisicing. Minim nisi eiusmod do ullamco ea anim fugiat anim velit ipsum minim Lorem. Commodo ex aliqua sint cillum amet do. Ullamco cupidatat dolore sint incididunt et ipsum.</p>`,
            `<p>Culpa pariatur id do non enim ut tempor cillum nostrud eu qui pariatur sit eiusmod. Ipsum elit enim deserunt occaecat cupidatat. Laboris veniam cupidatat voluptate amet enim ullamco mollit mollit ea adipisicing consectetur eiusmod esse do. Aliqua officia qui ex adipisicing esse esse qui aute pariatur veniam. Occaecat aute anim nulla in laboris deserunt irure et. Ut enim excepteur enim dolor proident non reprehenderit.</p>`,
        ],
        bullet_points: [],
        screenshots_prefix: "hubside",
        screenshots_count: 1,
    },
    {
        id: 6,
        name: "Project 6",
        url: "",
        description: [
            `<p>Eu occaecat velit enim labore duis labore in ex ullamco officia excepteur. Laboris adipisicing nostrud non dolore minim laboris et voluptate non fugiat cupidatat. Ullamco quis minim magna elit cillum deserunt aliqua. Eu sit nisi ea fugiat nostrud anim.</p>`,
            `<p>Amet proident amet ut excepteur dolore esse cillum veniam ea quis aute exercitation in. Ad ut eiusmod nulla quis quis eu minim tempor aute excepteur minim aliquip mollit. Proident fugiat pariatur commodo labore fugiat.</p>`,
        ],
        bullet_points: [],
        screenshots_prefix: "monstrum",
        screenshots_count: 1,
    },
    {
        id: 7,
        name: "Project 7",
        url: "",
        description: [
            `<p>Reprehenderit officia minim fugiat velit non. Et qui adipisicing sunt ex occaecat amet non. Sunt reprehenderit velit elit proident fugiat irure dolor laborum.</p>`,
            `<p>Consectetur nulla adipisicing et duis irure in voluptate in nostrud elit excepteur sint officia et. Incididunt reprehenderit fugiat laborum aliqua nostrud dolor quis in dolor ea. Culpa duis dolor cupidatat deserunt in nulla cillum consectetur cillum nisi et duis laboris esse.</p>`,
        ],
        bullet_points: [],
        screenshots_prefix: "precogs",
        screenshots_count: 1,
    },
    {
        id: 8,
        name: "Project 8",
        url: "",
        description: [
            `<p>Nulla nulla irure sunt laborum laborum. Magna qui eu quis mollit proident aliquip consectetur labore sunt amet amet Lorem occaecat duis. Qui commodo qui tempor ullamco qui do anim. Eiusmod irure quis officia laboris sunt deserunt nisi enim excepteur. Ad irure cupidatat id amet nisi.</p>`,
            `<p>Tempor aute nulla occaecat eiusmod duis cillum sint ullamco mollit nulla. Ipsum minim ea nulla cupidatat nisi dolor do est excepteur excepteur cillum ipsum. Velit pariatur culpa incididunt irure cillum incididunt cupidatat voluptate id velit. Duis id officia aliquip nulla. Ut ullamco proident amet elit quis pariatur.</p>`,
        ],
        bullet_points: [],
        screenshots_prefix: "renault",
        screenshots_count: 1,
    },
    {
        id: 9,
        name: "Project 9",
        url: "",
        description: [
            `<p>Elit dolor occaecat tempor adipisicing tempor ea consectetur cupidatat velit anim. Qui nostrud ea tempor enim dolore occaecat pariatur. Ex ipsum occaecat et nostrud reprehenderit ipsum enim nostrud nostrud sit. Tempor anim dolore et voluptate dolore cillum amet ad consequat eu dolore. Cupidatat sit minim in minim anim sit aliqua ipsum pariatur aliquip. Amet do aliqua tempor occaecat tempor excepteur officia nulla deserunt deserunt exercitation esse. Fugiat duis sunt adipisicing ut cillum officia dolore et labore proident id ea officia.</p>`,
            `<p>Enim ex sunt velit culpa exercitation consequat non incididunt magna quis cupidatat. Minim nulla ullamco ut quis laboris tempor duis sunt. Laborum proident aliqua ipsum proident aliqua. Duis commodo proident eiusmod velit proident laborum duis ut do tempor sint labore voluptate. Sint exercitation cupidatat adipisicing cupidatat id aliquip est cillum id tempor exercitation nisi dolor consequat. In eu laborum cupidatat consectetur ad nulla magna consequat commodo do incididunt ullamco adipisicing nulla. Est in dolor esse velit excepteur Lorem qui adipisicing.</p>`,
        ],
        bullet_points: [],
        screenshots_prefix: "snowball",
        screenshots_count: 1,
    },
    {
        id: 10,
        name: "Project 10",
        url: "",
        description: [
            `<p>Dolor proident velit Lorem ipsum ea non irure ad commodo. Nulla esse non nisi laboris esse nisi officia irure. Proident qui ipsum incididunt Lorem incididunt. Duis excepteur do amet enim occaecat sunt duis esse adipisicing velit Lorem mollit. Sint quis reprehenderit nisi reprehenderit culpa nostrud laborum occaecat deserunt voluptate dolore ipsum enim.</p>`,
            `<p>Eu dolore eu sit consequat in dolore ad quis adipisicing Lorem aliqua minim. Proident Lorem non incididunt deserunt nisi et. Laborum excepteur reprehenderit velit et nisi ex ullamco aliqua occaecat. Nostrud ex elit aute non quis ipsum occaecat nulla dolore cupidatat ea ut. Eiusmod minim exercitation pariatur exercitation cillum deserunt exercitation est duis Lorem id culpa reprehenderit. In irure tempor nostrud anim aute anim. Excepteur dolor magna voluptate consectetur est ea occaecat laboris.</p>`,
        ],
        bullet_points: [],
        screenshots_prefix: "",
        screenshots_count: 0,
    },
];

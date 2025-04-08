// These are injected at build time
declare const __RELEASE__: boolean;
declare const __CODEGEN__: Codegen;

type Codegen = {
    sprite_vs:  string;
    sprite_fs:  string;
    world:      World;
}

type Vector2 = Static_Array<float, 2>;
type Vector4 = Static_Array<float, 4>;
type Matrix4 = Static_Array<float, 16>;
type float = GLfloat;
type int = GLint;
type Color = Static_Array<float, 4>;
type Fixed_Size_Array<T, N extends int> = {
    data:   Static_Array<T, N>;
    count:  int;
    total:  N;
}

// :game
type Game = {
    game_mode:              Game_Mode;
    world_mode:             World_Mode;
    world_mode_timer:       int;
    animation_frame:        int;
    theme:                  Theme;
    clear_color:            Color;
    player:                 Entity;
    player_path:            int[];
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
    draw_world_grid:        boolean;
    draw_world_tile:        boolean;
    draw_entities:          boolean;
    draw_tiles:             boolean;
    image_projects:         HTMLImageElement;
    texture0:               WebGLTexture;
    sprite_vs:              string;
    sprite_fs:              string;
    sprite_pass:            Sprite_Pass;
    loaded_callback:        () => void;
    // engine
    console_lines:          Fixed_Size_Array<Message, typeof MAX_CONSOLE_LINES>;
    renderer:               Renderer;
    frame_count:            int;
    frame_end:              int;
    fps:                    int;
    fps_last_update:        int;
    fps_count:              int;
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
    animation:      Animation;
}
type Animation = {
    active:             boolean;
    entity:             Entity;
    current_frame:      int;
    current_animation:  int;
    frame_duration:     int; // in milliseconds
    frame_started_at:   DOMHighResTimeStamp; // in milliseconds
    animations: [
        /* IDLE_NORTH */ Static_Array<Vector2, 4>,
        /* IDLE_EAST */  Static_Array<Vector2, 4>,
        /* IDLE_SOUTH */ Static_Array<Vector2, 4>,
        /* IDLE_WEST */  Static_Array<Vector2, 4>,
    ],
}
enum Node_Type {
    EMPTY,
    PROJECT,
    WARP,
    INFO,
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

const THEMES = [
    { color: 0x076ef0, atlas: "/worldmap/images/atlas.png" },
    { color: 0x17152c, atlas: "/worldmap/images/atlas_dark.png" },
];

// :constants
const PROJECTS_IMAGE_URL = "/worldmap/images/projects.png";
const CUSTOM_BACKGROUND = true; // TODO: disable this in release
const THUMBNAIL_SIZE: Vector2 = [320, 180];
const THUMBNAIL_MAX: int = 16;
const CAMERA_START_POSITION: Vector2 = [24, 9];
const GRID_SIZE = 48;
const TILESET_POSITION : Vector2 = [0, 240];
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
const PLAYER_MOVE_SPEED = 300;
const WARP_DURATION_MULTIPLIER = 4.0;
const ICON_CLOSE = `<svg width="64" height="64"><g><path d="M30 22 L34 22 34 30 42 30 42 34 34 34 34 42 30 42 30 34 22 34 22 30 30 30 30 22"/></g></svg>`;
// const ICON_KEYBOARD_ESCAPE = `<svg width="64" height="64"><path d="M16 8h32q8 0 8 8v32q0 8-8 8H16q-8 0-8-8V16q0-8 8-8m16 20q-.4 0-.7.3-.3.3-.3.7 0 .4.3.7l.65.3h.1q1.55 0 2.75 1.2T36 34q0 1.6-1.2 2.8Q33.6 38 32 38h-4v-3h4l.7-.3.3-.7-.3-.7q-.3-.3-.65-.3h-.1q-1.55 0-2.75-1.2T28 29q0-1.6 1.2-2.8Q30.4 25 32 25h4v3h-4m-14-3h8v3h-5v2h5v3h-5v2h5v3h-8V25m26.8 12-.1.1q-1.15.9-2.7.9-1.6 0-2.7-.9l-.1-.05-.05-.1Q38 35.8 38 34.3v-5.55q0-1.6 1.2-2.7h.05Q40.4 25 42 25q1.55 0 2.75 1.05 1.25 1.1 1.25 2.7v1.5h-3v-1.5l-.2-.45q-.35-.3-.8-.3-.45 0-.75.25l-.05.05-.2.45v5.55l.2.5.8.2.75-.2.25-.5v-1.5h3v1.5q.05 1.5-1.2 2.7M11 16v32q0 5 5 5h32q5 0 5-5V16q0-5-5-5H16q-5 0-5 5"/></svg>`;
const ICON_KEYBOARD_ENTER = `<svg width="64" height="64"><path d="M40 11h-4q-5 0-5 5v15H16q-5 0-5 5v12q0 5 5 5h32q5 0 5-5V16q0-5-5-5h-8m8-3q8 0 8 8v32q0 8-8 8H16q-8 0-8-8V36q0-8 8-8h12V16q0-8 8-8h12M20 43q.4 0 .7.3l.3.7-.3.7-.7.3h-3v2h3q.4 0 .7.3l.3.7-.3.7-.7.3h-4l-.7-.3q-.3-.3-.3-.7v-8q0-.4.3-.7.3-.3.7-.3h4q.4 0 .7.3l.3.7-.3.7-.7.3h-3v2h3m2-1.2q0-1.15.85-2l.05-.05Q23.75 39 25 39q1.15 0 2.05.75l.05.05q.9.85.9 2V48l-.3.7q-.3.3-.7.3l-.7-.3-.3-.7v-6.2l-.25-.55v.05q-.3-.3-.75-.3t-.8.3l.05-.1-.25.6V48l-.3.7-.7.3q-.4 0-.7-.3-.3-.3-.3-.7v-6.2m8-.8-.7-.3q-.3-.3-.3-.7 0-.4.3-.7.3-.3.7-.3h4q.4 0 .7.3l.3.7-.3.7q-.3.3-.7.3h-1v7l-.3.7-.7.3q-.4 0-.7-.3-.3-.3-.3-.7v-7h-1m6-1q0-.4.3-.7.3-.3.7-.3h4q.4 0 .7.3l.3.7-.3.7-.7.3h-3v2h3q.4 0 .7.3l.3.7-.3.7-.7.3h-3v2h3q.4 0 .7.3l.3.7-.3.7-.7.3h-4l-.7-.3q-.3-.3-.3-.7v-8m12.1 4.1v.05l-.65.5 1.45 2.9q.2.4.05.8l-.5.55-.75.05q-.4-.15-.6-.5L45.4 45H45v3l-.3.7-.7.3q-.4 0-.7-.3-.3-.3-.3-.7v-8q0-.4.3-.7.3-.3.7-.3h2.05q1.2 0 2.05.85.9.9.9 2.15t-.9 2.1m-2-1.1.35-.1.25-.2h.05L47 42l-.3-.75q-.25-.25-.65-.25H45v2h1.1"/></svg>`;
// const ICON_KEYBOARD_ARROW_UP = `<svg width="64" height="64"><path d="M48 11H16q-5 0-5 5v32q0 5 5 5h32q5 0 5-5V16q0-5-5-5m8 5v32q0 8-8 8H16q-8 0-8-8V16q0-8 8-8h32q8 0 8 8m-24 6 8 8v2h-4v10h-8V32h-4v-2l8-8"/></svg>`;
const enum Direction { NORTH, EAST, SOUTH, WEST }
const enum World_Mode { INTRO, IDLE, MOVING }
const enum Game_Mode { LOADING, RUNNING }
const enum Theme { LIGHT, DARK };

function COLOR_TRANSPARENT(): Color { return [0, 0, 0, 0]; }
function COLOR_WHITE(): Color       { return [1, 1, 1, 1]; }
function COLOR_BLACK(): Color       { return [0, 0, 0, 1]; }

let game: Game;

export function start(loaded_callback: () => void) {
    // if (!__RELEASE__) console.clear();
    // @ts-ignore
    game = {};
    game.game_mode = Game_Mode.LOADING;
    game.frame_count = 0;
    game.frame_end = 0;
    game.fps = 0;
    game.fps_last_update = 0;
    game.fps_count = 0;
    game.entities = fixed_array_make(MAX_ENTITIES);
    game.sorted_sprites = fixed_array_make(MAX_SPRITES);
    game.console_lines = fixed_array_make(MAX_CONSOLE_LINES);
    game.destination_path = fixed_array_make(MAX_PATH);
    game.draw_console = location.search.includes("console");
    game.draw_entities = false;
    game.draw_world_grid = false;
    game.draw_world_tile = false;
    game.draw_tiles = false;
    game.player_path = [];

    const prefers_dark_theme = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const [renderer, renderer_ok] = renderer_init(prefers_dark_theme);
    if (!renderer_ok) {
        console.error("Couldn't initialize renderer.");
        return;
    }
    game.renderer = renderer;
    renderer_update_camera_matrix_main(game.renderer.camera_main);

    game.inputs = inputs_init();
    game.projects = fixed_array_make(MAX_PROJECTS);
    game.nodes = fixed_array_make(MAX_NODES);
    game.loaded_callback = loaded_callback;
    let use_dark_theme = false;
    // let use_dark_theme = prefers_dark_theme;
    /* if (!__RELEASE__) */ {
        if      (location.search.includes("dark"))  { use_dark_theme = true; }
        else if (location.search.includes("light")) { use_dark_theme = false; }
    }
    game.theme = use_dark_theme ? Theme.DARK : Theme.LIGHT;
    ui_set_theme_color(THEMES[game.theme].color);

    window.addEventListener("resize", window_on_resize, false);
    window.addEventListener("keydown", inputs_on_key, false);
    window.addEventListener("keyup", inputs_on_key, false);
    window.addEventListener("touchstart", inputs_on_touch_start, false);
    window.addEventListener("touchend", inputs_on_touch_end, false);
    window.addEventListener("mousemove", inputs_on_mouse_move, false);
    window.addEventListener("click", inputs_on_mouse_click, false);

    if (!__RELEASE__ && location.search.includes("reload")) {
        setInterval(function reload_atlas() {
            load_image(`${THEMES[game.theme].atlas}?v=${Date.now()}`).then(image => { game.texture0 = renderer_create_texture(image, game.renderer.gl); });
        }, 1000);
    }

    load_image(THEMES[game.theme].atlas).then(image => {
        game.texture0 = renderer_create_texture(image, game.renderer.gl);

        if (CUSTOM_BACKGROUND) {
            game.renderer.offscreen.canvas.width = 1;
            game.renderer.offscreen.canvas.height = 1;
            game.renderer.offscreen.drawImage(image, 0, 240, 1, 1, 0, 0, 1, 1);
            const color = game.renderer.offscreen.getImageData(0, 0, 1, 1);
            THEMES[game.theme].color = color_to_hex(color.data as any);
            ui_set_theme_color(THEMES[game.theme].color);
        }
    });
    load_image(PROJECTS_IMAGE_URL).then(image => { game.image_projects = image });
    load_codegen().then((codegen) => {
        game.world = codegen.world;
        game.sprite_vs = codegen.sprite_vs;
        game.sprite_fs = codegen.sprite_fs;
    });

    requestAnimationFrame(update);
}

export function pause() {
    cancelAnimationFrame(game.animation_frame);
}

export function resume() {
    ui_set_theme_color(THEMES[game.theme].color);
    update();
}

export function update() {
    try {
        const gl = game.renderer.gl;
        const now = performance.now();

        inputs_prepare(game.inputs);

        game.renderer.sprites.count = 0;
        game.console_lines.count = 0;
        if (now >= game.fps_last_update + 1000) {
            game.fps = game.fps_count;
            game.fps_count = 0;
            game.fps_last_update = now;
        }

        const frame_start_theme = game.theme;
        // const frame_start_node = game.nodes_current;
        // const frame_start_camera_zoom = game.renderer.camera_main.zoom;

        if (game.inputs.window_resized) {
            renderer_resize_canvas();
            update_zoom();
        }

        const mouse_position_world = window_to_world_position(game.inputs.mouse_position);
        let player_input_move: Vector2 = [0, 0];
        let player_input_mouse_left = false;
        let player_input_confirm = false;
        let player_input_cancel = false;

        // :debug inputs
        if (game.inputs.keys.ShiftLeft.down) {
            if (!__RELEASE__) {
                if (game.inputs.keys.Backquote.released || game.inputs.keys.IntlBackslash.released) {
                    game.draw_console = !game.draw_console;
                }
                if (game.inputs.keys.Digit1.released) {
                    game.draw_world_grid = !game.draw_world_grid;
                }
                if (game.inputs.keys.Digit2.released) {
                    game.draw_world_tile = !game.draw_world_tile;
                }
                if (game.inputs.keys.Digit3.released) {
                    game.draw_entities = !game.draw_entities;
                }
                if (game.inputs.keys.Digit4.released) {
                    game.draw_tiles = !game.draw_tiles;
                }
                if (game.inputs.keys.KeyT.down) {
                    game.renderer.camera_main.zoom = 1;
                    console.log("Zoom reset to 1.");
                }
                if (game.inputs.keys.KeyR.down) {
                    game.renderer.camera_main.zoom = clamp(game.renderer.camera_main.zoom + 0.1, 1, 16);
                }
                if (game.inputs.keys.KeyF.down) {
                    game.renderer.camera_main.zoom = clamp(game.renderer.camera_main.zoom - 0.1, 1, 16);
                }
                if (game.inputs.keys.KeyW.down) {
                    game.renderer.camera_main.position[1] -= 1.0;
                }
                if (game.inputs.keys.KeyS.down) {
                    game.renderer.camera_main.position[1] += 1.0;
                }
                if (game.inputs.keys.KeyA.down) {
                    game.renderer.camera_main.position[0] -= 1.0;
                }
                if (game.inputs.keys.KeyD.down) {
                    game.renderer.camera_main.position[0] += 1.0;
                }
            }
        } else {
            // :player inputs
            if (game.inputs.mouse_keys[Mouse_Key.LEFT].pressed) {
                player_input_mouse_left = true;
            }
            if (game.inputs.keys.KeyW.down || game.inputs.keys.ArrowUp.down) {
                player_input_move[1] = -1;
            } else if (game.inputs.keys.KeyS.down || game.inputs.keys.ArrowDown.down) {
                player_input_move[1] = +1;
            } else if (game.inputs.keys.KeyA.down || game.inputs.keys.ArrowLeft.down) {
                player_input_move[0] = -1;
            } else if (game.inputs.keys.KeyD.down || game.inputs.keys.ArrowRight.down) {
                player_input_move[0] = +1;
            }

            if (game.inputs.touch_released) {
                const THRESHOLD = 50;

                const diff_x = game.inputs.touch_end_x - game.inputs.touch_start_x;
                if (Math.abs(diff_x) > THRESHOLD) {
                    if (diff_x < 0) { player_input_move[0] = -1; }
                    if (diff_x > 0) { player_input_move[0] = +1; }
                }

                const diff_y = game.inputs.touch_end_y - game.inputs.touch_start_y;
                if (Math.abs(diff_y) > THRESHOLD) {
                    if (diff_y < 0) { player_input_move[1] = -1; }
                    if (diff_y > 0) { player_input_move[1] = +1; }
                }
            }

            if (
                (game.inputs.keys.Space.released || (game.inputs.keys.Space.down && game.inputs.keys.Space.reset_next_frame)) ||
                (game.inputs.keys.Enter.released || (game.inputs.keys.Enter.down && game.inputs.keys.Enter.reset_next_frame))
            ) {
                player_input_confirm = true;
            }

            if (
                (game.inputs.keys.Escape.released || (game.inputs.keys.Escape.down && game.inputs.keys.Escape.reset_next_frame)) ||
                (game.inputs.keys.Backspace.released || (game.inputs.keys.Backspace.down && game.inputs.keys.Backspace.reset_next_frame))
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
                    if (game.loaded_callback) { game.loaded_callback(); }
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
                            position: [0, 0],
                            size: [16, 16],
                            scale: [1, 1],
                            offset: [0, -2],
                            rotation: 0,
                            texture_size: [16, 16],
                            texture_position: [0, 144],
                            z_index: 9,
                        },
                        animation: {
                            active:             true,
                            entity:             game.player,
                            current_frame:      0,
                            current_animation:  Direction.SOUTH,
                            frame_duration:     150,
                            frame_started_at:   now,
                            animations: [
                                /* IDLE_NORTH */ [[0*16, 160], [1*16, 160], [2*16, 160], [3*16, 160]],
                                /* IDLE_EAST  */ [[0*16, 192], [1*16, 192], [2*16, 192], [3*16, 192]],
                                /* IDLE_SOUTH */ [[0*16, 144], [1*16, 144], [2*16, 144], [3*16, 144]],
                                /* IDLE_WEST  */ [[0*16, 176], [1*16, 176], [2*16, 176], [3*16, 176]],
                            ],
                        }
                    });

                    game.renderer.camera_main.position = vector2_multiply_float(CAMERA_START_POSITION, GRID_SIZE);
                    renderer_resize_canvas();
                    update_zoom();

                    game.inputs.window_resized = true;
                    game.render_active = true;
                    game.game_mode = Game_Mode.RUNNING;
                    game.world_mode = World_Mode.INTRO;
                    game.world_mode_timer = now;
                }
            } break;
            // :game RUNNING
            case Game_Mode.RUNNING: {
                switch (game.world_mode) {
                    // :world INTRO
                    case World_Mode.INTRO: {
                        let done = false;
                        const fade_start = game.world_mode_timer;
                        const fade_end = fade_start + 1500;
                        const player_move_start = game.world_mode_timer + 1300;
                        const player_move_end = player_move_start + PLAYER_MOVE_SPEED*2;
                        // const intro_end = game.world_mode_timer + 3000;

                        game.draw_entities = true;
                        game.draw_world_tile = true;
                        game.draw_tiles = true;

                        const fade_progress = timer_progress(fade_start, fade_end, now);
                        fixed_array_add(game.renderer.sprites, {
                            color: vector4_lerp(hex_to_color(THEMES[game.theme].color), COLOR_TRANSPARENT(), fade_progress),
                            position: game.renderer.camera_main.position,
                            size: [1, 1],
                            scale: vector2_multiply_float(game.renderer.window_size, 2),
                            offset: [0, -2],
                            rotation: 0,
                            texture_size: [16, 16],
                            texture_position: [0, 0],
                            z_index: 999,
                        });

                        if (now >= player_move_start) {
                            const current: Vector2 = [game.world.start_position[0] - 1, game.world.start_position[1]];
                            const next = game.world.start_position;
                            const progress = timer_progress(player_move_start, player_move_end, now);

                            game.player.sprite.position = vector2_lerp(vector2_substract(grid_position_center(current), [-8, 0.0]), grid_position_center(next), progress);

                            const direction = vector_to_direction(vector2_substract(next, current));
                            game.player.animation.current_animation = direction;

                            if (progress >= 1) {
                                done = true;
                            }
                        }

                        if (done) {
                            game.player.animation.current_animation = Direction.SOUTH;
                            game.world_mode = World_Mode.IDLE;
                            game.world_mode_timer = now;
                        }
                    } break;
                    // :world IDLE
                    case World_Mode.IDLE: {
                        const current_node = game.nodes.data[game.nodes_current];

                        const project_panel_opened = !game.renderer.ui_node_project.element_root.classList.contains("hide");
                        const node_label_opened = !game.renderer.ui_node_action.element_root.classList.contains("hide");
                        let node_at_mouse_position = -1;
                        for (let i = 0; i < game.nodes.count; i++) {
                            const HITBOX_SIZE = 48;
                            const node = game.nodes.data[i];
                            const box_top_left: Vector2 = [node.grid_position[0]*GRID_SIZE - HITBOX_SIZE*0.5, node.grid_position[1]*GRID_SIZE - HITBOX_SIZE*0.5];
                            if (aabb_collides(mouse_position_world, [1, 1], box_top_left, [HITBOX_SIZE, HITBOX_SIZE])) {
                                node_at_mouse_position = i;
                                break;
                            }
                        }

                        if (node_at_mouse_position > -1) {
                            set_mouse_cursor("pointer");
                        } else {
                            set_mouse_cursor("default");
                        }

                        if (player_input_mouse_left) {
                            if (project_panel_opened) {
                                player_input_cancel = true;
                            } else {
                                if (node_at_mouse_position > -1) {
                                    const destination_node = game.nodes.data[node_at_mouse_position];

                                    if (node_at_mouse_position === game.nodes_current) {
                                        if (node_label_opened) {
                                            player_input_confirm = true;
                                        } else {
                                            ui_node_show(destination_node);
                                        }
                                    } else {
                                        // Quick and dirty A* pathfinding
                                        // TODO: profile this, maybe we need to calculate all the pathes in advances since we don't have anything dynamic.
                                        let path : Node_Index[] = [];
                                        type Node_Index = int;
                                        type AStar_Node = { curr: Node_Index; prev: Node_Index; g_cost: int, h_cost: int }

                                        const nodes : AStar_Node[] = Array(game.nodes.count);
                                        for (let node_index = 0; node_index < nodes.length; node_index++) {
                                            nodes[node_index] = { curr: node_index, prev: null, g_cost: 0, h_cost: 0 };
                                        }
                                        let checked : Node_Index[] = [];
                                        let to_check : Node_Index[] = [game.nodes_current];

                                        let tries = 0;
                                        while (to_check.length > 0) {
                                            tries += 1;
                                            if (tries > 50) {
                                                if (!__RELEASE__) { console.warn("Path not found!"); }
                                                break;
                                            }

                                            const current = to_check.pop();
                                            if (checked.includes(current)) {
                                                continue;
                                            }

                                            const node = game.nodes.data[current];
                                            checked.push(current);

                                            const destination_reached = vector2_equal(node.grid_position, destination_node.grid_position);
                                            if (destination_reached) {
                                                let n = checked[checked.length-1];
                                                while (n !== null) {
                                                    const node = nodes[n];
                                                    if (node.curr !== game.nodes_current) path.push(n);
                                                    n = node.prev;
                                                }
                                                break;
                                            }

                                            for (let direction = 0; direction < node.neighbours.length; direction++) {
                                                const neighbour = node.neighbours[direction];
                                                if (neighbour.path.length === 0) {
                                                    continue;
                                                }

                                                const neighbour_position = neighbour.path[neighbour.path.length - 1];
                                                const neighbour_node_id = find_node_at_position(neighbour_position);
                                                if (checked.includes(neighbour_node_id)) {
                                                    continue;
                                                }

                                                const neighbour_g_cost = nodes[current].g_cost + manhathan_distance(destination_node.grid_position, neighbour_position);
                                                const neighbour_node = nodes[neighbour_node_id];
                                                const already_checked = to_check.includes(neighbour_node_id);
                                                if (neighbour_g_cost < neighbour_node.g_cost || !already_checked) {
                                                    neighbour_node.g_cost = neighbour_g_cost;
                                                    neighbour_node.h_cost = manhathan_distance(destination_node.grid_position, neighbour_position);
                                                    neighbour_node.prev = current;

                                                    if (!already_checked) {
                                                        to_check.push(neighbour_node_id);
                                                    }
                                                }
                                            }
                                        }

                                        if (path.length > 0) {
                                            game.player_path = path;
                                        }
                                    }
                                } else {
                                    player_input_cancel = true;
                                }
                            }
                        }

                        const node = game.nodes.data[game.nodes_current];
                        const project = game.projects.data[node.project_id];

                        if (game.player_path.length > 0) {
                            const next = game.player_path.pop();
                            // console.log("next", next);
                            const next_node = game.nodes.data[next];
                            for (let direction = 0; direction < current_node.neighbours.length; direction++) {
                                const neighbour = current_node.neighbours[direction];
                                if (neighbour.path.length > 0 && vector2_equal(next_node.grid_position, neighbour.path[neighbour.path.length-1])) {
                                    player_input_move = DIRECTIONS[direction];
                                    break;
                                }
                            }
                        }
                        const is_moving = !vector2_equal(player_input_move, [0, 0]);
                        if (!project_panel_opened && is_moving) {
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
                                ui_label_hide(game.renderer.ui_node_action);

                                game.world_mode = World_Mode.MOVING;
                                game.world_mode_timer = now;
                            } else {
                                if (!__RELEASE__) console.warn("Can't move in this direction: " + direction);
                            }
                        }

                        if (player_input_cancel) {
                            if (project_panel_opened) {
                                ui_panel_hide(game.renderer.ui_node_project);
                                ui_label_show(game.renderer.ui_node_action);
                            } else {
                                if (node_label_opened) {
                                    ui_label_hide(game.renderer.ui_node_action);
                                } else {
                                    ui_node_show(node);
                                }
                            }
                        }

                        if (player_input_confirm) {
                            switch (node.type) {
                                case Node_Type.EMPTY: { } break;
                                case Node_Type.INFO: {
                                    if (project_panel_opened) {

                                    } else {
                                        ui_panel_show(game.renderer.ui_node_project, "Sign", node.tooltip, null);
                                        ui_label_hide(game.renderer.ui_node_action);
                                    }
                                } break;
                                case Node_Type.PROJECT: {
                                    if (project_panel_opened) {

                                    } else {
                                        const content = [];
                                        if (project.screenshots_count > 0) {
                                            content.push(`<ul class="screenshots">`);
                                            for (let i = 0; i < project.screenshots_count; i++) {
                                                content.push(`
                                                    <li>
                                                        <a href="${project_screenshot_url(project, i+1, "large")}" target="_blank" rel="noopener">
                                                            <img src="${project_screenshot_url(project, i+1)}" alt="A screenshot of the project (${i+1} of ${project.screenshots_count})." />
                                                        </a>
                                                    </li>
                                                `);
                                            }
                                            content.push("</ul>");
                                        }
                                        for (let i = 0; i < project.description.length; i++) {
                                            content.push(project.description[i]);
                                        }

                                        ui_panel_show(game.renderer.ui_node_project, project.name, content.join(""), project.url);
                                        ui_label_hide(game.renderer.ui_node_action);
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

                        const distance = game.destination_path.count-1;
                        let duration = PLAYER_MOVE_SPEED * distance;
                        if (is_warp) { duration *= WARP_DURATION_MULTIPLIER; }
                        const end = game.world_mode_timer + duration;
                        const remaining = end - now;
                        const progress = clamp(1.0 - (1.0 / (duration / remaining)), 0, 1);

                        const [current, next, step_progress] = lerp_indices(game.destination_path.count-1, progress);
                        game.player.sprite.position = vector2_lerp(grid_position_center(game.destination_path.data[current]), grid_position_center(game.destination_path.data[next]), step_progress);

                        const direction = vector_to_direction(vector2_substract(game.destination_path.data[next], game.destination_path.data[current]));
                        game.player.animation.current_animation = direction;

                        if (is_warp) {
                            game.player.sprite.scale = [0, 0];
                            game.renderer.camera_main.position = vector2_lerp(game.camera_move_start, game.camera_move_end, progress);
                        }

                        if (progress === 1) {
                            game.nodes_current = game.destination_node;
                            const node = game.nodes.data[game.nodes_current];
                            if (is_warp) {
                                game.player.sprite.scale = [1, 1];
                            }

                            ui_node_show(node);
                            game.player.animation.current_animation = Direction.SOUTH;
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

            // const node_changed = frame_start_node !== game.nodes_current;
            // const camera_changed = frame_start_camera_zoom !== game.renderer.camera_main.zoom;
            /* if (node_changed || game.inputs.window_resized || camera_changed) */ {
                const MARGIN = 10;
                const current_node = game.nodes.data[game.nodes_current];
                const window_position = world_to_window_position(vector2_multiply_float(current_node.grid_position, GRID_SIZE));
                const root = game.renderer.ui_node_action.element_root;
                const rect = root.getBoundingClientRect();
                const max_x = game.renderer.window_size[0] - rect.width  - MARGIN;
                const max_y = game.renderer.window_size[1] - rect.height - MARGIN;
                const x = clamp(window_position[0] - rect.width * 0.5, MARGIN, max_x);
                const y = clamp(window_position[1] - rect.height - 12 - 8*game.renderer.camera_main.zoom, MARGIN, max_y);
                root.style.left = `${x}px`;
                root.style.top  = `${y}px`;
            }

            if (frame_start_theme !== game.theme) {
                ui_set_theme_color(THEMES[game.theme].color);
            }

            // :render entities
            if (game.draw_entities) {
                for (let entity_index = 0; entity_index < game.entities.count; entity_index++) {
                    const entity = game.entities.data[entity_index];

                    if (entity.animation.active) {
                        const sprite = Object.assign({}, entity.sprite);
                        const frames = entity.animation.animations[entity.animation.current_animation];
                        sprite.texture_position = frames[entity.animation.current_frame];
                        if (now >= entity.animation.frame_started_at + entity.animation.frame_duration) {
                            entity.animation.frame_started_at = now;
                            entity.animation.current_frame = (entity.animation.current_frame + 1) % frames.length;
                        }
                        fixed_array_add(game.renderer.sprites, sprite);
                    } else {
                        fixed_array_add(game.renderer.sprites, entity.sprite);
                    }
                }

                // :render nodes
                for (let node_index = 0; node_index < game.nodes.count; node_index++) {
                    const node = game.nodes.data[node_index];
                    let texture_position: Vector2 = [288, 144];
                    let texture_size    : Vector2 = [16, 16];
                    switch (node.type) {
                        case Node_Type.EMPTY: { } break;
                        case Node_Type.PROJECT: {
                            texture_position = [304, 144];
                        } break;
                        case Node_Type.WARP: {
                            texture_position = [144, 432];
                            texture_size     = [48, 48];
                        } break;
                        case Node_Type.INFO: {
                            texture_position = [192, 432];
                            texture_size     = [48, 48];
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
                        position:           [tile_position[0]*GRID_SIZE - GRID_SIZE*0.5, tile_position[1]*GRID_SIZE - GRID_SIZE*0.5],
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
            // TODO: don't do this in __RELEASE__
            if (game.draw_console) {
                ui_push_console_line("fps:                " + game.fps.toFixed(0));
                ui_push_console_line("world_mode:         " + game.world_mode);
                ui_push_console_line("game_mode:          " + game.game_mode);
                ui_push_console_line("draw_console:       " + game.draw_console);
                ui_push_console_line("draw_world_grid:    " + game.draw_world_grid);
                ui_push_console_line("draw_world_tile:    " + game.draw_world_tile);
                ui_push_console_line("draw_entities:      " + game.draw_entities);
                ui_push_console_line("draw_tiles:         " + game.draw_tiles);
                ui_push_console_line("window_size:        " + game.renderer.window_size);
                ui_push_console_line("pixel_ratio:        " + game.renderer.pixel_ratio);
                ui_push_console_line("camera_position:    " + game.renderer.camera_main.position);
                ui_push_console_line("camera_zoom:        " + game.renderer.camera_main.zoom);
                ui_push_console_line("mouse_position:     " + game.inputs.mouse_position);
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

        game.animation_frame = requestAnimationFrame(update);
    } catch(error) {
        if (!__RELEASE__) document.body.style.borderTop = "4px solid red";
        // TODO: better error handling for release
        console.error(error);
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
    game_root:          HTMLDivElement;
    ui_root:            HTMLDivElement;
    ui_console:         HTMLPreElement;
    ui_node_project:    UI_Panel;
    ui_node_action:     UI_Label_Node;
    ui_theme_color:     HTMLMetaElement;
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
    // We don't wan't odd sizes because our renderer is very dumb and can't handle that right now
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

    // if (!__RELEASE__) console.log("window_size", game.renderer.window_size, "pixel_ratio", game.renderer.pixel_ratio);
}
function renderer_init(prefers_dark_theme: boolean): [Renderer, true] | [null, false] {
    const game_root = ui_create_element<HTMLDivElement>(document.body, `<div id="worldmap"></div>`);

    const canvas = ui_create_element<HTMLCanvasElement>(game_root, `<canvas id="main"></canvas>`);
    const _gl = canvas.getContext("webgl2");
    if (_gl === null) {
        return [null, false];
    }

    const offscreen = ui_create_element<HTMLCanvasElement>(game_root, `<canvas id="offscreen" style="display: none;"></canvas>`)
    const offscreen_context = offscreen.getContext("2d");
    if (offscreen_context === null) {
        return [null, false];
    }

    const ui_root = ui_create_element<HTMLDivElement>(game_root, `<div id="ui_root"></div>`);

    ui_create_element<HTMLLabelElement>(ui_root, `
        <a href="/" class="hud_label back">
            <span class="content">
                <span class="label">‹ Homepage</span>
            </span>
        </a>
    `);
    ui_create_element<HTMLLabelElement>(ui_root, `
        <a href="mailto:work@colinbellino.com" class="hud_label contact">
            <span class="content">
                <span class="label">Contact me</span>
            </span>
        </a>
    `);

    // const up_root = ui_create_element<HTMLLabelElement>(ui_root, `
    //     <label class="hud_label anchor_left no_label hide up" for="up">
    //         <span class="content">
    //             <span class="label"></span>
    //             <button class="hud_icon icon_up" aria-label="Move: up">
    //                 ${ICON_KEYBOARD_ARROW_UP}
    //             </button>
    //         </span>
    //     </label>
    // `);
    // const up_button = up_root.querySelector(".content button") as HTMLButtonElement;
    // up_button.addEventListener("click", input_send_key.bind(null, Keyboard_Key.ArrowUp), false);
    // const ui_up: UI_Label = { element_root: up_root, element_button: up_button, element_label: up_root.querySelector(".content .label") };

    // const right_root = ui_create_element<HTMLLabelElement>(ui_root, `
    //     <label class="hud_label anchor_left no_label hide right">
    //         <span class="content">
    //             <span class="label"></span>
    //             <button class="hud_icon icon_right" aria-label="Move: right">
    //                 ${ICON_KEYBOARD_ARROW_UP}
    //             </button>
    //         </span>
    //     </label>
    // `);
    // const right_button = right_root.querySelector(".content button") as HTMLButtonElement;
    // right_button.addEventListener("click", input_send_key.bind(null, Keyboard_Key.ArrowRight), false);
    // const ui_right: UI_Label = { element_root: right_root, element_button: right_button, element_label: right_root.querySelector(".content .label") };

    // const down_root = ui_create_element<HTMLLabelElement>(ui_root, `
    //     <label class="hud_label anchor_left no_label hide down">
    //         <span class="content">
    //             <span class="label"></span>
    //             <button class="hud_icon icon_down" aria-label="Move: down">
    //                 ${ICON_KEYBOARD_ARROW_UP}
    //             </button>
    //         </span>
    //     </label>
    // `);
    // const down_button = down_root.querySelector(".content button") as HTMLButtonElement;
    // down_button.addEventListener("click", input_send_key.bind(null, Keyboard_Key.ArrowDown), false);
    // const ui_down: UI_Label = { element_root: down_root, element_button: down_button, element_label: down_root.querySelector(".content .label") };

    // const left_root = ui_create_element<HTMLLabelElement>(ui_root, `
    //     <label class="hud_label anchor_left no_label hide left">
    //         <span class="content">
    //             <span class="label"></span>
    //             <button class="hud_icon icon_left" aria-label="Move: left">
    //                 ${ICON_KEYBOARD_ARROW_UP}
    //             </button>
    //         </span>
    //     </label>
    // `);
    // const left_button = left_root.querySelector(".content button") as HTMLButtonElement;
    // left_button.addEventListener("click", input_send_key.bind(null, Keyboard_Key.ArrowLeft), false);
    // const ui_left: UI_Label = { element_root: left_root, element_button: left_button, element_label: left_root.querySelector(".content .label") };

    // const confirm_root = ui_create_element<HTMLLabelElement>(ui_root, `
    //     <label class="hud_label hide confirm">
    //         <span class="content">
    //             <span class="label"></span>
    //             <button class="hud_icon icon_confirm" aria-label="Confirm">
    //                 ${ICON_KEYBOARD_ENTER}
    //             </button>
    //         </span>
    //     </label>
    // `);
    // const confirm_button = confirm_root.querySelector(".content button") as HTMLButtonElement;
    // confirm_button.addEventListener("click", input_send_key.bind(null, Keyboard_Key.Enter), false);
    // const ui_confirm: UI_Label = { element_root: confirm_root, element_button: confirm_button, element_label: confirm_root.querySelector(".content .label") };

    // const cancel_root = ui_create_element<HTMLLabelElement>(ui_root, `
    //     <label class="hud_label hide cancel">
    //         <span class="content">
    //             <span class="label"></span>
    //             <button class="hud_icon icon_cancel" aria-label="Cancel">
    //                 ${ICON_KEYBOARD_ESCAPE}
    //             </button>
    //         </span>
    //     </label>
    // `);
    // const cancel_button = cancel_root.querySelector(".content button") as HTMLButtonElement;
    // cancel_button.addEventListener("click", input_send_key.bind(null, Keyboard_Key.Escape), false);
    // const ui_cancel: UI_Label = { element_root: cancel_root, element_button: cancel_button, element_label: cancel_root.querySelector(".content .label") };

    const node_action_root = ui_create_element<HTMLLabelElement>(ui_root, `
        <label class="hud_label anchor_bottom node_action hide">
            <span class="image_container"><img width="${THUMBNAIL_SIZE[0]}" height="${THUMBNAIL_SIZE[1]}" src="${PROJECTS_IMAGE_URL}" /></span>
            <span class="content">
                <span class="label"></span>
                <button class="hud_icon icon_confirm" aria-label="Confirm">
                    ${ICON_KEYBOARD_ENTER}
                </button>
            </span>
        </label>
    `);
    const node_action_button = node_action_root.querySelector(".content button") as HTMLButtonElement;
    node_action_button.addEventListener("click", input_send_key.bind(null, Keyboard_Key.Enter), false);
    const node_action_image = node_action_root.querySelector("img");
    node_action_image.width = THUMBNAIL_SIZE[0]*0.5;
    node_action_image.height = THUMBNAIL_SIZE[1]*0.5*THUMBNAIL_MAX;
    const ui_node_action: UI_Label_Node = { element_root: node_action_root, element_button: node_action_button, element_label: node_action_root.querySelector(".content .label"), element_image: node_action_image };
    assert(ui_node_action.element_root !== undefined);
    assert(ui_node_action.element_button !== undefined);
    assert(ui_node_action.element_label !== undefined);
    assert(ui_node_action.element_image !== undefined);

    // TODO: disable this in __RELEASE__
    const ui_console = ui_create_element<HTMLPreElement>(ui_root, `<pre class="ui_console"></pre>`);

    const ui_node_project = ui_create_panel(ui_root, input_send_key.bind(null, Keyboard_Key.Escape));

    const ui_theme_color = prefers_dark_theme
        ? document.head.querySelector<HTMLMetaElement>(`meta[name="theme-color"][media="(prefers-color-scheme: dark)"]`)
        : document.head.querySelector<HTMLMetaElement>(`meta[name="theme-color"]`)
    ;

    const renderer: Renderer = {
        camera_main:        CAMERA_DEFAULT,
        sprites:            fixed_array_make(MAX_SPRITES),
        window_size:        [0, 0],
        pixel_ratio:        1.0,
        gl:                 _gl,
        offscreen:          offscreen_context,
        game_root:          game_root,
        ui_root:            ui_root,
        ui_console:         ui_console,
        ui_node_project:    ui_node_project,
        ui_node_action:     ui_node_action,
        ui_theme_color:     ui_theme_color,
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
    touch_start_x:              int;
    touch_start_y:              int;
    touch_end_x:                int;
    touch_end_y:                int;
    touch_down:                 boolean;
    touch_released:             boolean;
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
    // NONE,
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
        touch_start_x:          -1,
        touch_start_y:          -1,
        touch_end_x:            -1,
        touch_end_y:            -1,
        touch_down:             false,
        touch_released:         false,
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
        if (!__RELEASE__) console.warn("Unrecognized key:", event.code);
        return;
    }
    const key_state = game.inputs.keys[event.code as Keyboard_Key];
    key_state.down = event.type === "keydown";
    key_state.released = event.type === "keyup";
    key_state.pressed = event.type === "keydown";
}
function inputs_on_touch_start(e: TouchEvent) {
    game.inputs.touch_start_x = e.changedTouches[0].screenX;
    game.inputs.touch_start_y = e.changedTouches[0].screenY;
    game.inputs.touch_end_x = -1;
    game.inputs.touch_down = true;

    const key_state = game.inputs.mouse_keys[Mouse_Key.LEFT];
    key_state.down = event.type === "keydown";
    key_state.released = event.type === "keyup";
    key_state.pressed = event.type === "keydown";
}
function inputs_on_touch_end(event: TouchEvent) {
    game.inputs.touch_end_x = event.changedTouches[0].screenX;
    game.inputs.touch_end_y = event.changedTouches[0].screenY;
    game.inputs.touch_down = false;
    game.inputs.touch_released = true;
}
function inputs_on_mouse_move(event: MouseEvent) {
    game.inputs.mouse_position[0] = event.clientX;
    game.inputs.mouse_position[1] = event.clientY;
}
function inputs_on_mouse_click(event: MouseEvent) {
    const key_state = game.inputs.mouse_keys[event.button as Mouse_Key];
    key_state.down = true;
    key_state.pressed = true;
    key_state.reset_next_frame = true;
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
    if (inputs.touch_released) {
        inputs.touch_start_x = -1;
        inputs.touch_start_y = -1;
        inputs.touch_end_x = -1;
        inputs.touch_end_y = -1;
        inputs.touch_released = false;
        inputs.touch_down = false;
    }
}
function input_send_key(key: Keyboard_Key): void {
    game.inputs.keys[key].triggered = true;
    // This is to ensure sure we don't keep a focus on the button since this will break keyboard navigation.
    (document.activeElement as any).blur();
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
function load_image(url: string): Promise<HTMLImageElement> {
    const image = new Image();
    image.src = url;
    return new Promise((resolve, reject) => {
        image.onload = function(_event: Event) {
            // console.log("Image loaded:", url);
            resolve(image);
        };
        image.onerror = function() {
            reject(`Image couldn't be loaded:${url}`);
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
        (world_position[0] * camera.zoom) + (game.renderer.window_size[0] * 0.5) - (camera.position[0] * camera.zoom),
        (world_position[1] * camera.zoom) + (game.renderer.window_size[1] * 0.5) - (camera.position[1] * camera.zoom),
    ];
}
function window_to_world_position(window_position: Vector2): Vector2 {
    const camera = game.renderer.camera_main;
    return [
        // start position   - offset to top/left                   + camera offset
        (window_position[0] - (game.renderer.window_size[0] * 0.5) + (camera.position[0] * camera.zoom)) / camera.zoom,
        (window_position[1] - (game.renderer.window_size[1] * 0.5) + (camera.position[1] * camera.zoom)) / camera.zoom,
    ];
}
function project_screenshot_url(project: Project, image_index: int, variant: string = "small"): string {
    if (image_index === 0) {
        return `/site/images/screenshots/${project.screenshots_prefix}/banner-${variant}.png`;
    }
    return `/site/images/screenshots/${project.screenshots_prefix}/screenshot${image_index}-${variant}.png`;
}
// Somehow, changing the mouse cursor on mobile Chrome makes the screen flashes... this is fine 🔥
function set_mouse_cursor(cursor: string) {
    if (matchMedia("(pointer:fine)").matches) {
        document.body.style.cursor = cursor;
    }
}

// :debug
// function log_matrix(matrix: Matrix4) {
//     let str = "";
//     for (let i = 0; i < matrix.length; i++) {
//         if (i > 0 && i % 4 === 0) {
//             str += "\n";
//         }
//         str += `${matrix[i].toString().padStart(4)}, `;
//     }
//     console.log(str);
// }
// function number_to_binary_string(dec: number, size: number = 4): string {
//     return (dec >>> 0).toString(2).padStart(size, "0");
// }
function timer_progress(start: number, end: number, now: number): float {
    const duration = end - start;
    const progress = 1 - ((end - now) / duration);
    return progress;
}
function no_op(): void {}

// :math
function aabb_collides(a_position: Vector2, a_size: Vector2, b_position: Vector2, b_size: Vector2): boolean {
    return (
        a_size[0] != 0 && a_size[1] != 0 && b_size[0] != 0 && b_size[1] != 0 &&
        a_position[0] < b_position[0] + b_size[0] &&
        a_position[0] + a_size[0] > b_position[0] &&
        a_position[1] < b_position[1] + b_size[1] &&
        a_position[1] + a_size[1] > b_position[1]
    )
}
function manhathan_distance(a: Vector2, b: Vector2): int {
    return (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]));
}
function color_to_hex(hex_rgba: Color): number {
    return ((hex_rgba[0] << 16) + (hex_rgba[1] << 8) + hex_rgba[2]);
}
function hex_to_color(hex_rgb: number): Color {
    const color = new Array(4) as Color;
    color[0] = ((hex_rgb >> 16) & 0xff) / 255;
    color[1] = ((hex_rgb >> 8) & 0xff) / 255;
    color[2] = ((hex_rgb) & 0xff) / 255;
    color[3] = 1;
    return color;
}
function hex_to_string(hex_rgb: number): string {
    return "#"+hex_rgb.toString(16).padStart(6, "0");
}
function vector2_equal(vec1: Vector2, vec2: Vector2): boolean {
    return vec1[0] === vec2[0] && vec1[1] === vec2[1];
}
function vector2_multiply_float(arr1: Vector2, value: float): Vector2 {
    const result: Vector2 = [0, 0];
    result[0] = arr1[0] * value;
    result[1] = arr1[1] * value;
    return result;
}
function vector2_substract(arr1: Vector2, arr2: Vector2): Vector2 {
    const result: Vector2 = [0, 0];
    result[0] = arr1[0] - arr2[0];
    result[1] = arr1[1] - arr2[1];
    return result;
}
function vector2_lerp(a: Vector2, b: Vector2, t: float): Vector2 {
    const result: Vector2 = [0, 0];
    result[0] = a[0] + t * (b[0] - a[0]);
    result[1] = a[1] + t * (b[1] - a[1]);
    return result;
}
function vector4_lerp(a: Vector4, b: Vector4, t: float): Vector4 {
    const result: Vector4 = [0, 0, 0, 0];
    result[0] = a[0] + t * (b[0] - a[0]);
    result[1] = a[1] + t * (b[1] - a[1]);
    result[2] = a[2] + t * (b[2] - a[2]);
    result[3] = a[3] + t * (b[3] - a[3]);
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
// function sin_01(time: float, frequency: float = 1.0): float {
//     return 0.5 * (1 + Math.sin(2 * Math.PI * frequency * time));
// }
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
// function matrix4_transpose(m: Matrix4): Matrix4 {
//     const result = matrix4_zero();

//     result[ 0] = m[0];
//     result[ 1] = m[4];
//     result[ 2] = m[8];
//     result[ 3] = m[12];
//     result[ 4] = m[1];
//     result[ 5] = m[5];
//     result[ 6] = m[9];
//     result[ 7] = m[13];
//     result[ 8] = m[2];
//     result[ 9] = m[6];
//     result[10] = m[10];
//     result[11] = m[14];
//     result[12] = m[3];
//     result[13] = m[7];
//     result[14] = m[11];
//     result[15] = m[15];

//     return result;
// }
// function matrix_4_inverse(m: Matrix4): Matrix4 {
//     const result = matrix4_zero();
//     var m00 = m[0 * 4 + 0];
//     var m01 = m[0 * 4 + 1];
//     var m02 = m[0 * 4 + 2];
//     var m03 = m[0 * 4 + 3];
//     var m10 = m[1 * 4 + 0];
//     var m11 = m[1 * 4 + 1];
//     var m12 = m[1 * 4 + 2];
//     var m13 = m[1 * 4 + 3];
//     var m20 = m[2 * 4 + 0];
//     var m21 = m[2 * 4 + 1];
//     var m22 = m[2 * 4 + 2];
//     var m23 = m[2 * 4 + 3];
//     var m30 = m[3 * 4 + 0];
//     var m31 = m[3 * 4 + 1];
//     var m32 = m[3 * 4 + 2];
//     var m33 = m[3 * 4 + 3];
//     var tmp_0  = m22 * m33;
//     var tmp_1  = m32 * m23;
//     var tmp_2  = m12 * m33;
//     var tmp_3  = m32 * m13;
//     var tmp_4  = m12 * m23;
//     var tmp_5  = m22 * m13;
//     var tmp_6  = m02 * m33;
//     var tmp_7  = m32 * m03;
//     var tmp_8  = m02 * m23;
//     var tmp_9  = m22 * m03;
//     var tmp_10 = m02 * m13;
//     var tmp_11 = m12 * m03;
//     var tmp_12 = m20 * m31;
//     var tmp_13 = m30 * m21;
//     var tmp_14 = m10 * m31;
//     var tmp_15 = m30 * m11;
//     var tmp_16 = m10 * m21;
//     var tmp_17 = m20 * m11;
//     var tmp_18 = m00 * m31;
//     var tmp_19 = m30 * m01;
//     var tmp_20 = m00 * m21;
//     var tmp_21 = m20 * m01;
//     var tmp_22 = m00 * m11;
//     var tmp_23 = m10 * m01;

//     var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
//         (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
//     var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
//         (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
//     var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
//         (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
//     var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
//         (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

//     var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

//     result[0] = d * t0;
//     result[1] = d * t1;
//     result[2] = d * t2;
//     result[3] = d * t3;
//     result[4] = d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
//           (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
//     result[5] = d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
//           (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
//     result[6] = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
//           (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
//     result[7] = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
//           (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
//     result[8] = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
//           (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
//     result[9] = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
//           (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
//     result[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
//           (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
//     result[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
//           (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
//     result[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
//           (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
//     result[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
//           (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
//     result[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
//           (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
//     result[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
//           (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));

//     return result;
// }
// function matrix4_rotate_z(m: Matrix4, angle_in_radians: float): Matrix4 {
//     const result = matrix4_zero();

//     var m00 = m[0 * 4 + 0];
//     var m01 = m[0 * 4 + 1];
//     var m02 = m[0 * 4 + 2];
//     var m03 = m[0 * 4 + 3];
//     var m10 = m[1 * 4 + 0];
//     var m11 = m[1 * 4 + 1];
//     var m12 = m[1 * 4 + 2];
//     var m13 = m[1 * 4 + 3];
//     var c = Math.cos(angle_in_radians);
//     var s = Math.sin(angle_in_radians);

//     result[ 0] = c * m00 + s * m10;
//     result[ 1] = c * m01 + s * m11;
//     result[ 2] = c * m02 + s * m12;
//     result[ 3] = c * m03 + s * m13;
//     result[ 4] = c * m10 - s * m00;
//     result[ 5] = c * m11 - s * m01;
//     result[ 6] = c * m12 - s * m02;
//     result[ 7] = c * m13 - s * m03;

//     if (m !== result) {
//       result[ 8] = m[ 8];
//       result[ 9] = m[ 9];
//       result[10] = m[10];
//       result[11] = m[11];
//       result[12] = m[12];
//       result[13] = m[13];
//       result[14] = m[14];
//       result[15] = m[15];
//     }

//     return result;
// }

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
        button.element_root.classList.remove("hide", "thumbnail");
    }
}
function ui_label_hide(button: UI_Label): void {
    button.element_root.classList.add("hide");
}
function ui_node_show(node: Map_Node) {
    const action = ui_get_node_action(node);
    // const tooltip = ui_get_node_tooltip(node);
    if (node.project_id > 0) {
        ui_label_node_show(game.renderer.ui_node_action, action, node.project_id);
    } else {
        ui_label_show(game.renderer.ui_node_action, action);
    }
}
function ui_label_node_show(button: UI_Label_Node, label: string, project_id: int): void {
    if (label) {
        button.element_label.innerHTML = label;
    }
    button.element_root.classList.remove("hide");
    button.element_root.classList.add("thumbnail");
    button.element_image.style.marginTop = `-${project_id*THUMBNAIL_SIZE[1]*0.5}px`;
}
function ui_panel_show(panel: UI_Panel, title: string, content: string, link: string, full_size: boolean = true): void {
    if (link) {
        panel.element_title.innerHTML = `<a href="${link}" target="_blank" rel="noopener">${title}</a>`;
    } else {
        panel.element_title.innerHTML = title;
    }
    panel.element_content.innerHTML = content;
    panel.element_root.classList.remove("hide");
    if (full_size) { panel.element_root.classList.add("full_size"); }
    else           { panel.element_root.classList.remove("full_size"); }
}
function ui_panel_hide(button: UI_Panel): void {
    button.element_root.classList.add("hide");
}
function ui_get_node_action(node: Map_Node): string {
    let label = "";
    switch (node.type) {
        case Node_Type.PROJECT: { label = `Open project`; } break;
        case Node_Type.WARP:    { label = `Warp to ${node.tooltip}`; } break;
        case Node_Type.INFO:    { label = `Examine`; } break;
    }
    return label;
}
function ui_create_element<T>(ui_root: HTMLElement, html: string): T {
    const parent = document.createElement("div");
    parent.innerHTML = html.trim();
    return ui_root.appendChild(parent.firstChild) as T;
}
function ui_create_panel(ui_root: HTMLDivElement, close_callback: (this: HTMLButtonElement, ev: MouseEvent) => any): UI_Panel {
    const panel_root = ui_create_element<HTMLElement>(ui_root, `
        <section class="panel hide">
            <header>
                <h2></h2>
                <button class="close" aria-label="Close">
                    ${ICON_CLOSE}
                </button>
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
    panel.element_root.addEventListener("click", function panel_root_click(event: MouseEvent) {
        event.stopPropagation();
    });
    panel.element_close.addEventListener("click", close_callback);
    return panel;
}
function ui_set_element_class(element: HTMLElement, class_name: string, value: boolean) {
    if (value) {
        element.classList.add(class_name);
    } else {
        element.classList.remove(class_name);
    }
}
function ui_set_theme_color(color: int) {
    game.clear_color = hex_to_color(color);
    game.renderer.ui_theme_color.setAttribute("content", hex_to_string(color));
    game.renderer.game_root.style.background = hex_to_string(color);
    document.body.style.background = hex_to_string(color);
}

// :data
type Project = {
    id:                 int;
    name:               string;
    url:                string;
    description:        string[];
    screenshots_prefix: string;
    screenshots_count:  int;
}
const PROJECTS: Project[] = [
    {
        id: 0,
        name: "Secret project",
        url: "",
        description: [],
        screenshots_prefix: "",
        screenshots_count: 0,
    },
    {
        id: 1,
        name: "About me",
        url: "",
        description: [
            `<p>Hi there! I’m Colin, a french engineer who fell in love with programming and creating great applications, tools, sites and video games!</p>`,
            `<p>For more than 20 years, I’ve been coding, tinkering and prototyping with many technologies from C to JavaScript, from Jai to Go, from web apps to video games.<br>Over the years, I’ve developed a taste for rapid prototyping and a good intuition for building good experiences for my users and clients.</p>`,
            `<p>You can find my résumé <a href="/CV - Colin Bellino.pdf" target="_blank" rel="noopener">here</a>.</p>`,
            `<p>Now, I’m working as a contractor to build robust front-end applications and share all that I learned along the way.<br>Here are some of the services I provide to my clients:</p>`,
            `<ul class="services">`,
                `<li>Creation of performant and accessible applications.</li>`,
                `<li>Writing new functionalities in React, Vue, JavaScript or TypeScript.</li>`,
                `<li>Technical audit of the front-end architecture (performance, accessiblity, etc).</li>`,
                `<li>Creation of Progressive Web Apps (PWAs).</li>`,
                `<li>Strategy for web apps/sites performance.</li>`,
                `<li>Advice and training in performance optimisations (front-end, tools & back-end).</li>`,
                `<li>Development of back-end applications and tools (TypeScript, Go, C, etc).</li>`,
                `<li>Development of video games (C, C#, TypeScript, WebGL, WebGPU, Unity, Godot, etc).</li>`,
            `</ul>`,
            `<p><br /><b>Current status: looking for interesting projects and clients to work with.</b></p>`,
        ],
        screenshots_prefix: "",
        screenshots_count: 0,
    },
    {
        id: 2,
        name: "Monstrum Prison",
        url: "https://colinbellino.itch.io/monstrum-prison",
        description: [
            `<p>This is a mini 2D first person dungeon crawler where you befriend weird creatures and try to escape the dungeon someone threw you in.</p>`,
            `<p>The game was created in the span of a week for the 7DFPS game jam. The engine is entirely made from scratch by me and all the art and audio was made by the rest of the team :)</p>`,
            `<ul class="bullets">`,
                `<li>Engine: Custom engine (JAI)</li>`,
                `<li>Art: <a href="https://beowulfus-universum.itch.io/" target="_blank" rel="noopener">Beowulfus Universum</a></li>`,
                `<li>Audio: <a href="https://x.com/risu_ika" target="_blank" rel="noopener">Squirrelsquid</a></li>`,
            `</ul>`,
        ],
        screenshots_prefix: "monstrum",
        screenshots_count: 6,
    },
    {
        id: 3,
        name: "The Legend of Ján Ïtor",
        url: "https://colinbellino.itch.io/the-legend-of-jan-itor",
        description: [
            `<p>A small game where adventurers are spreading a lot of slime and other mess in the dungeon and you are the one tasked to clean it up before it becomes out of hand.</p>`,
            `<p>The game was created over a period of 2 weeks by a team of 3 people, this is a submission for the Pirate Game Jam 14.</p>`,
            `<ul class="bullets">`,
                `<li>Engine: Custom engine (Odin)</li>`,
                `<li><a href="https://github.com/colinbellino/pirate-jam-14" target="_blank" rel="noopener">Source code</a></li>`,
                `<li>Animation & design: <a href="https://tillerqueen.itch.io" target="_blank" rel="noopener">TillerQueen</a></li>`,
                `<li>Tileset & design: <a href="https://flippixel.itch.io/" target="_blank" rel="noopener">Flip</a></li>`,
            `</ul>`,
        ],
        screenshots_prefix: "janitor",
        screenshots_count: 3,
    },
    {
        id: 4,
        name: "Feast or Famine",
        url: "https://colinbellino.itch.io/feast",
        description: [
            `<p>A twin stick shooter created in 72 hours with a team of 4 (art, audio & code) for the Ludum Dare 50 game jam.</p>`,
            `<p>Search the rooms of your manor and deal with any enemies you come across. Defeat every enemy to progress to the next level. But be quick because your health is constantly draining!</p>`,
            `<ul class="bullets">`,
                `<li>Engine: Unity (C#)</li>`,
                `<li><a href="https://github.com/colinbellino/ludum-dare-50" target="_blank" rel="noopener">Source code</a></li>`,
                `<li>Art & design: <a href="https://sjpixels.itch.io/" target="_blank" rel="noopener">Scott "SJPixels" Welfare</a></li>`,
                `<li>Audio & design: <a href="https://itch.io/profile/brandyncampbell" target="_blank" rel="noopener">Brandyn "RandyRude" Campbell</a></li>`,
                `<li>Code & design: <a href="https://github.com/KyleWelfare" target="_blank" rel="noopener">Kyle  Welfare</a></li>`,
            `</ul>`,
        ],
        screenshots_prefix: "feast",
        screenshots_count: 3,
    },
    {
        id: 5,
        name: "Alteration",
        url: "",
        description: [
            `<p>A puzzle game created in 72 hours with a team of 3 (art, audio & code) for the Ludum Dare 49 game jam.</p>`,
            `<p>You are playing as your astral projection, which is thrown into a surreal maze and your goal is to reach perfect balance, symbolized by the goal of each level. <br /> But beware as your mind is yet unbalanced your mood will change your form every couple of turns.</p>`,
            `<ul class="bullets">`,
                `<li>Engine: Unity (C#)</li>`,
                `<li><a href="https://github.com/colinbellino/ludum-dare-49" target="_blank" rel="noopener">Source code</a></li>`,
                `<li>Art & design: <a href="https://cyangmou.itch.io/" target="_blank" rel="noopener">Thomas "Cyangmou" Feichtmeir</a></li>`,
                `<li>Audio & design: <a href="https://andrewlivecchi.com/" target="_blank" rel="noopener">Andrew LiVecchi</a></li>`,
            `</ul>`,
        ],
        screenshots_prefix: "alteration",
        screenshots_count: 5,
    },
    {
        id: 6,
        name: "Snowball",
        url: "https://colinbellino.itch.io/snowball",
        description: [
            `<p>A minimalist Tactical RPG game created in about a month as a solo project (art, audio & code) as a small challenge for myself (in a month).</p>`,
            `<p>I wanted to make a game about kids playing outside and throwing snowballs around and also wondered how a battle system like this would work in a side view game. So, i've combined the two to make Snowball ⛄!</p>`,
            `<ul class="bullets">`,
                `<li>Engine: Unity (C#)</li>`,
                `<li><a href="https://github.com/colinbellino/snowball" target="_blank" rel="noopener">Source code</a></li>`,
            `</ul>`,
        ],
        screenshots_prefix: "snowball",
        screenshots_count: 4,
    },
    {
        id: 7,
        name: "Flight",
        url: "https://colinbellino.itch.io/flight",
        description: [
            `<p>An unfinished platformer game created in 72 hours with a team of two for the Indie Tales 2021 game jam.</p>`,
            `<p>Flight is a game about an explorer stranded on an unknown land that needs to fix their ship with the power of other birds.</p>`,
            `<ul class="bullets">`,
                `<li>Engine: Unity (C#)</li>`,
                `<li><a href="https://github.com/colinbellino/indie-tales-2021" target="_blank" rel="noopener">Source code</a></li>`,
                `<li>Art & design: <a href="https://www.lauradp.work/" target="_blank" rel="noopener">Laura De Pascale</a></li>`,
            `</ul>`,
        ],
        screenshots_prefix: "flight",
        screenshots_count: 2,
    },
    {
        id: 8,
        name: "Bonbon and the Deep Below",
        url: "https://colinbellino.itch.io/bonbon",
        description: [
            `<p>A platformer game created in 72 hours with a team of three for the Ludum Dare 48 game jam.</p>`,
            `<p>Help Bonbon the hare 🐇 flee this mechanical nightmare! Go deeper and deeper into the ground to escape death from above.</p>`,
            `<ul class="bullets">`,
                `<li>Engine: Unity (C#)</li>`,
                `<li><a href="https://github.com/colinbellino/ludum-dare-48" target="_blank" rel="noopener">Source code</a></li>`,
                `<li>Art & design: <a href="https://www.lauradp.work/" target="_blank" rel="noopener">Laura De Pascale</a></li>`,
                `<li>Audio & design: <a href="https://soundcloud.com/calartist" target="_blank" rel="noopener">PronomicalArtist</a></li>`,
            `</ul>`,
        ],
        screenshots_prefix: "bonbon",
        screenshots_count: 3,
    },
    {
        id: 9,
        name: "Chipsmarket (Precogs)",
        url: "https://www.chipsmarket.com/",
        description: [
            `<p>A Business-to-Business international marketplace for electronic parts.</p>`,
            `<p>I was tasked to prepare the new version of the application (the new onboarding screens, improved workflows, etc) in collaboration with the CTO and the rest of the tech team.</p>`,
            `<p>We started with mockups and discussions with the design team, then i iterated on the new version of the application, making a feedback loop as soon as possible.</p>`,
            `<p>The team seemed interested in performance aware programming and my input on architecture decisions, so i took the time to share my knowledge on these subjects when that felt appropriate.</p>`,
            `<p>After a prototyping period and much discussion with the team, we settled on the tech stack below:</p>`,
            `<ul class="bullets">`,
                `<li>Frontend: Vue3 / TypeScript / Tailwind</li>`,
                `<li>Backend: Node / TypeScript / Express / PostgreSQL</li>`,
                `<li>AWS: cloud functions, pub/sub, etc</li>`,
                `<li>Testing: Jest / Cypress / Github Actions / Storybook / Chromatic</li>`,
            `</ul>`,
        ],
        screenshots_prefix: "precogs",
        screenshots_count: 4,
    },
    {
        id: 10,
        name: "MyPhotos (Hubside)",
        url: "https://photos.hubside.com",
        description: [
            `<p>A Web App to regroup all your photos in one place and easily/safely share them online.</p>`,
            `<p>I was on the project from the first line of code to the MVP release, we worked hand in hand with the product owner, designers and developers to create something we could be proud of. A lot of work went into the architecture of the app, to make sure it runs and scales smoothly on GCP and is easy to maintain.</p>`,
            `<p>The backend revolves around a GraphQL schema that is shared with the frontend and iOS app to facilitate communications.</p>`,
            `<p>The frontend is a React app written in TypeScript that uses Apollo to manage data and caching. Components were written in Storybook by following the Atomic Design guidelines as much as possible.</p>`,
            `<ul class="bullets">`,
                `<li>React / TypeScript / Apollo client / CSS Modules</li>`,
                `<li>Node / TypeScript / Apollo server / Express</li>`,
                `<li>Google Cloud Platform : datastore, storage, app engine, functions, pub/sub</li>`,
                `<li>Jest / Cypress / Gitlab CI / Storybook / Chromatic</li>`,
            `</ul>`,
        ],
        screenshots_prefix: "hubside",
        screenshots_count: 3,
    },
    {
        id: 11,
        name: "Bi-BOP: Supply chain (Renault)",
        url: "https://www.linkedin.com/company/renault-digital/",
        description: [
            `<p>A large single page application used by the supply chain team at Renault.</p>`,
            `<p>We created the UI components, code the logic to connect them to the backend (a JSON API that we also developed), discuss potential UX problems with the team among other things.</p>`,
            `<p>I mainly worked on the frontend, i was involved in most technical decisions with the other developers, code review, code quality control and made multiple improvements to our tooling to avoid regressions and quality of our frontend. Formation of the new developers and transfert of knowledge to the new team that will continue the project.</p>`,
            `<ul class="bullets">`,
                `<li>React / Redux / Styled components</li>`,
                `<li>NodeJS / FeathersJS / Docker</li>`,
                `<li>Jest / Cypress / Storybook</li>`,
                `<li>Tests (unit and integration) / Performance tuning / Style guide / Docs</li>`,
            `</ul>`,
        ],
        screenshots_prefix: "renault",
        screenshots_count: 4,
    },
    {
        id: 12,
        name: "World Map",
        url: "https://github.com/colinbellino/site",
        description: [
            `<p>This is the world map mini-game you are currently on :)</p>`,
            `<p>It was built using web technologies as a little fun side project for me to play around with WebGL and TypeScript in a non-work environment.</p>`,
            `<p>Explore the world to see the last projects i worked on, find some easter eggs and see my universe a litte!</p>`,
            `<p>Fun fact: there are two different color schemes/themes for this game, will you find both of them? 👀</p>`,
            `<ul class="bullets">`,
                `<li><a href="https://github.com/colinbellino/site" target="_blank" rel="noopener">Source code</a></li>`,
                `<li>Art (light): <a href="https://bsky.app/profile/cyangmou.bsky.social" target="_blank" rel="noopener">Thomas "Cyangmou" Feichtmeir</a> and <a href="https://bsky.app/profile/akjarosz.bsky.social" target="_blank" rel="noopener">Alex Jarosz</a></li>`,
                `<li>Art (dark) and animations: <a href="https://bsky.app/profile/tillerqueendev.bsky.social" target="_blank" rel="noopener">Nike "TillerQueen" Canalicchio</a></li>`,
            `</ul>`,
        ],
        screenshots_prefix: "worldmap",
        screenshots_count: 4,
    },
];

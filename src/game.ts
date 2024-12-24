declare var __RELEASE__: boolean;

// :shader
const sprite_vs = `
    #version 300 es
    precision highp float;
    precision highp int;

    layout(location=0) in vec2 position;
    layout(location=1) in vec2 uv;
    layout(location=2) in vec4 i_color;
    layout(location=3) in vec4 i_matrix0;
    layout(location=4) in vec4 i_matrix1;
    layout(location=5) in vec4 i_matrix2;
    layout(location=6) in vec4 i_matrix3;
    layout(location=7) in vec2 i_tex_position;
    layout(location=8) in vec2 i_tex_size;

    uniform mat4 u_matrix;

    out vec4 v_color;
    out vec2 v_uv;

    void main() {
        mat4 i_matrix = mat4(i_matrix0, i_matrix1, i_matrix2, i_matrix3);
        gl_Position = u_matrix * i_matrix * (vec4(position, 0, 1));
        v_uv = i_tex_size*uv + i_tex_position;
        v_color = i_color;
    }
`;
const sprite_fs = `
    #version 300 es
    precision highp float;

    uniform sampler2D u_texture;
    in vec4 v_color;
    in vec2 v_uv;
    out vec4 frag_color;

    void main() {
        frag_color = texture(u_texture, v_uv) * v_color;
    }
`;

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
    render_active:          boolean;
    renderer:               Renderer;
    texture0:               WebGLTexture;
    inputs:                 Inputs;
    entities:               Fixed_Size_Array<Entity, typeof MAX_ENTITIES>;
    world_grid:             Static_Array<Sprite, typeof WORLD_GRID_SIZE>;
    tile_grid:              Static_Array<Sprite, typeof TILE_GRID_SIZE>;
    debug_draw_entities:    boolean;
    debug_draw_world_grid:  boolean;
    debug_draw_tile_grid:   boolean;
}
type Entity = {
    name:           string;
    sprite:         Sprite;
}

type Renderer = {
    gl:                 WebGL2RenderingContext;
    sprite_pass:        Sprite_Pass;
    camera_main:        Camera_Orthographic;
    window_size:        Vector2;
    size_changed:       boolean;
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
    size:               Vector2;
    scale:              Vector2;
    rotation:           float;
    color:              Color;
    texture_size:       Vector2;
    texture_position:   Vector2;
    z_index:            int;
}


const WORLD_GRID_WIDTH: int = 24;
const WORLD_GRID_HEIGHT: int = 24;
const WORLD_GRID_SIZE = WORLD_GRID_WIDTH * WORLD_GRID_HEIGHT;
const TILE_GRID_WIDTH: int = 24;
const TILE_GRID_HEIGHT: int = 24;
const TILE_GRID_SIZE = TILE_GRID_WIDTH * TILE_GRID_HEIGHT;
const MAX_ENTITIES : number = 100;
const MAX_SPRITES : number = 2048;
const ENABLE_SPRITE_PASS = true;
const ATLAS_SIZE : Vector2 = [512, 512];
const SPRITE_PASS_INSTANCE_DATA_SIZE = 24;
const COLOR_WHITE: Color = [1, 1, 1, 1];
const COLOR_RED:   Color = [1, 0, 0, 1];
const COLOR_BLUE:  Color = [0, 0, 1, 1];
const COLOR_GREEN:  Color = [0, 1, 0, 1];
const COLOR_YELLOW:  Color = [1, 1, 0, 1];
const COLOR_PINK:  Color = [1, 0, 1, 1];
const COLOR_GREY: Color = [0.5, 0.5, 0.5, 1];
const COLOR_BLACK: Color = [0, 0, 0, 1];

let game: Game;

requestAnimationFrame(main);

function main() {
    // @ts-ignore
    game = {};
    game.entities = fixed_array_make(MAX_ENTITIES);
    game.world_grid = Array(WORLD_GRID_SIZE);
    game.tile_grid = Array(TILE_GRID_SIZE);

    const [renderer, renderer_ok] = renderer_init();
    if (!renderer_ok) {
        console.error("Couldn't initialize renderer.");
        return;
    }

    game.renderer = renderer;
    renderer_update_camera_matrix_main(game.renderer.camera_main);
    game.renderer.camera_main.zoom = 4;
    game.renderer.camera_main.position = [-600, -600];
    if (ENABLE_SPRITE_PASS) {
        game.renderer.sprite_pass = renderer_make_sprite_pass(game.renderer.gl);
        // TODO: Don't render the game while the assets are loading
        load_image("./images/atlas.png").then(image => { game.texture0 = renderer_create_texture(image, game.renderer.gl); });
        // load_image("./images/favicon-16x16.png").then(image => { game.texture0 = renderer_create_texture(image, game.renderer.gl); });
        // load_image("./images/screenshots/hubside/banner-large.jpg").then(image => { renderer_create_texture(image, game.renderer.gl); });
    }

    game.inputs = inputs_init();

    fixed_array_add(game.entities, { name: "ENTITY_0", sprite: { color: COLOR_BLACK,  position: [(10+0)*16, (10+0)*16], size: [16, 16], scale: [1, 1], rotation: 0, texture_size: [16, 16], texture_position: [0, 0], z_index: 9 } });
    fixed_array_add(game.entities, { name: "ENTITY_1", sprite: { color: COLOR_BLUE,   position: [(10+1)*16, (10+0)*16], size: [16, 16], scale: [1, 1], rotation: 0, texture_size: [16, 16], texture_position: [0, 0], z_index: 8 } });
    fixed_array_add(game.entities, { name: "ENTITY_2", sprite: { color: COLOR_RED,    position: [(10+2)*16, (10+0)*16], size: [16, 16], scale: [1, 1], rotation: 0, texture_size: [16, 16], texture_position: [0, 0], z_index: 7 } });
    fixed_array_add(game.entities, { name: "ENTITY_3", sprite: { color: COLOR_GREEN,  position: [(10+0)*16, (10+1)*16], size: [16, 16], scale: [1, 1], rotation: 0, texture_size: [16, 16], texture_position: [0, 0], z_index: 6 } });
    fixed_array_add(game.entities, { name: "ENTITY_4", sprite: { color: COLOR_PINK,   position: [(10+1)*16, (10+1)*16], size: [16, 16], scale: [1, 1], rotation: 0, texture_size: [16, 16], texture_position: [0, 0], z_index: 5 } });
    fixed_array_add(game.entities, { name: "ENTITY_5", sprite: { color: COLOR_YELLOW, position: [(10+2)*16, (10+1)*16], size: [16, 16], scale: [1, 1], rotation: 0, texture_size: [16, 16], texture_position: [16, 0], z_index: 4 } });

    for (let y = 0; y < WORLD_GRID_HEIGHT; y++) {
        for (let x = 0; x < WORLD_GRID_WIDTH; x++) {
            const grid_index = grid_position_to_index([x, y], WORLD_GRID_WIDTH);
            game.world_grid[grid_index] = {
                color:              (x+y)%2 ? COLOR_WHITE : COLOR_GREY,
                position:           [x*16, y*16],
                size:               [16, 16],
                scale:              [1, 1],
                rotation:           0,
                texture_size:       [16, 16],
                texture_position:   [0, 0],
                z_index:            0,
            };
        }
    }
    for (let y = 0; y < TILE_GRID_HEIGHT; y++) {
        for (let x = 0; x < TILE_GRID_WIDTH; x++) {
            const grid_index = grid_position_to_index([x, y], TILE_GRID_WIDTH);
            const color = (x+y)%2 ? COLOR_RED : COLOR_BLUE;
            color[3] = 0.5;
            game.tile_grid[grid_index] = {
                color:              color,
                position:           [x*16+8, y*16+8],
                size:               [16, 16],
                scale:              [1, 1],
                rotation:           0,
                texture_size:       [16, 16],
                texture_position:   [0, 0],
                z_index:            1,
            };
        }
    }

    document.addEventListener("keydown", inputs_on_key, false);
    document.addEventListener("keyup", inputs_on_key, false);

    requestAnimationFrame(update);
}

function update() {
    const gl = game.renderer.gl;

    game.renderer.size_changed = window.innerWidth !== game.renderer.window_size[0] || window.innerHeight !== game.renderer.window_size[1];
    game.renderer.window_size[0] = window.innerWidth;
    game.renderer.window_size[1] = window.innerHeight;
    game.renderer.sprites.count = 0;
    gl.canvas.width = game.renderer.window_size[0];
    gl.canvas.height = game.renderer.window_size[1];

    renderer_update_camera_matrix_main(game.renderer.camera_main);

    const t = sin_01(Date.now(), 1.0 / 2000);

    if (game.inputs.keys["²"].released) {
        game.debug_draw_entities = !game.debug_draw_entities;
    }
    // if (game.inputs.keys["&"].released) {
    //     game.debug_draw_world_grid = !game.debug_draw_world_grid;
    // }
    // if (game.inputs.keys["é"].released) {
    //     game.debug_draw_tile_grid = !game.debug_draw_tile_grid;
    // }
    if (game.inputs.keys["p"].released) {
        game.render_active = !game.render_active;
    }

    if (game.inputs.keys["r"].down) {
        game.renderer.camera_main.zoom = clamp(1, 16, game.renderer.camera_main.zoom + 0.1);
    }
    if (game.inputs.keys["f"].down) {
        game.renderer.camera_main.zoom = clamp(1, 16, game.renderer.camera_main.zoom - 0.1);
    }
    if (game.inputs.keys["z"].down) {
        game.renderer.camera_main.position[1] += game.renderer.camera_main.zoom;
    }
    if (game.inputs.keys["s"].down) {
        game.renderer.camera_main.position[1] -= game.renderer.camera_main.zoom;
    }
    if (game.inputs.keys["q"].down) {
        game.renderer.camera_main.position[0] += game.renderer.camera_main.zoom;
    }
    if (game.inputs.keys["d"].down) {
        game.renderer.camera_main.position[0] -= game.renderer.camera_main.zoom;
    }

    // game.entities.data[1].sprite.rotation = t * 2*Math.PI;
    game.entities.data[1].sprite.scale[0] = 1 + t/5;
    game.entities.data[1].sprite.scale[1] = 1 + t/5;
    // game.entities.data[2].sprite.position[1] = -32 + 64 * t;

    if (game.inputs.keys["ArrowUp"].down) {
        game.entities.data[0].sprite.position[1] -= 1;
    }
    if (game.inputs.keys["ArrowDown"].down) {
        game.entities.data[0].sprite.position[1] += 1;
    }
    if (game.inputs.keys["ArrowLeft"].down) {
        game.entities.data[0].sprite.position[0] -= 1;
    }
    if (game.inputs.keys["ArrowRight"].down) {
        game.entities.data[0].sprite.position[0] += 1;
    }
    if (game.inputs.keys[" "].down) {
        // game.entities.data[2].sprite.scale[0] += 0.1;
        // game.entities.data[2].sprite.scale[1] += 0.1;
        game.entities.data[2].sprite.rotation = t;
    }
    if (game.inputs.keys[" "].released) {
        // game.entities.data[2].sprite.scale[0] = 1;
        // game.entities.data[2].sprite.scale[1] = 1;
        game.entities.data[2].sprite.rotation = 0;
    }

    // :render
    render: {
        if (game.render_active)  { break render; }

        if (game.debug_draw_entities) {
            for (let entity_index = 0; entity_index < game.entities.count; entity_index++) {
                const entity = game.entities.data[entity_index];
                fixed_array_add(game.renderer.sprites, entity.sprite);
            }
        }
        if (game.debug_draw_world_grid) {
            for (let world_cell_index = 0; world_cell_index < WORLD_GRID_SIZE; world_cell_index++) {
                const world_cell = game.world_grid[world_cell_index];
                fixed_array_add(game.renderer.sprites, world_cell);
            }
        }
        if (game.debug_draw_tile_grid) {
            for (let tile_cell_index = 0; tile_cell_index < WORLD_GRID_SIZE; tile_cell_index++) {
                const tile_cell = game.tile_grid[tile_cell_index];
                fixed_array_add(game.renderer.sprites, tile_cell);
            }
        }

        gl.viewport(0, 0, game.renderer.window_size[0], game.renderer.window_size[1]);

        gl.clearColor(0.25, 0.25, 0.25, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (ENABLE_SPRITE_PASS) {
            // TODO: Don't allocate this every frame!
            const sorted_sprites = game.renderer.sprites.data.slice(0, game.renderer.sprites.count);
            sorted_sprites.sort(function sort_by_z_index(a, b) {
                return a.z_index - b.z_index;
            });
            // TODO: Don't recreate this every frame
            let instance_data = new Float32Array(sorted_sprites.length * SPRITE_PASS_INSTANCE_DATA_SIZE);
            const pixel_size : Vector2 = [
                1 / ATLAS_SIZE[0],
                1 / ATLAS_SIZE[1],
            ];
            for (let sprite_index = 0; sprite_index < sorted_sprites.length; sprite_index++) {
                const sprite = sorted_sprites[sprite_index];
                if (sprite === undefined) { break; } // We have reached the end of the sprites (uninitialized are at the bottom)
                let offset = SPRITE_PASS_INSTANCE_DATA_SIZE * sprite_index;

                instance_data.set(sprite.color, offset);
                offset += 4;

                let matrix = matrix4_identity();
                matrix = matrix4_multiply(matrix4_make_scale(sprite.size[0], sprite.size[1], 0), matrix);
                matrix = matrix4_multiply(matrix4_make_scale(sprite.scale[0], sprite.scale[1], 0), matrix);
                matrix = matrix4_multiply(matrix4_make_translation(sprite.position[0], sprite.position[1], 0), matrix);
                matrix = matrix4_rotate_z(matrix, sprite.rotation);
                instance_data.set(matrix, offset);
                offset += 16;

                const texture_position = [
                    sprite.texture_position[0] * pixel_size[0],
                    sprite.texture_position[1] * pixel_size[1],
                ];
                instance_data.set(texture_position, offset);
                offset += 2;

                const texture_size = [
                    sprite.texture_size[0] * pixel_size[0],
                    sprite.texture_size[1] * pixel_size[1],
                ];
                instance_data.set(texture_size, offset);
                offset += 2;
            }

            gl.useProgram(game.renderer.sprite_pass.program);
            gl.uniformMatrix4fv(game.renderer.sprite_pass.location_matrix, false, game.renderer.camera_main.view_projection_matrix);
            gl.bindVertexArray(game.renderer.sprite_pass.vao);
            gl.bindTexture(gl.TEXTURE_2D, game.texture0);
            gl.bindBuffer(gl.ARRAY_BUFFER, game.renderer.sprite_pass.instance_data);
            gl.bufferData(gl.ARRAY_BUFFER, instance_data, gl.STREAM_DRAW);
            gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, game.renderer.sprite_pass.indices as GLintptr, sorted_sprites.length);
        }
    }

    inputs_reset(game.inputs);

    requestAnimationFrame(update);
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
function renderer_init(): [Renderer, true] | [null, false] {
    const canvas = document.querySelector("canvas");
    assert(canvas !== null, "Canvas not found");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const _gl = canvas.getContext("webgl2");
    if (_gl === null) {
        return [null, false];
    }

    // @ts-ignore
    const renderer: Renderer = {};
    renderer.gl = _gl;

    _gl.enable(_gl.BLEND);
    _gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE_MINUS_SRC_ALPHA);

    // @ts-ignore
    renderer.sprite_pass = {};
    renderer.camera_main = CAMERA_DEFAULT;
    renderer.window_size = [window.innerWidth, window.innerHeight];
    renderer.sprites = fixed_array_make(MAX_SPRITES);

    return [renderer, true];
}
function renderer_make_sprite_pass(gl: WebGL2RenderingContext): Sprite_Pass {
    // @ts-ignore
    const pass: Sprite_Pass = {};
    const [program, program_ok] = renderer_create_program(gl, sprite_vs, sprite_fs);
    if (program_ok) {
        pass.program = program;
    }

    const vao = gl.createVertexArray();
    assert(vao !== null);
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
        assert(location_matrix2 != -1, "Couldn't get attrib location i_matrix2");
        gl.enableVertexAttribArray(location_matrix2);
        gl.vertexAttribPointer(location_matrix2, 4, gl.FLOAT, false, STRIDE, offset*4);
        gl.vertexAttribDivisor(location_matrix2, 1);
        offset += 4;
        const location_matrix3 = gl.getAttribLocation(pass.program, "i_matrix3");
        assert(location_matrix3 != -1, "Couldn't get attrib location i_matrix3");
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
    camera.projection_matrix = matrix4_make_orthographic_projection(
        game.renderer.window_size[0]*-0.5, game.renderer.window_size[0]*+0.5,
        game.renderer.window_size[1]*+0.5, game.renderer.window_size[1]*-0.5,
        -1,                                +1,
    );

    camera.transform_matrix = matrix4_identity();
    // camera.transform_matrix *= mat4Rotate(.{ 0, 0, 1 }, camera.rotation);
    camera.transform_matrix = matrix4_multiply(matrix4_make_scale(camera.zoom, camera.zoom, 0), camera.transform_matrix);
    camera.transform_matrix = matrix4_multiply(matrix4_make_translation(camera.position[0], camera.position[1], 0), camera.transform_matrix);

    camera.view_matrix = camera.transform_matrix;
    camera.view_projection_matrix = matrix4_multiply(camera.projection_matrix, camera.view_matrix);
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
    pressed:        boolean; // The key was pressed this frame
    down:           boolean; // The key is down
    released:       boolean; // The key was released this frame
}
// I really hate that i have to do this, but this is JavaScript so here we go...
enum Keyboard_Key {
    "_0" = "0",
    "_1" = "1",
    "_2" = "2",
    "_3" = "3",
    "_4" = "4",
    "_5" = "5",
    "_6" = "6",
    "_7" = "7",
    "_8" = "8",
    "_9" = "9",
    "a" = "a",
    "b" = "b",
    "c" = "c",
    "d" = "d",
    "e" = "e",
    "f" = "f",
    "g" = "g",
    "h" = "h",
    "i" = "i",
    "j" = "j",
    "k" = "k",
    "l" = "l",
    "m" = "m",
    "n" = "n",
    "o" = "o",
    "p" = "p",
    "q" = "q",
    "r" = "r",
    "s" = "s",
    "t" = "t",
    "u" = "u",
    "v" = "v",
    "w" = "w",
    "x" = "x",
    "y" = "y",
    "z" = "z",
    "²" = "²",
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
    "Shift" = "Shift",
    "Control" = "Control",
    "Meta" = "Meta",
    " " = " ",
    "Alt" = "Alt",
    "AltGraph" = "AltGraph",
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
    // @ts-ignore
    const inputs: Inputs = { keys: {}, mouse_keys: {} };
    inputs.mouse_position = [0,0];
    inputs.mouse_wheel = [0,0];
    const keys = Object.values(Keyboard_Key);
    for (let key_index = 0; key_index < keys.length; key_index++) {
        const key = keys[key_index] as Keyboard_Key;
        inputs.keys[key] = { pressed: false, down: false, released: false };
    }
    const mouse_keys = Object.values(Mouse_Key);
    for (let key_index = 0; key_index < mouse_keys.length; key_index++) {
        const key = mouse_keys[key_index] as Mouse_Key;
        inputs.mouse_keys[key] = { pressed: false, down: false, released: false };
    }
    return inputs;
}
function inputs_on_key(event: KeyboardEvent) {
    console.log("game.inputs.keys", game.inputs.keys, event.key);
    if (!game.inputs.keys.hasOwnProperty(event.key)) {
        console.warn("Unrecognized key:", event.key);
        return;
    }
    const key_state = game.inputs.keys[event.key as Keyboard_Key];
    key_state.down = event.type == "keydown";
    key_state.released = event.type == "keyup";
    key_state.pressed = event.type == "keydown";
}
function inputs_reset(inputs: Inputs) {
    inputs.mouse_wheel[0] = 0;
    inputs.mouse_wheel[1] = 0;
    inputs.mouse_moved = false;
    inputs.quit_requested = false;
    inputs.window_resized = false;

    inputs.keyboard_was_used = false;
    for (const key_state of Object.values(inputs.keys)) {
        if (key_state.pressed || key_state.down || key_state.released) {
            inputs.keyboard_was_used = true;
            break;
        }
    }
    inputs.mouse_was_used = false;
    for (const key_state of Object.values(inputs.mouse_keys)) {
        if (key_state.pressed || key_state.down || key_state.released) {
            inputs.mouse_was_used = true;
            break;
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

    for (const key_state of Object.values(inputs.keys)) {
        key_state.pressed = false;
        key_state.released = false;
    }
    for (const key_state of Object.values(inputs.mouse_keys)) {
        key_state.pressed = false;
        key_state.released = false;
    }
    // for controller_state : inputs.controllers {
    //     for *key_state : controller_state.buttons {
    //         key_state.pressed = false;
    //         key_state.released = false;
    //     }
    // }
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
        if (i > 0 && i % 4 == 0) {
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
            console.log("Image loaded", image);
            resolve(image);
        };
        image.onerror = reject;
    });
}
function assert(condition: Boolean, message: string | null = ""): asserts condition {
    if (!__RELEASE__ && !condition) {
        debugger;
        if (message) {
            console.error("Assertion failed:");
            throw Error(message);
        } else {
            throw Error("Assertion failed!");
        }
    }
}
// :math
function grid_index_to_position(grid_index: int, grid_size: Vector2): Vector2 {
    return [ grid_index % grid_size[0], grid_index / grid_size[0] ];
}
function grid_position_to_index(grid_position: Vector2, grid_width: int): int {
    return (grid_position[1] * grid_width) + grid_position[0];
}
function clamp(min: number, max: number, value: number): number {
    return Math.min(Math.max(value, min), max);
}
function sin_01(time: float, frequency: float = 1.0): float {
    return 0.5 * (1 + Math.sin(2 * Math.PI * frequency * time));
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
function matrix4_multiply(m: Matrix4, n: Matrix4): Matrix4 {
    assert(m.length === n.length);
    assert(m.length === 16);
    const result = matrix4_zero();

    var b00 = n[0 * 4 + 0];
    var b01 = n[0 * 4 + 1];
    var b02 = n[0 * 4 + 2];
    var b03 = n[0 * 4 + 3];
    var b10 = n[1 * 4 + 0];
    var b11 = n[1 * 4 + 1];
    var b12 = n[1 * 4 + 2];
    var b13 = n[1 * 4 + 3];
    var b20 = n[2 * 4 + 0];
    var b21 = n[2 * 4 + 1];
    var b22 = n[2 * 4 + 2];
    var b23 = n[2 * 4 + 3];
    var b30 = n[3 * 4 + 0];
    var b31 = n[3 * 4 + 1];
    var b32 = n[3 * 4 + 2];
    var b33 = n[3 * 4 + 3];
    var a00 = m[0 * 4 + 0];
    var a01 = m[0 * 4 + 1];
    var a02 = m[0 * 4 + 2];
    var a03 = m[0 * 4 + 3];
    var a10 = m[1 * 4 + 0];
    var a11 = m[1 * 4 + 1];
    var a12 = m[1 * 4 + 2];
    var a13 = m[1 * 4 + 3];
    var a20 = m[2 * 4 + 0];
    var a21 = m[2 * 4 + 1];
    var a22 = m[2 * 4 + 2];
    var a23 = m[2 * 4 + 3];
    var a30 = m[3 * 4 + 0];
    var a31 = m[3 * 4 + 1];
    var a32 = m[3 * 4 + 2];
    var a33 = m[3 * 4 + 3];
    result[ 0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    result[ 1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    result[ 2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    result[ 3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
    result[ 4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    result[ 5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    result[ 6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    result[ 7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
    result[ 8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    result[ 9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    result[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    result[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
    result[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    result[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    result[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    result[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

    return result;
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

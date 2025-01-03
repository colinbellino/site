#import,dir "jaison";
#import "Hash_Table";

LDTK_Root :: struct {
    iid:                string;
    __header__:         LDTK_Header;
    jsonVersion:        string;
    defs:               LDTK_Definitions;
    levels:             []LDTK_Level;
    bgColor:            string;
    defaultLevelBgColor:string;
}

LDTK_Definitions :: struct {
    layers:             []LDTK_Layer_Def;
    entities:           []LDTK_Entity_Def;
    tilesets:           []LDTK_Tileset_Def;
}

LDTK_Header :: struct {
    fileType:   string;
    app:        string;
    doc:        string;
    schema:     string;
    appAuthor:  string;
    appVersion: string;
    url:        string;
}

LDTK_Layer_Uid :: #type s32;
LDTK_Layer_Def :: struct {
    identifier:     string;
    type:           string;
    uid:            LDTK_Layer_Uid;
    gridSize:       s32;
    tilesetDefUid:  LDTK_Tileset_Uid;
}

LDTK_Entity_Uid :: #type s32;
LDTK_Entity_Def :: struct {
    identifier: string;
    uid:        LDTK_Entity_Uid;
    width:      s32;
    height:     s32;
    color:      string;
    tilesetId:  LDTK_Tileset_Uid;
}

LDTK_Tileset_Uid :: #type s32;
LDTK_Tileset_Def :: struct {
    identifier: string;
    uid:        LDTK_Tileset_Uid;
    // relPath:    Maybe(string); // FIXME:
}

LDTK_Level_Uid :: #type s32;
LDTK_Level :: struct {
    identifier:         string;
    iid:                string;
    uid:                LDTK_Level_Uid;
    worldX:             s32;
    worldY:             s32;
    worldDepth:         s32;
    pxWid:              s32;
    pxHei:              s32;
    // bgRelPath:      Maybe(string); // FIXME:
    externalRelPath:    string;
    bgPos:              string;
    layerInstances:     []LDTK_Layer_Instance;
}

LDTK_Layer_Instance :: struct {
    iid:                    string;
    levelId:                LDTK_Level_Uid;
    layerDefUid:            LDTK_Layer_Uid;
    gridSize:               s32;
    entityInstances:        []LDTK_Entity_Instance;
    intGridCsv:             []s32;
    autoLayerTiles:         []LDTK_Tile_Instance;
    gridTiles:              []LDTK_Tile_Instance;
}

LDTK_Entity_Instance :: struct {
    iid:                string;
    width:              s32;
    height:             s32;
    defUid:             LDTK_Entity_Uid;
    __grid:             [2]s32;
    px:                 [2]s32;
    fieldInstances:     []LDTK_Field_Instance;
}

LDTK_Field_Id :: #type s32;

LDTK_Field_Instance :: struct {
    __identifier: string;
    __type:       string;
    __value:      JSON_Value;
    defUid:       LDTK_Field_Id;
}

LDTK_Entity_Ref :: struct {
    entityIid:  string;
    layerIid:   string;
    levelIid:   string;
    worldIid:   string;
}

LDTK_Tile_Id :: #type s32;

/*
"Flip bits", a 2-bits integer to represent the mirror transformations of the tile.
- Bit 0 = X flip
- Bit 1 = Y flip
Examples: f=0 (no flip), f=1 (X flip only), f=2 (Y flip only), f=3 (both flips)
*/
LDTK_Flip :: #type s8;
LDTK_Tile_Instance :: struct {
    f:      LDTK_Flip;
    /* Pixel coordinates of the tile in the layer ([x,y] format). Don't forget optional layer offsets, if they exist! */
    px:     [2]s32;
    /* Pixel coordinates of the tile in the tileset ([x,y] format) */
    src:    [2]s32;
    /* The Tile ID in the corresponding tileset. */
    t:      LDTK_Tile_Id;
}

LDTK_Bg_BgPosCover  :: "Cover";
LDTK_Bg_BgPosRepeat :: "Repeat";
LDTK_Bg_Contain     :: "Contain";
LDTK_Bg_CoverDirty  :: "CoverDirty";
LDTK_Bg_Unscaled    :: "Unscaled";

suppress_error_logger :: (message: string, data: *void, info: Log_Info) {
    if (info.common_flags == .ERROR) { return; }
    runtime_support_default_logger(message, data, info);
}

ldtk_load :: (path: string, allocator: Allocator, loc := #caller_location) -> result: *LDTK_Root {
    #import "Basic";
    #import "File";

    file_data, success := read_entire_file(path);
    assert(success, tprint("Couldn't read file: %", path));

    parse_ok, result := json_parse_string(file_data, *LDTK_Root,, allocator = allocator, logger = suppress_error_logger);
    assert(parse_ok, "Couldn't parse ldtk file.", loc = loc);

    return result;
}

ldtk_get_entity_instance_index :: (object: *JSON_Object, entity_instances: []LDTK_Entity_Instance) -> s32 {
    value, success := table_find(object, "entityIid");
    assert(success);
    target_entity_iid := value.str;
    for other, other_index : entity_instances {
        if other.iid == target_entity_iid {
            return cast(s32)other_index;
        }
    }
    return -1;
}

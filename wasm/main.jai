#import "Basic";
#import "sokol-jai/sokol/log"(DEBUG = true);
#import "sokol-jai/sokol/gfx"(DEBUG = true, USE_GL = true);

ctx: Context;

// sokol_logger :: (tag: *u8, log_level: u32, log_item: u32, message: *u8, line_nr: u32, filename: *u8, user_data: *void) -> void #c_call {
//     push_context,defer_pop ctx;
//     log("hello");
// }
// sokol_alloc :: (size: u64, user_data: *void) -> *void #c_call {
//     push_context,defer_pop ctx;
//     // log_content("sokol_alloc");
//     return alloc(cast(s64) size);
// } @NoProfile
// sokol_free :: (ptr: *void, user_data: *void) #c_call {
//     push_context,defer_pop ctx;
//     // log_content("sokol_free");
//     free(ptr);
// } @NoProfile

main :: ()  {
    context.logger = logger;
    ctx = context;

    // gfx_desc := sg_desc.{
    //     // logger      = .{ func = sokol_logger },
    //     // logger      = .{ func = slog_func },
    //     // allocator   = .{ alloc_fn = sokol_alloc, free_fn = sokol_free },
    //     environment = .{
    //         defaults    = .{
    //             color_format = .RGBA8,
    //             depth_format = .DEPTH_STENCIL,
    //             sample_count = 1,
    //         },
    //     },
    // };
    // sg_setup(*gfx_desc);

    // slog_func("HAI", 0, 0, "hello", 0,  "", null);

    log("Hello Jai!\n");
    // write_strings("These", " will", " cause", " multiple", " calls", " to" , " write_string_unsynchronized!\n");
    // log("Hello logger!");

    // numbers: [..] int;
    // array_add(*numbers, 10);
    // array_add(*numbers, 20);
    // array_add(*numbers, 30);

    // for numbers {
    //     log("numbers[%]: %\n", it_index, it);
    // }

    // // debug_break();

    // builder: String_Builder;
    // for 0..10 {
    //     append(*builder, sprint("Entry-%\n", it));
    // }
    // log("Builder result: \n%", builder_to_string(*builder));

    // // Enable this if you want to see a nice stack trace:
    // // assert(false, "Assert test");

    // log("Type info test: The type of the builder is %", type_of(builder));
    // info := type_info(type_of(builder));
    // log("It contains the following members:");
    // for info.members {
    //     log("%: % of type %", it_index, it.name, type_to_string(it.type));
    // }

    // log_error("We can also log errors.");
}

logger :: (message: string, data: *void, info: Log_Info) {
    is_error := (info.common_flags & .ERROR) != 0;
    wasm_log(message.count, message.data, is_error);
}

// We need to declare all the JS functions that will be passed to our WebAssembly
// instance from the JS file that loads us.
wasm_log            :: (count: s64, data: *u8, is_error: bool) #foreign;
wasm_resize_canvas  :: (width: u32, height: u32) #foreign;

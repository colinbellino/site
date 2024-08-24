// Allocator_Proc :: #type (mode: Allocator_Mode, size: s64, old_size: s64, old_memory: *void, allocator_data: *void) -> *void#c_call ;
// Allocator :: struct {
//     proc: Allocator_Proc;
//     data: *void;
// }
// Allocator_Mode :: enum {  // @Volatile: If you change these, the bytecode has to change!
//     ALLOCATE  :: 0;
//     RESIZE    :: 1;
//     FREE      :: 2;
//     STARTUP   :: 3;  // The allocator has never been used and is being started up for the first time. The return value will be allocator_data for the first heap.
//     SHUTDOWN  :: 4;  // The allocator is being shut down and should clean up everything. After this no allocator call is legal until a new STARTUP.
//     THREAD_START :: 5;
//     THREAD_STOP  :: 6;
//     CREATE_HEAP  :: 7;
//     DESTROY_HEAP :: 8;
// }
engine_default_allocator :: Allocator.{ engine_default_allocator_proc, null };

engine_default_allocator_proc :: (mode: Allocator_Mode, size: s64, old_size: s64, old_memory: *void, allocator_data: *void) -> *void {
    result := Context_Base.default_allocator.proc(mode, size, old_size, old_memory, allocator_data);

    // new_context := context;
    // new_context.allocator = temp;
    // push_context new_context {
    //     builder: String_Builder;
    //     init_string_builder(*builder);
    //     if context.stack_trace {
    //         node := context.stack_trace;
    //         while node {
    //             if node.call_depth > 30 {
    //                 break;
    //             }
    //             if node.info {
    //                 append(*builder, "        ");
    //                 if node.info.name {
    //                     append(*builder, tprint("%", node.info.location.fully_pathed_filename));
    //                 }
    //                 append(*builder, tprint(":%", node.info.location.line_number));
    //                 append(*builder, tprint(":%", node.info.location.character_number));
    //                 append(*builder, tprint(" -> %", node.info.name));
    //                 append(*builder, "\n");
    //             }
    //             node = node.next;
    //         }
    //     }
    //     log_content("% size: % old_size: % old_memory: % allocator_data: %\n%", mode, size, old_size, old_memory, allocator_data, builder_to_string(*builder));
    // }
    // log_content("% size: % old_size: % old_memory: % allocator_data: %", mode, size, old_size, old_memory, allocator_data);

    if mode == .ALLOCATE {
        context._Tracy.TracyAlloc(result, cast(u64) size);
    }
    if mode == .FREE {
        context._Tracy.TracyFree(old_memory);
    }
    if mode == .RESIZE {
        context._Tracy.TracyFree(old_memory);
        context._Tracy.TracyAlloc(result, cast(u64) size);
    }
    return result;
}

sokol_alloc :: (size: u64, user_data: *void) -> *void #c_call {
    push_context,defer_pop engine.ctx;
    // log_content("sokol_alloc");
    return alloc(cast(s64) size);
} @NoProfile
sokol_free :: (ptr: *void, user_data: *void) #c_call {
    push_context,defer_pop engine.ctx;
    // log_content("sokol_free");
    free(ptr);
} @NoProfile

sdl_malloc :: (size: u64) -> *void #c_call {
    push_context,defer_pop engine.ctx;
    // log_content("sdl_alloc");
    return alloc(cast(s64) size);
    // return engine_default_allocator_proc(.ALLOCATE, cast(s64) size, 0, null, null);
} @NoProfile
sdl_calloc :: (nmemb: u64, size: u64) -> *void #c_call {
    push_context,defer_pop engine.ctx;
    // log_content("sdl_calloc");
    return alloc(cast(s64) (size * nmemb));
} @NoProfile
// FIXME: looks like this isn't working with SDL 2.30.1
sdl_realloc :: (ptr: *void, size: u64) -> *void #c_call {
    push_context,defer_pop engine.ctx;
    // log_content("sdl_realloc");
    sdl_free(ptr);
    return sdl_malloc(size);
} @NoProfile
sdl_free :: (ptr: *void) #c_call {
    push_context,defer_pop engine.ctx;
    // log_content("sdl_free");
    free(ptr);
} @NoProfile

Debug :: #import "Debug";
#import "Basic";
#import "Socket";
#import "System";
#import "String";
#load "engine/pretty_logger.jai";
#load "engine/logger.jai";

PORT        :: 8080;
MAX_SOCKETS :: 100;

State :: struct {
    ctx:            Context;
    quit:           bool;
    server_sock:    Socket;
    client_sock:    Socket;
}

state: *State;
buffer: [1024]u8;

#program_export
update :: () -> (quit: bool) {
    if state == null {
        context.logger = pretty_logger_proc;
        state = New(State);
        state.ctx = context;

        init_ok := socket_init();
        assert(init_ok, tprint("init failed: %", get_last_socket_error()));

        state.server_sock = socket(AF_INET, .STREAM, .TCP);
        assert(state.server_sock > -1, tprint("socket failed: %", get_last_socket_error()));

        bind_result := bind(state.server_sock, "127.0.0.1", PORT, AF_INET);
        error_code, error_string := get_error_value_and_string();
        assert(bind_result > -1, tprint("bind failed: % (%)", error_code, error_string));

        listen_result := listen(state.server_sock, MAX_SOCKETS);
        assert(listen_result > -1, tprint("listen failed: %", get_last_socket_error()));

        log("Listening to :% (MAX_SOCKETS: %)", PORT, MAX_SOCKETS);
    }

    set_blocking_ok := set_blocking(state.server_sock, false);
    assert(set_blocking_ok, tprint("set_blocking failed: %", get_last_socket_error()));

    client_sock, client_address := accept(state.server_sock);
    log("state.client_sock: % address: %", state.client_sock, client_address);
    request_length := recv(state.client_sock, *buffer, buffer.count, 0);
    if request_length > 0 {
        // new_context := context;
        // new_context.logger = noop_logger;
        // push_context,defer_pop new_context;

        log("--------------------------------------------------------------------------------");
        defer log("--------------------------------------------------------------------------------");
        request := cast(string) buffer;
        log("|> Address: %", to_string(client_address));
        log("|> Request: (length: %) \n%", request_length, request);

        Method :: enum { GET; HEAD; POST; PUT; DELETE; CONNECT; OPTIONS; TRACE; PATCH; }

        method: Method;
        url: string;
        // bla := copy_temporary_string(request);
        // while bla.count {
        //     advance(*bla, 5);
        //     log_warn("% %", bla.count, bla);
        //     log("request: %", request);
        //     // if part.count == 0 { break; }
        // }

        content := "<h1>Hello from jai o/</h1>";

        response_builder: String_Builder;
        append(*response_builder, "HTTP/1.1 200 OK");
        append(*response_builder, "\n");
        append(*response_builder, "Content-Type: text/html; charset=utf-8");
        append(*response_builder, "\n");
        append(*response_builder, tprint("Content-Length: %", content.count));
        append(*response_builder, "\n\n");
        append(*response_builder, content);

        response := builder_to_string(*response_builder);
        response_length := send(state.client_sock, to_c_string(response), xx response.count, 0);
        log("|> Response: (length: %)\n%", response_length, response);
    }
    close_and_reset(*state.client_sock);

    reset_temporary_storage();

    return state.quit;
}

#program_export
unload :: () -> *State {
    close_and_reset(*state.server_sock);
    close_and_reset(*state.client_sock);
    log("Server unloaded.");
    return state;
}

#program_export
reload :: (memory: *State) {
    assert(memory != null);
    state = memory;
    context = state.ctx;
    log("Server reloaded.");
}

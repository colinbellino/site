Debug :: #import "Debug";
#import "Basic";
#import "Socket";
#import "System";

PORT        :: 8080;
MAX_SOCKETS :: 100;

State :: struct {
    quit:           bool;
    server_sock:    Socket;
}

state: *State;

main :: () {
    state = New(State);

    init_ok := socket_init();
    if !init_ok {
        log_error("init failed: %", get_last_socket_error());
        exit(0);
    }

    state.server_sock = socket(AF_INET, .STREAM, .TCP);
    if state.server_sock < 0 {
        log_error("socket failed: %", get_last_socket_error());
        exit(0);
    }

    reuse : s32 = 1;
    if setsockopt(state.server_sock, SOL_SOCKET, SO_REUSEADDR, *reuse, size_of(type_of(reuse))) < 0 {
        log_error("setsockopt failed: %", get_last_socket_error());
        exit(0);
    }
    if setsockopt(state.server_sock, SOL_SOCKET, SO_REUSEPORT, *reuse, size_of(type_of(reuse))) < 0 {
        log_error("setsockopt failed: %", get_last_socket_error());
        exit(0);
    }

    bind_result := bind(state.server_sock, "127.0.0.1", PORT, AF_INET);
    if bind_result < 0 {
        error_code, error_string := get_error_value_and_string();
        log_error("Error %: %.", error_code, error_string);
        exit(0);
    }

    listen_result := listen(state.server_sock, MAX_SOCKETS);
    if listen_result < 0 {
        log_error("listen failed: %", get_last_socket_error());
        exit(0);
    }

    log("Listening to :% (MAX_SOCKETS: %)", PORT, MAX_SOCKETS);

    while !state.quit {
        client_sock, client_address := accept(state.server_sock);
        // log("client_sock: % address: %", client_sock, address);

        buffer: [1024]u8;
        request_length := recv(client_sock, *buffer, buffer.count, 0);
        if request_length > 0 {
            // new_context := context;
            // new_context.logger = noop_logger;
            // push_context,defer_pop new_context;

            log("--------------------------------------------------------------------------------");
            defer log("--------------------------------------------------------------------------------");
            log("|> Address: %", to_string(client_address));
            log("|> Request: (length: %) \n%", request_length, cast(string) buffer);

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
            response_length := send(client_sock, to_c_string(response), xx response.count, 0);
            log("|> Response: (length: %)\n%", response_length, response);
        }

        close_and_reset(*client_sock);
    }
}

noop_logger :: (message: string, data: *void, info: Log_Info) {}

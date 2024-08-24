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
    buffer:         [2*1024]u8;
}
Request :: struct {
    method:     Method;
    url:        string;
}
Response :: struct {
    status_code:    Status_Code_Enum;
    content:        string;
}
Method :: enum { GET; HEAD; POST; PUT; DELETE; CONNECT; OPTIONS; TRACE; PATCH; }

Status_Code :: struct {
    code:   Status_Code_Enum;
    name:   string;
}

Status_Code_Enum :: enum {
    OK                      :: 200;
    FORBIDDEN               :: 403;
    NOT_FOUND               :: 404;
    INTERNAL_SERVER_ERROR   :: 500;
    NOT_IMPLEMENTED         :: 501;
}

STATUS_CODES :: Status_Code.[
    .{ .NOT_IMPLEMENTED, "Not Implemented", },
    .{ .OK, "OK", },
    .{ .FORBIDDEN, "Forbidden", },
    .{ .NOT_FOUND, "Not Found", },
    .{ .INTERNAL_SERVER_ERROR, "Internal Server Error", },
];

state: *State;

#program_export
start :: (update_callback: () -> ()) {
    context.logger = pretty_logger_proc;
    state = New(State);
    state.ctx = context;

    init_ok := socket_init();
    assert(init_ok, tprint("init failed: %", get_last_socket_error()));

    state.server_sock = socket(AF_INET, .STREAM, .TCP);
    assert(state.server_sock > -1, tprint("socket failed: %", get_last_socket_error()));

    reuse : s32 = 1;
    setsockopt_result := setsockopt(state.server_sock, SOL_SOCKET, SO_REUSEADDR, *reuse, size_of(type_of(reuse)));
    assert(setsockopt_result > -1, tprint("setsockopt SO_REUSEADDR failed: %", get_last_socket_error()));
    setsockopt_result = setsockopt(state.server_sock, SOL_SOCKET, SO_REUSEPORT, *reuse, size_of(type_of(reuse)));
    assert(setsockopt_result > -1, tprint("setsockopt SO_REUSEPORT failed: %", get_last_socket_error()));

    // Note: disable this in production
    set_blocking(state.server_sock, false);
    set_keepalive(state.server_sock, false);

    bind_result := bind(state.server_sock, "127.0.0.1", PORT, AF_INET);
    error_code, error_string := get_error_value_and_string();
    assert(bind_result > -1, tprint("bind failed: % (%)", error_code, error_string));

    listen_result := listen(state.server_sock, MAX_SOCKETS);
    assert(listen_result > -1, tprint("listen failed: %", get_last_socket_error()));

    log("Listening to :% (MAX_SOCKETS: %)", PORT, MAX_SOCKETS);

    while true {
        client_sock, client_address := accept(state.server_sock);
        // log("client_sock: % address: %", client_sock, client_address);
        request_length := recv(client_sock, *state.buffer, state.buffer.count, 0);
        if request_length > 0 {
            // new_context := context;
            // new_context.logger = noop_logger;
            // push_context,defer_pop new_context;

            log("--------------------------------------------------------------------------------");
            defer log("--------------------------------------------------------------------------------");
            log("|> Address: %", to_string(client_address));
            log("|> Request: (length: %) \n%", request_length, cast(string) state.buffer);

            request := parse_request(cast(string) state.buffer);
            response := make_response(request);
            response_string := response_to_string(response);
            response_length := send(client_sock, to_c_string(response_string), xx response_string.count, 0);
            log("|> Response: (length: %)\n%", response_length, response_string);
        }
        close_and_reset(*client_sock);

        reset_temporary_storage();

        update_callback();
    }
}

parse_request :: (request_raw: string) -> Request {
    request: Request;
    lines := split(request_raw, "\n");
    {
        parts := split(lines[0], " ");
        methods := enum_names(Method);
        found, index := array_find(methods, parts[0]);
        request.method = cast(Method) index;
        request.url = parts[1];
    }
    return request;
}

make_response :: (request: Request) -> Response {
    response: Response;
    response.status_code = .NOT_FOUND;
    response.content = "Not found.";

    if request.method != .GET {
        return response;
    }

    if request.url == {
        case "/"; {
            response.status_code = .OK;
            response.content = "<h1>Hello from jai o/</h1>";
        }
        case "/pouet"; {
            response.status_code = .OK;
            response.content = "<h1>Pouet</h1>";
        }
    }

    return response;
}

response_to_string :: (response: Response) -> string {
    response_builder: String_Builder;
    append(*response_builder, tprint("HTTP/1.1 % %", cast(u32) response.status_code, status_code_name(response.status_code)));
    append(*response_builder, "\n");
    append(*response_builder, "Content-Type: text/html; charset=utf-8");
    append(*response_builder, "\n");
    append(*response_builder, tprint("Content-Length: %", response.content.count));
    append(*response_builder, "\n\n");
    append(*response_builder, response.content);

    return builder_to_string(*response_builder);
}

status_code_name :: (code: Status_Code_Enum) -> string {
    index: int;
    for STATUS_CODES {
        if it.code == code {
            index = it_index;
            break;
        }
    }
    return STATUS_CODES[index].name;
}

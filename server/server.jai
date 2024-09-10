Debug :: #import "Debug";
#import "Basic";
#import "Socket";
#import "System";
#import "String";
#import "POSIX";
#load "engine/pretty_logger.jai";
#load "engine/logger.jai";

PORT                   :: 8080;
MAX_CONNECTIONS        :: 100;
REQUEST_TIMEOUT_SEC    :: 5_000;
CLOSING_TIMEOUT_SEC    :: 2_000;
CONNECTION_TIMEOUT_SEC :: 60_000;

State :: struct {
    ctx:            Context;
    quit:           bool;
    server_sock:    Socket;
    polls:          [MAX_CONNECTIONS]pollfd;
    connections:    [MAX_CONNECTIONS]Connection;
    num_conns:      u32;
    now:            Apollo_Time;
}

Connection :: struct {
    input:          Fixed_Size_String(2*1024);
    output:         Fixed_Size_String(2*1024);
    served_count:   s32;
    closing:        bool;
    creation_time:  Apollo_Time;
    start_time:     Apollo_Time;
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

deadline_of :: (conn: *Connection) -> Apollo_Time {
    return conn.start_time + milliseconds_to_apollo(ifx(conn.closing) then CLOSING_TIMEOUT_SEC else REQUEST_TIMEOUT_SEC);
}

#program_export
start :: (update_callback: () -> ()) {
    context.logger = pretty_logger_proc;
    state = New(State);
    state.ctx = context;

    for i : 0 .. MAX_CONNECTIONS-1 {
        state.polls[i].fd = -1;
        state.polls[i].events = 0;
        state.polls[i].revents = 0;
    }

    init_ok := socket_init();
    assert(init_ok, tprint("init failed: %", get_last_socket_error()));

    state.server_sock = socket(AF_INET, .STREAM, .TCP);
    assert(state.server_sock > -1, tprint("socket failed: %", get_last_socket_error()));

    // Note: disable this in production
    set_blocking(state.server_sock, false);
    // set_keepalive(state.server_sock, false);

    reuse : s32 = 1;
    setsockopt_result := setsockopt(state.server_sock, SOL_SOCKET, SO_REUSEADDR, *reuse, size_of(type_of(reuse)));
    assert(setsockopt_result > -1, tprint("setsockopt SO_REUSEADDR failed: %", get_last_socket_error()));
    // setsockopt_result = setsockopt(state.server_sock, SOL_SOCKET, SO_REUSEPORT, *reuse, size_of(type_of(reuse)));
    // assert(setsockopt_result > -1, tprint("setsockopt SO_REUSEPORT failed: %", get_last_socket_error()));

    bind_result := bind(state.server_sock, "127.0.0.1", PORT, AF_INET);
    error_code, error_string := get_error_value_and_string();
    assert(bind_result > -1, tprint("bind failed: % (%)", error_code, error_string));

    listen_result := listen(state.server_sock, MAX_CONNECTIONS);
    assert(listen_result > -1, tprint("listen failed: %", get_last_socket_error()));

    state.polls[0].fd = state.server_sock;
    state.polls[0].events = POLLIN;

    log("Listening to :% (MAX_CONNECTIONS: %)", PORT, MAX_CONNECTIONS);

    timeout : s32 = -1;
    while !state.quit {
        poll_result := poll(*state.polls[0], MAX_CONNECTIONS, timeout);
        assert(poll_result != EINTR, tprint("poll failed: %", get_last_socket_error()));

        state.now = current_time_consensus();

        if state.polls[0].revents {
            while true {
                // Look for a connection structure
                free_index : s32 = 0;
                while free_index < MAX_CONNECTIONS && state.polls[free_index].fd != -1 {
                    free_index += 1;
                }
                log("free_index: %", free_index);
                if free_index == MAX_CONNECTIONS {
                    log_warn("max connection reached");
                    state.polls[0].events &= cast(s16) ~POLLIN; // Stop listening for incoming connections
                    break;
                }

                client_sock, client_address := accept(state.server_sock);
                if client_sock == -1 {
                    // log("client_sock: %", client_sock);
                    if errno() == EINTR {
                        log_error("EINTR: %", get_last_socket_error());
                        continue;
                    }
                    if errno() == EAGAIN {
                        log_error("EAGAIN: %", get_last_socket_error());
                        break;
                    }
                    if errno() == EWOULDBLOCK {
                        log_error("EWOULDBLOCK: %", get_last_socket_error());
                        break;
                    }
                }
                if !set_blocking(client_sock, false) {
                    log_error("set_blocking failed: %", get_last_socket_error());
                    continue;
                }

                state.polls[free_index].fd = client_sock;
                state.polls[free_index].events = POLLIN;
                state.polls[free_index].revents = 0;
                // byte_queue_init(&conns[free_index-1].input);
                // byte_queue_init(&conns[free_index-1].output);
                state.connections[free_index-1].closing = false;
                state.connections[free_index-1].served_count = 0;
                state.connections[free_index-1].creation_time = state.now;
                state.connections[free_index-1].start_time = state.now;
                state.num_conns += 1;
            }
        }

        oldest_connection: *Connection;

        for i : 1 .. MAX_CONNECTIONS-1 {
            if state.polls[i].fd == -1 {
                continue;
            }

            connection := *state.connections[i-1];
            remove_connection: bool;

            if !remove_connection && state.now >= deadline_of(connection) {
                if connection.closing {
                    // Closing timeout
                    remove_connection = true;
                    log("Closing timeout");
                } else {
                    // Request timeout
                    // const char msg[] = "HTTP/1.1 408 Request Timeout\r\nConnection: Close\r\n\r\n";
                    // byte_queue_write(&connection.output, msg, sizeof(msg)-1);
                    connection.closing = true;
                    connection.start_time = state.now;
                    state.polls[i].events &= xx ~POLLIN;
                    state.polls[i].events |= POLLOUT;
                    state.polls[i].revents |= POLLOUT;
                    log("Request timeout");
                }
            } else if !remove_connection && (state.polls[i].revents & POLLIN) {
                while true {
                    // if (!byte_queue_ensure_min_free_space(*conn.input, 512)) {
                    //     remove = true;
                    //     break;
                    // }

                    // char  *dst = byte_queue_start_write(connection.input);
                    // size_t max = byte_queue_free_space(connection.input);

                    request_length := recv(state.polls[i].fd, *connection.input.data[0], xx connection.input.data.count, 0);
                    connection.input.count = request_length;
                    // log("request_length: %", request_length);
                    // log("connection.input: %", connection.input);
                    if request_length < 0 {
                        if errno() == EINTR
                            continue;
                        if errno() == EAGAIN || errno() == EWOULDBLOCK
                            break;
                        remove_connection = true;
                        break;
                    }
                    if request_length == 0 {
                        remove_connection = true;
                        break;
                    }

                    log_warn("|> Request: (length: %) \n%", request_length, to_string(connection.input));
                    // byte_queue_end_write(&connection.input, (size_t) num);
                }

                while !remove_connection { // Respond loop start
                    // char  *src = byte_queue_start_read(&connection.input);
                    // size_t len = byte_queue_used_space(&connection.input);
                    src := connection.input.data;
                    len := connection.input.data.count;

                    // Look for the \r\n\r\n
                    j: u32;
                    while j+3 < len && (src[j] != #char "\r" || src[j+1] != #char "\n" || src[j+2] != #char "\r" || src[j+3] != #char "\n")
                        j += 1;
                    if j+3 >= len
                        break;
                    head_length := j + 4;
                    // head_length: u32;

                    // #if SHOW_REQUESTS
                    // print_bytes("", src, head_length);
                    // log_string("\n");
                    // #endif
                    // // Found! We got the request head
                    // Request request;
                    // int res = parse_request_head(src, head_length, &request);
                    // if (res != P_OK) {
                    //     // Invalid HTTP request
                    //     const char msg[] = "HTTP/1.1 400 Bad Request\r\nConnection: Close\r\n\r\n";
                    //     byte_queue_write(&connection.output, msg, sizeof(msg)-1);
                    //     state.polls[i].events &= ~POLLIN;
                    //     state.polls[i].events |= POLLOUT;
                    //     state.polls[i].revents |= POLLOUT;
                    //     connection.closing = true;
                    //     connection.start_time = now;
                    //     break;
                    // }

                    // Slice content_length_header;
                    content_length: u32;
                    // content_length = connection.input.count;
                    // if (!find_header(&request, "Content-Length", &content_length_header)) {

                    //     if (find_and_parse_transfer_encoding(&request) & T_CHUNKED) {
                    //         // Content-Length missing
                    //         const char msg[] = "HTTP/1.1 411 Length Required\r\nConnection: Close\r\n\r\n";
                    //         byte_queue_write(&connection.output, msg, sizeof(msg)-1);
                    //         state.polls[i].events &= ~POLLIN;
                    //         state.polls[i].events |= POLLOUT;
                    //         state.polls[i].revents |= POLLOUT;
                    //         connection.closing = true;
                    //         connection.start_time = now;
                    //         log_string("Content-Length missing\n");
                    //         break;
                    //     } else
                    //         content_length = 0;

                    // } else {
                    //     content_length = parse_content_length(content_length_header);
                    //     if (content_length == (size_t) -1) {
                    //         // Invalid Content-Length
                    //         const char msg[] = "HTTP/1.1 400 Bad Request\r\nConnection: Close\r\n\r\n";
                    //         byte_queue_write(&connection.output, msg, sizeof(msg)-1);
                    //         state.polls[i].events &= ~POLLIN;
                    //         state.polls[i].events |= POLLOUT;
                    //         state.polls[i].revents |= POLLOUT;
                    //         connection.closing = true;
                    //         connection.start_time = now;
                    //         log_string("Invalid Content-Length\n");
                    //         break;
                    //     }
                    // }

                    // if (content_length > 1<<20) {
                    //     // Request too large
                    //     const char msg[] = "HTTP/1.1 413 Content Too Large\r\nConnection: Close\r\n\r\n";
                    //     byte_queue_write(&connection.output, msg, sizeof(msg)-1);
                    //     state.polls[i].events &= ~POLLIN;
                    //     state.polls[i].events |= POLLOUT;
                    //     state.polls[i].revents |= POLLOUT;
                    //     connection.closing = true;
                    //     connection.start_time = now;
                    //     log_string("Request too large\n");
                    //     break;
                    // }

                    request_length := head_length + content_length;
                    // if len >= request_length {
                    if true {
                        // Reset the request timer
                        state.connections[0].start_time = state.now;

                        // Respond
                        request := parse_request(to_string(connection.input));
                        response := make_response(request);
                        response_string := response_to_string(response);
                        connection.output = string_to_fixed_string(response_string, connection.output.data.count);

                        log_warn("|> Response: (length: %)\n%", connection.output.count, to_temp_string(connection.output));

                        connection.served_count += 1;
                        // byte_queue_end_read(*connection.input, request_length);
                        {
                            state.polls[i].events |= POLLOUT;
                            state.polls[i].revents |= POLLOUT;
                            break;
                        }
                    }
                }
            }

            log("[%] % -> %", i, !remove_connection, (state.polls[i].revents & POLLOUT));
            if !remove_connection && (state.polls[i].revents & POLLOUT) {
                while true {
                    // char  *src = byte_queue_start_read(&connection.output);
                    // size_t len = byte_queue_used_space(&connection.output);

                    log("state.connections[i]: %", (state.connections[i]));

                    if state.connections[i].output.count == 0 {
                        state.polls[i].events &= xx ~POLLOUT;
                        if state.connections[i].closing
                            remove_connection = true;
                        log("break");
                        break;
                    }

                    log_warn("send");
                    response_length := send(state.polls[i].fd, *state.connections[i].output.data[0], xx state.connections[i].output.count, 0);
                    log("response_length: %", response_length);
                    if response_length < 0 {
                        if errno() == EINTR
                            continue;
                        if errno() == EAGAIN || errno() == EWOULDBLOCK
                            break;
                        remove_connection = true;
                        break;
                    }

                    // #if SHOW_IO
                    // print_bytes("< ", src, response_length);
                    // #endif
                    // byte_queue_end_read(&connection.output, (size_t) response_length);
                }
            } /* POLLOUT */

            state.polls[i].revents = 0;

            if remove_connection {
                close(state.polls[i].fd);
                state.polls[i].fd = -1;
                state.polls[i].events = 0;
                // byte_queue_free(*connection.input);
                // byte_queue_free(*connection.output);
                connection.start_time = milliseconds_to_apollo(1);
                connection.closing = false;
                connection.creation_time = milliseconds_to_apollo(1);
                state.num_conns -= 1;
            } else {
                if oldest_connection == null || deadline_of(oldest_connection) > deadline_of(connection) {
                    oldest_connection = connection;
                }
            }
        }

        // update_callback();
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

has_flag :: inline (flags: $T, flag: T) -> bool {
    return flags & flag != 0;
}
add_flag :: inline (flags: *$T, flag: T) {
    flags.* |= flag;
}
remove_flag :: inline (flags: *$T, flag: T) {
    flags.* &= ~flag;
}

Fixed_Size_String :: struct($N: int) {
    count:      int;
    data:       [N]u8;
}
string_to_fixed_string :: (s: string, $N: int = 16, loc := #caller_location) -> Fixed_Size_String(N) {
    result: Fixed_Size_String(N);
    assert(s.count <= result.data.count, tprint("String to large to copied to Fixed_Size_String (received: %)", s), loc = loc);
    memcpy(result.data.data, s.data, s.count);
    result.data.data[s.count] = 0;
    result.count = s.count;
    return result;
}
to_temp_string :: (s: Fixed_Size_String) -> string {
    value : *u8 = temporary_alloc(s.data.count + 1);
    memcpy(value, s.data.data, s.data.count);
    value[s.data.count] = 0;
    return to_string(value,, allocator = temp);
}
to_string :: (s: Fixed_Size_String, allocator := temp) -> string {
    value : *u8 = temporary_alloc(s.data.count + 1);
    memcpy(value, s.data.data, s.data.count);
    value[s.data.count] = 0;
    return to_string(value,, allocator = allocator);
}
to_temp_c_string :: (s: Fixed_Size_String) -> *u8 {
    return temp_c_string(to_string(s,, allocator = temp));
}

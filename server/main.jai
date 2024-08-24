#import "Basic";

DEBUG   :: true;
VERBOSE :: true;

#if DEBUG {
    #import,file "engine/app_loader.jai";

    ctx: Context;
    server: App;

    main :: () {
        ctx = context;
        server = app_library_load(ctx.allocator, VERBOSE);
        assert(server.is_valid);
        server.start(update_callback);
    }

    update_callback :: () {
        if app_library_changed(*server) {
            if server.is_valid {
                app_library_unload(*server, VERBOSE);
            }
            new_server := app_library_load(ctx.allocator, VERBOSE);
            if new_server.is_valid {
                server = new_server;
                server.start(update_callback);
            }
        }
    }
} else {
    Server :: #load "server.jai";

    main :: () {
        Server.start();
    }
}

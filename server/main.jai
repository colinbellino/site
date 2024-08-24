#import "Basic";

DEBUG   :: true;
VERBOSE :: true;

#if DEBUG {
    #import,file "engine/app_loader.jai";

    main :: () {
        ctx := context;
        memory: *void;
        server := app_library_load(ctx.allocator, VERBOSE);
        assert(server.is_valid);

        quit: bool;
        while !quit {
            if server.is_valid {
                quit = server.update();
            }

            #if DEBUG {
                if app_library_changed(*server) {
                    if server.is_valid {
                        memory = server.unload();
                        app_library_unload(*server, VERBOSE);
                    }
                    new_server := app_library_load(ctx.allocator, VERBOSE);
                    if new_server.is_valid {
                        server = new_server;
                        server.reload(memory);
                    }
                }
            }
        }
    }
} else {
    #load "server.jai";

    main :: () {
        quit := false;
        while quit == false {
            quit = update();
        }
    }
}

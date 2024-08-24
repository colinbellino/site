#import "Basic";
#import "File";
#import "Compiler";
#import "Process";

OUTPUT_EXECUTABLE_NAME :: "server";

#run {
    set_build_options_dc(.{ do_output = false });

    args_main := get_build_options(1).compile_time_command_line;
    arg_release := array_find(args_main, "-release");
    arg_open    := array_find(args_main, "-open");
    arg_debug   := array_find(args_main, "-debug");

    target := ifx arg_release then "RELEASE" else "DEBUG";
    output_target := tprint("%_%_%", OS, CPU, target);
    full_output_path := tprint("dist/%", output_target);
    executable_path := tprint("./%/%", full_output_path, OUTPUT_EXECUTABLE_NAME);

    make_directory_if_it_does_not_exist(full_output_path, recursive = true);

    backend := ifx(arg_release) then Build_Options.Commonly_Propagated.backend.LLVM else .X64;
    optimization := ifx(arg_release) then Optimization_Type.OPTIMIZED else .DEBUG;

    log("Compiling dll. | OS: % | CPU: % | backend: % | target: %.", OS, CPU, backend, target);
    workspace := compiler_create_workspace("Build server");

    options := get_build_options(workspace);
    copy_commonly_propagated_fields(get_build_options(), *options);
    options.output_path = full_output_path;
    options.output_executable_name = OUTPUT_EXECUTABLE_NAME;
    options.output_type = .EXECUTABLE;
    options.os_target   = OS;
    options.cpu_target  = CPU;
    options.backend     = backend;
    set_optimization(*options, optimization);
    set_build_options(options, workspace);

    compiler_begin_intercept(workspace);

    add_build_file("server.jai", workspace);

    while true {
        message := compiler_wait_for_message();
        if message.kind == {
            case .COMPLETE; {
                message_complete := (cast(*Message_Complete) message);
                if message_complete.error_code != .NONE {
                    exit(1);
                }
                break;
            }
        }
    }
    compiler_end_intercept(workspace);

    if arg_open {
        if arg_debug {
            log("------------------------------------------------------------");
            log("Starting debugger: %", executable_path);
            run_command("remedybg", "start-debugging");
        } else {
            log("------------------------------------------------------------");
            log("Starting: %", executable_path);
            run_command(executable_path);
        }
    }
};

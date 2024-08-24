// logger         := runtime_support_default_logger;
// logger_data    :  *void;
// log_source_identifier: u64;      // Arbitrary identifier; settable by the main program.
// log_level      :  Log_Level;     // Settable by the main program to inform anyone who logs.

// Log_Info :: struct {
//     source_identifier:   u64;            // Identifier of the module or program sending this log message. This is entirely optional. 0 means it's unset. If you set it, maybe you pick a unique ID or a hash to use for the module.
//     location:     Source_Code_Location;  // The code that logged the message.
//     common_flags: Log_Flags;             // Standard flags, with a commonly-understood meaning, that the logging entity may set or ignore.
//     user_flags:   u32;                   // Any application-specific or module-specific flags you want to use.
// }

// Log_Flags :: enum_flags u32 {
//     NONE              :: 0x0;
//     ERROR             :: 0x1;   // Indicates that this is an error message.
//     WARNING           :: 0x2;   // Indicates that this is a warning.
//     CONTENT           :: 0x4;   // This notification is more likely relevant to content people than programmers.
//     TO_FILE_ONLY      :: 0x8;   // Log this information to non-visible targets like log files, but don't display interactively.
//     VERBOSE_ONLY      :: 0x10;  // This message is VERBOSE logging output. (e.g. it can be hidden by the user in an interactive log viewer that allows the user to select log levels).
//     VERY_VERBOSE_ONLY :: 0x20;  // This message is VERY_VERBOSE logging output. (e.g. it can be hidden by the user in an interactive log viewer that allows the user to select log levels).
// }

#import "Basic";
#import "Reflection";

noop_logger :: (message: string, data: *void, info: Log_Info) {}

log_warn :: (format_string: string, args: .. Any, loc := #caller_location, flags := Log_Flags.NONE, user_flags : u32 = 0, section : *Log_Section = null) {
    log(format_string, ..args, loc = loc, flags = flags | .WARNING, user_flags = user_flags, section = section);
} @PrintLike

log_content :: (format_string: string, args: .. Any, loc := #caller_location, flags := Log_Flags.NONE, user_flags : u32 = 0, section : *Log_Section = null) {
    log(format_string, ..args, loc = loc, flags = flags | .CONTENT, user_flags = user_flags, section = section);
} @PrintLike

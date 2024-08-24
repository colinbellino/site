pretty_logger_proc :: (message: string, data: *void, info: Log_Info) {
    if !message then return;

    prefix := "[INFO ]";
    if info.common_flags & .CONTENT { prefix = "[\u001b[36mCONT \u001b[00m]"; }
    if info.common_flags & .WARNING { prefix = "[\u001b[33mWARN \u001b[00m]"; }
    if info.common_flags & .ERROR   { prefix = "[\u001b[31mERROR\u001b[00m]"; }

    to_standard_error := (info.common_flags & .ERROR) != 0;

    prefixed_message := tprint("% %", prefix, message);
    if prefixed_message[prefixed_message.count-1] != #char "\n" {
        write_strings(prefixed_message, "\n", to_standard_error = to_standard_error);
    } else {
        write_string(prefixed_message, to_standard_error = to_standard_error);
    }
}

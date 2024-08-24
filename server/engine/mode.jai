Mode :: struct($T: Type) {
    current:       T;
    next:          T;
    entered:       bool;
    entered_at:    Apollo_Time;
}

mode_transition :: (mode: *Mode($T), next: T) {
    assert(mode != null, tprint("Invalid pointer to mode: %", mode));
    mode.next = next;
    mode.entered = false;
    // log_content("mode_transition -> % ", next);
}
mode_transition_current_to_next :: (mode: *Mode($T)) {
    if mode.current != mode.next {
        mode.current = mode.next;
        // log_content("mode -> % ", mode.current);
    }
}
mode_enter :: (mode: *Mode($T)) -> bool {
    entering := mode.entered == false && mode.current == mode.next;
    if entering {
        // mode_data = .{};
        mode.entered = true;
        mode.entered_at = current_time_consensus();
        // log_content("% entered!", mode.current);
    }
    return entering;
}
mode_running :: (mode: Mode($T)) -> bool {
    return mode.current == mode.next;
}
mode_exit :: (mode: Mode($T)) -> bool {
    exited := mode.current != mode.next;
    if exited {
        // log_content("% exited!", mode.current);
    }
    return exited;
}

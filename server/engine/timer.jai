Timer :: struct {
    start:      Apollo_Time;
    // end:        Apollo_Time;
    duration:   s64;
}
timer_progress :: (timer: Timer) -> float {
    end := timer.start + milliseconds_to_apollo(timer.duration);
    remaining := cast(float) to_milliseconds(end - engine.now);
    if remaining <= 0 {
        return 1;
    }
    duration := cast(float) to_milliseconds(end - timer.start);
    progress := (1.0 - (1.0 / (duration / remaining))) * engine.time_scale;
    return clamp(progress, 0, 1);
}
timer_start :: (timer: *Timer, duration_in_milliseconds: s64) {
    timer.start = engine.now;
    timer.duration = duration_in_milliseconds;
}
timer_make :: (duration_in_milliseconds: s64, delay: s64 = 0) -> Timer {
    timer: Timer = ---;
    timer.start = engine.now + milliseconds_to_apollo(delay);
    timer.duration = duration_in_milliseconds;
    return timer;
}

Fixed_Size_String :: struct { // TODO: variable size
    count:      int;
    data:       [32]u8;
}

string_to_fixed_string :: (s: string) -> Fixed_Size_String {
    result: Fixed_Size_String;
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

Fixed_Size_Array :: struct($T: Type, $N: int) {
    count:      int;
    array:      [N]T;
}
fixed_array_add :: (arr: *Fixed_Size_Array($T, $N), item: T) {
    arr.array[arr.count] = item;
    arr.count += 1;
}
for_expansion :: (arr: *Fixed_Size_Array, body: Code, flags: For_Flags) #expand {
    for i: 0..arr.count-1 {
        `it_index := i;
        `it := *arr.array[i];
        #insert body;
    }
}

reverse_array :: (array: []$T, size: s64) {
    for i : 0 .. (size / 2) - 1 {
        temp := array[i];
        array[i] = array[size - 1 - i];
        array[size - 1 - i] = temp;
    }
}

package life

import "core:fmt"
import "core:runtime"
import "core:strings"
import "vendor:wasm/js"
import "platform"

main :: proc() {
    fmt.printf("life.odin > main()\n")
    platform.init()
}

@(export)
step :: proc(delta_time: f32, ctx: runtime.Context) {
  // fmt.printf("life.odin > step(delta_time: %v)\n", delta_time)
  platform.clear()
}

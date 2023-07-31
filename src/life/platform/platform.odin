package platform

import "core:fmt"
import gl "vendor:wasm/WebGL"

init :: proc() {
    ok := gl.CreateCurrentContextById("game", nil)
    fmt.print("init ok: ")
    fmt.println(ok)
}

clear :: proc() {
    gl.ClearColor(1, 0, 0, 1)
    gl.Clear(gl.COLOR_BUFFER_BIT)
}

draw_quad :: proc() {

}

log :: fmt.println
error :: fmt.eprintln

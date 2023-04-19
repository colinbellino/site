//+build js
package breakout_js

foreign import "platform"

@(default_calling_convention="c")
foreign platform {
    show_help :: proc() ---
}

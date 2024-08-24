#import "Basic";
#poke_name (#import "Basic") operator==;
#import "Math";

Color :: #type Vector4;

Vector2s :: struct {
    x, y: s32;
    #place x; component: [2]s32 = ---;
}
operator == :: (a: Vector2s, b: Vector2s) -> bool {
    return a.x == b.x && a.y == b.y;
}
operator + :: (a: Vector2s, b: Vector2s) -> Vector2s {
    result: Vector2s = ---;
    result.x = a.x + b.x;
    result.y = a.y + b.y;
    return result;
}
operator * :: (a: Vector2s, b: Vector2s) -> Vector2s {
    result: Vector2s = ---;
    result.x = a.x * b.x;
    result.y = a.y * b.y;
    return result;
}
operator * :: (a: Vector2s, b: s32) -> Vector2s {
    result: Vector2s = ---;
    result.x = a.x * b;
    result.y = a.y * b;
    return result;
}
operator / :: (a: Vector2s, b: s32) -> Vector2s {
    result: Vector2s = ---;
    result.x = a.x / b;
    result.y = a.y / b;
    return result;
}
to_vector2 :: (a: Vector2s) -> Vector2 {
    result: Vector2 = ---;
    result.x = cast(float) a.x;
    result.y = cast(float) a.y;
    return result;
}

make_vector2s :: (a: Vector2) -> Vector2s {
    result: Vector2s = ---;
    result.x = cast(s32) a.x;
    result.y = cast(s32) a.y;
    return result;
}

Vector4s :: struct {
    x, y, z, w: s32;
    #place x; component: [4] s32 = ---;
    #place x; r: s32 = ---;
    #place y; g: s32 = ---;
    #place z; b: s32 = ---;
    #place w; a: s32 = ---;
}

mat4Rotate :: (v: Vector3, radians: float) -> Matrix4 {
    rot : Matrix4;
    c := cos(radians);
    s := sin(radians);

    a := normalize(v);
    t := a * (1-c);

    rot = Matrix4_Identity;

    rot.coef[0][0] = c + t.component[0]*a.component[0];
    rot.coef[1][0] = 0 + t.component[0]*a.component[1] + s*a.component[2];
    rot.coef[2][0] = 0 + t.component[0]*a.component[2] - s*a.component[1];
    rot.coef[3][0] = 0;

    rot.coef[0][1] = 0 + t.component[1]*a.component[0] - s*a.component[2];
    rot.coef[1][1] = c + t.component[1]*a.component[1];
    rot.coef[2][1] = 0 + t.component[1]*a.component[2] + s*a.component[0];
    rot.coef[3][1] = 0;

    rot.coef[0][2] = 0 + t.component[2]*a.component[0] + s*a.component[1];
    rot.coef[1][2] = 0 + t.component[2]*a.component[1] - s*a.component[0];
    rot.coef[2][2] = c + t.component[2]*a.component[2];
    rot.coef[3][2] = 0;

    return rot;
}

is_in_bounds :: (position: Vector2s, grid_size: Vector2s) -> bool {
    return position.x >= 0 && position.x < grid_size.x && position.y >= 0 && position.y < grid_size.y;
}

grid_index_to_position :: (grid_index: int, grid_size: Vector2s) -> Vector2s {
    return .{ cast(s32)grid_index % grid_size.x, cast(s32)grid_index / grid_size.x };
}
grid_position_to_index :: (grid_position: Vector2s, grid_width: s32) -> int {
    return (grid_position.y * grid_width) + grid_position.x;
}

aabb_collides :: (a_position: Vector2, a_size: Vector2, b_position: Vector2, b_size: Vector2) -> bool {
    return
        a_size.x != 0 && a_size.y != 0 && b_size.x != 0 && b_size.y != 0 &&
        a_position.x < b_position.x + b_size.x &&
        a_position.x + a_size.x > b_position.x &&
        a_position.y < b_position.y + b_size.y &&
        a_position.y + a_size.y > b_position.y
    ;
}

lerp_vector2 :: (a: Vector2, b: Vector2, t: float) -> Vector2 {
    r: Vector2 = ---;

    r.x = a.x + (b.x - a.x) * t;
    r.y = a.y + (b.y - a.y) * t;

    return r;
} @NoProfile
lerp_vector4 :: (a: Vector4, b: Vector4, t: float) -> Vector4 {
    r: Vector4 = ---;

    r.x = a.x + (b.x - a.x) * t;
    r.y = a.y + (b.y - a.y) * t;
    r.z = a.z + (b.z - a.z) * t;
    r.w = a.w + (b.w - a.w) * t;

    return r;
} @NoProfile

degrees_to_radians :: inline (degrees: float) -> float {
    return degrees * (PI / 180.0);
}
radians_to_degrees :: inline (radians: float) -> float {
    return radians * (180.0 / PI);
}

sin_01 :: inline (time: float, frequency: float = 1.0) -> float {
    return 0.5 * (1 + sin(2 * PI * frequency * time));
    // return (sin(time) + 1.0) / 2.0;
}

// This is incomplete, and won't work for matrices that have shear.
// In that case we would use a polar decomposition, so this assumes
// your matrix does not have shear.
decompose_transform :: inline (using matrix : Matrix4) -> (position: Vector3, rotation_z: float, scale: Vector3) {
    position := xyz(_14, _24, _34);
    rotation_z := atan2(_21, _11);
    scale := xyz(
        length(xyz(_11, _21, _31)),
        length(xyz(_12, _22, _32)),
        length(xyz(_13, _23, _33)),
    );

    return position, rotation_z, scale;
}
decompose_transform_position :: inline (using matrix : Matrix4) -> Vector3 {
    return xyz(_14, _24, _34);
}

rotate :: (mat: *$T/interface AnyMatrix3, axis: Vector3, rotation: float) {
    mat.* *= mat4Rotate(axis, rotation);
}

direction_to_degrees :: (direction: Vector2) -> float {
    return (360 / TAU) * atan2(-direction.x, direction.y);
}


turn_toward :: (current_pointer: *float, target: float, dt: float, rate_up: float, rate_down: float = -1.0) {
    assert(current_pointer != null);
    assert(rate_up > 0);

    // First, put both the current and target angles into the rnage [-180, 180].
    current_pointer.* = wrap_degrees(current_pointer.*);
    target = wrap_degrees(target);

    // Now, check whether we are trying to turn more than 180 degrees.
    // If so, change 'target' so that we go the short way around instead of the long way.
    dtheta := target - <<current_pointer;
    if      dtheta >  180 { target -= 360; }
    else if dtheta < -180 { target += 360; }

    current := current_pointer.*;
    if current > target {
        if rate_down == -1 {
            rate_down = rate_up;
        }
        current -= dt * rate_down;
        if current < target {
            current = target;
        }
        current_pointer.* = current;
    } else if current < target {
        current += dt * rate_up;
        if current > target {
            current = target;
        }
        current_pointer.* = current;
    }
}
wrap_degrees :: inline (theta: float) -> float {
    if theta <= -180 { theta += 360; }
    if theta >   180 { theta -= 360; }

    return theta;
}

round :: (x: float) -> s32 {
    return cast(s32) floor(x + 0.5);
}

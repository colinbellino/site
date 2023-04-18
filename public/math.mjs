export const EPSILON = 0.00001;

export function is_point_inside(point, box) {
  return (point.position.x >= box.position.x && point.position.x <= box.position.x + box.width) &&
         (point.position.y >= box.position.y && point.position.y <= box.position.y + box.height);
}

export function normalize(value, min = 0, max = 1) {
  return (value - min) / (max - min);
}

export function lerp(start, end, t) {
  return start + (end - start) * clamp(t, 0, 1);
}

export function clamp(value, min, max) {
  if (value < min)
    return min;
  else if (value > max)
    return max;
  return value;
}

export function magnitude(vector) {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

export function divide_vector(vector, value) {
  return { x: vector.x / value, y: vector.y /value };
}

export function normalize_vector(vector) {
  const mag = magnitude(vector);
  if (mag > EPSILON)
    return divide_vector(vector, mag);
  else
    return 0;
}

export function random(min, max) {
  return Math.random() * (max - min) + min;
}

import { platform_start, platform_stop } from "./breakout_platform.mjs";

window.breakout = {
  start: platform_start,
  stop: platform_stop,
};

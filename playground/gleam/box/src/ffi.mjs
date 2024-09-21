import { Ok, Error } from "./gleam.mjs";

export function window_location_href() {
  return new Ok(window.location.href);
}

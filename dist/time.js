export const DAY = 86400;
export const wrap = (seconds) => ((seconds % DAY) + DAY) % DAY;
export function angleDelta(previous, next) {
  return ((next - previous + 540) % 360) - 180;
}
export function parseTime(value) {
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;
  const [h, m, s = 0] = value.split(':').map(Number);
  return h < 24 && m < 60 && s < 60 ? h * 3600 + m * 60 + s : null;
}
export function formatTime(seconds) {
  const n = Math.floor(wrap(seconds));
  return [Math.floor(n / 3600), Math.floor(n / 60) % 60, n % 60]
    .map(value => String(value).padStart(2, '0')).join(':');
}

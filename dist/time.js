export const DAY = 86400;
export const wrap = (seconds) => ((seconds % DAY) + DAY) % DAY;
export function movementTime(seconds, ticksPerSecond = 0) {
  return ticksPerSecond ? Math.floor(seconds * ticksPerSecond) / ticksPerSecond : seconds;
}
export function localTime(date = new Date()) {
  return date.getHours()*3600 + date.getMinutes()*60 + date.getSeconds() + date.getMilliseconds()/1000;
}
export function angleDelta(previous, next) {
  return ((next - previous + 540) % 360) - 180;
}
export function parseTime(value, hourCycle = 24, period = 'am') {
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;
  let [h, m, s = 0] = value.split(':').map(Number);
  if (hourCycle === 12) {
    if (h < 1 || h > 12 || !['am', 'pm'].includes(period)) return null;
    h = h % 12 + (period === 'pm' ? 12 : 0);
  }
  return h < 24 && m < 60 && s < 60 ? h * 3600 + m * 60 + s : null;
}
export function formatTime(seconds, hourCycle = 24) {
  const n = Math.floor(wrap(seconds));
  const hour = Math.floor(n / 3600);
  return [hourCycle === 12 ? hour % 12 || 12 : hour, Math.floor(n / 60) % 60, n % 60]
    .map(value => String(value).padStart(2, '0')).join(':');
}

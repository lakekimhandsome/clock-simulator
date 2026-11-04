import { wrap, angleDelta, parseTime, formatTime, localTime, movementTime } from './time.js?v=5';

const $ = id => document.getElementById(id);
const svgNS = 'http://www.w3.org/2000/svg';
for (let i = 0; i < 60; i++) {
  const tick = document.createElementNS(svgNS, 'line');
  const major = i % 5 === 0;
  for (const [name, value] of Object.entries({x1:300,y1:major?35:26,x2:300,y2:major?54:34,transform:`rotate(${i*6} 300 300)`,class:`tick${major?' major':''}`})) tick.setAttribute(name, value);
  $('marks').append(tick);
}
for (let i = 1; i <= 12; i++) {
  const text = document.createElementNS(svgNS, 'text');
  const angle = i * Math.PI / 6;
  for (const [name, value] of Object.entries({x:300+Math.sin(angle)*219,y:300-Math.cos(angle)*219,'text-anchor':'middle','dominant-baseline':'central',class:'number'})) text.setAttribute(name, value);
  text.textContent = i;
  $('numbers').append(text);
}
let seconds = localTime();
let playing = true;
let realtime = false;
let origin = performance.now();
let base = seconds;
let drag = null;
let ticksPerSecond = 0;
let hourCycle = 24;
const hands = { hour:43200, minute:3600, second:60 };
function current() {
  if (!playing) return seconds;
  return realtime ? localTime() : wrap(base + (performance.now()-origin)/1000);
}
function render() {
  seconds = current();
  const handTime = movementTime(seconds, ticksPerSecond);
  for (const [name, period] of Object.entries(hands)) {
    $(name).setAttribute('transform', `rotate(${handTime / period * 360} 300 300)`);
    const value = name === 'hour' ? Math.floor(seconds/3600) : name === 'minute' ? Math.floor(seconds/60)%60 : Math.floor(seconds)%60;
    $(name).setAttribute('aria-valuenow', value);
    $(name).setAttribute('aria-valuetext', `${value}${name==='hour'?'시':name==='minute'?'분':'초'}`);
    $(name).setAttribute('aria-disabled', String(playing));
    $(name).setAttribute('tabindex', playing ? '-1' : '0');
  }
  if (document.activeElement !== $('time')) {
    $('time').value = formatTime(seconds, hourCycle);
    $('period').value = seconds < 43200 ? 'am' : 'pm';
  }
  $('clock').setAttribute('aria-label', `아날로그 시계 ${formatTime(seconds)}`);
}
function setTime(value) { seconds = wrap(value); base = seconds; origin = performance.now(); render(); }
function setPlaying(value) {
  seconds = current();
  playing = value;
  if (!playing) realtime = false;
  base = seconds; origin = performance.now();
  document.body.classList.toggle('paused', !playing);
  $('time').disabled = playing;
  $('period').disabled = playing;
  $('toggle-label').textContent = playing ? '정지' : '재생';
  $('realtime').textContent = playing ? '실제 시간으로 이동' : '실제 시간으로 재생';
  $('toggle').setAttribute('aria-label', playing ? '정지' : '재생');
  $('toggle-icon').setAttribute('href', `icons.svg#${playing ? 'pause' : 'play'}`);
  $('hint').textContent = playing ? '정지하면 바늘을 돌리거나 시간을 입력할 수 있어요.' : '바늘을 잡고 돌려 보세요. 시간도 직접 입력할 수 있어요.';
  render();
}
$('toggle').addEventListener('click', () => setPlaying(!playing));
document.addEventListener('keydown', event => {
  if (!['Space', 'KeyF'].includes(event.code) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing || event.defaultPrevented) return;
  if (event.target.isContentEditable || event.target.closest('input, textarea, select')) return;
  event.preventDefault();
  if (event.repeat || drag) return;
  if (event.code === 'KeyF') toggleFullscreen();
  else setPlaying(!playing);
});
for (const id of ['second-mode', 'hour-cycle', 'period']) {
  $(id).addEventListener('pointerdown', event => event.currentTarget.classList.add('pointer-focus'));
  $(id).addEventListener('keydown', event => event.currentTarget.classList.remove('pointer-focus'));
  $(id).addEventListener('blur', event => event.currentTarget.classList.remove('pointer-focus'));
}
$('hour-cycle').addEventListener('change', event => {
  hourCycle = Number(event.target.value);
  $('period-label').hidden = hourCycle === 24;
  render();
});
$('second-mode').addEventListener('change', event => {
  ticksPerSecond = Number(event.target.value);
  render();
});
$('realtime').addEventListener('click', () => {
  realtime = true;
  setPlaying(true);
});
$('time').disabled = true;
$('period').disabled = true;
function updateTime() {
  if (playing) return;
  const parsed = parseTime($('time').value, hourCycle, $('period').value);
  if (parsed !== null) setTime(parsed);
  else { $('time').value = formatTime(seconds, hourCycle); $('period').value = seconds < 43200 ? 'am' : 'pm'; $('message').textContent = '올바른 시간을 입력해 주세요.'; }
}
$('time').addEventListener('change', updateTime);
$('period').addEventListener('change', updateTime);
function pointerAngle(event) {
  const rect = $('clock').getBoundingClientRect();
  return (Math.atan2(event.clientX-rect.left-rect.width/2, -(event.clientY-rect.top-rect.height/2))*180/Math.PI + 360)%360;
}
for (const [name, period] of Object.entries(hands)) {
  const hand = $(name);
  hand.addEventListener('pointerdown', event => {
    if (playing || drag || (event.pointerType==='mouse' && event.button!==0)) return;
    event.preventDefault();
    $('time').blur();
    drag = { id:event.pointerId, angle:pointerAngle(event), value:seconds };
    hand.setPointerCapture(event.pointerId);
  });
  hand.addEventListener('pointermove', event => {
    if (!drag || drag.id!==event.pointerId) return;
    const angle = pointerAngle(event);
    drag.value += angleDelta(drag.angle, angle) / 360 * period;
    drag.angle = angle;
    setTime(Math.round(drag.value));
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) hand.addEventListener(type, event => {
    if (drag?.id===event.pointerId) drag=null;
  });
  hand.addEventListener('keydown', event => {
    if (playing || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const increment = name==='hour'?3600:name==='minute'?60:1;
    setTime(seconds + (event.key==='ArrowUp'||event.key==='ArrowRight'?1:-1)*increment);
  });
}
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.body.requestFullscreen) await document.body.requestFullscreen();
    else $('message').textContent = '이 브라우저는 전체화면을 지원하지 않습니다.';
  } catch { $('message').textContent = '전체화면으로 전환하지 못했습니다.'; }
}
$('fullscreen').addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', () => {
  $('fullscreen').setAttribute('aria-label', document.fullscreenElement ? '전체화면 종료' : '전체화면');
  $('fullscreen-icon').setAttribute('href', `icons.svg#${document.fullscreenElement ? 'minimize' : 'maximize'}`);
  $('fullscreen').title = document.fullscreenElement ? '전체화면 종료 (F)' : '전체화면 (F)';
});
function frame() { if (playing) render(); requestAnimationFrame(frame); }
render(); requestAnimationFrame(frame);

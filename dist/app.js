import { wrap, angleDelta, parseTime, formatTime } from './time.js';

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
const now = new Date();
let seconds = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();
let playing = true;
let origin = performance.now();
let base = seconds;
let drag = null;
const hands = { hour:43200, minute:3600, second:60 };
function current() { return playing ? wrap(base + (performance.now()-origin)/1000) : seconds; }
function render() {
  seconds = current();
  for (const [name, period] of Object.entries(hands)) {
    $(name).setAttribute('transform', `rotate(${seconds / period * 360} 300 300)`);
    const value = name === 'hour' ? Math.floor(seconds/3600) : name === 'minute' ? Math.floor(seconds/60)%60 : Math.floor(seconds)%60;
    $(name).setAttribute('aria-valuenow', value);
    $(name).setAttribute('aria-valuetext', `${value}${name==='hour'?'시':name==='minute'?'분':'초'}`);
    $(name).setAttribute('aria-disabled', String(playing));
    $(name).setAttribute('tabindex', playing ? '-1' : '0');
  }
  if (document.activeElement !== $('time')) $('time').value = formatTime(seconds);
  $('clock').setAttribute('aria-label', `아날로그 시계 ${formatTime(seconds)}`);
}
function setTime(value) { seconds = wrap(value); base = seconds; origin = performance.now(); render(); }
$('toggle').addEventListener('click', () => {
  seconds = current();
  playing = !playing;
  base = seconds; origin = performance.now();
  document.body.classList.toggle('paused', !playing);
  $('time').disabled = playing;
  $('toggle-label').textContent = playing ? '정지' : '재생';
  $('toggle').setAttribute('aria-label', playing ? '정지' : '재생');
  $('toggle-icon').innerHTML = playing ? '<path d="M5 3h3v14H5zm7 0h3v14h-3z"/>' : '<path d="m6 3 11 7-11 7z"/>';
  $('hint').textContent = playing ? '정지하면 바늘을 돌리거나 시간을 입력할 수 있어요.' : '바늘을 잡고 돌려 보세요. 시간도 직접 입력할 수 있어요.';
  render();
});
$('time').disabled = true;
$('time').addEventListener('change', event => {
  if (playing) return;
  const parsed = parseTime(event.target.value);
  if (parsed !== null) setTime(parsed);
  else { event.target.value = formatTime(seconds); $('message').textContent = '올바른 시간을 입력해 주세요.'; }
});
function pointerAngle(event) {
  const rect = $('clock').getBoundingClientRect();
  return (Math.atan2(event.clientX-rect.left-rect.width/2, -(event.clientY-rect.top-rect.height/2))*180/Math.PI + 360)%360;
}
for (const [name, period] of Object.entries(hands)) {
  const hand = $(name);
  hand.addEventListener('pointerdown', event => {
    if (playing || drag || (event.pointerType==='mouse' && event.button!==0)) return;
    event.preventDefault();
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
$('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.body.requestFullscreen) await document.body.requestFullscreen();
    else $('message').textContent = '이 브라우저는 전체화면을 지원하지 않습니다.';
  } catch { $('message').textContent = '전체화면으로 전환하지 못했습니다.'; }
});
document.addEventListener('fullscreenchange', () => {
  $('fullscreen').setAttribute('aria-label', document.fullscreenElement ? '전체화면 종료' : '전체화면');
  $('fullscreen').title = document.fullscreenElement ? '전체화면 종료' : '전체화면';
});
function frame() { if (playing) render(); requestAnimationFrame(frame); }
render(); requestAnimationFrame(frame);

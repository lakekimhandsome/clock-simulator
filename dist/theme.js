const themePreference = window.matchMedia('(prefers-color-scheme: dark)');
let savedTheme;
try { savedTheme = localStorage.getItem('theme'); } catch {}
if (!['light', 'dark'].includes(savedTheme)) savedTheme = null;
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#181b17' : '#f5f4f0';
  const button = document.getElementById('theme');
  if (button) {
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.setAttribute('aria-label', theme === 'dark' ? '라이트 모드' : '다크 모드');
    button.title = theme === 'dark' ? '라이트 모드' : '다크 모드';
  }
}
const preferredTheme = () => savedTheme || (themePreference.matches ? 'dark' : 'light');
applyTheme(preferredTheme());
themePreference.addEventListener('change', () => applyTheme(preferredTheme()));
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(preferredTheme());
  document.getElementById('theme').addEventListener('click', () => {
    savedTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', savedTheme); } catch {}
    applyTheme(savedTheme);
  });
});

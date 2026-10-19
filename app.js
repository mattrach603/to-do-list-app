'use strict';
// Preserve tasks from the original version of the app.
const STORAGE_KEY = 'daylight.tasks.v1';
const $ = selector => document.querySelector(selector);
const input = $('#task-input');
const list = $('#task-list');
let tasks = [];
let filter = 'all';
let storageAvailable = true;
let undoTasks = null;
let toastTimer;
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const ids = new Set();
  if (Array.isArray(saved)) tasks = saved.filter(task => {
    if (!task || typeof task.id !== 'string' || ids.has(task.id) || typeof task.text !== 'string' || !task.text.trim() || typeof task.completed !== 'boolean') return false;
    ids.add(task.id);
    return true;
  }).map(task => ({ id: task.id, text: task.text.slice(0, 240), completed: task.completed, category: ['Personal', 'Work', 'Life'].includes(task.category) ? task.category : 'Personal' }));
} catch { storageAvailable = false; }
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); storageAvailable = true; }
  catch { storageAvailable = false; }
}
function announce(text) { $('#announcement').textContent = text; }
function notify(text, snapshot) {
  clearTimeout(toastTimer);
  undoTasks = snapshot || null;
  $('#toast-text').textContent = text;
  $('#undo-button').hidden = !undoTasks;
  $('#toast').hidden = false;
  toastTimer = setTimeout(dismissToast, 7000);
}
function dismissToast() { $('#toast').hidden = true; undoTasks = null; clearTimeout(toastTimer); }
const pencil = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z"/></svg>';
const trash = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/></svg>';
function editTask(task, row) {
  if (row.querySelector('.edit-input')) return;
  const label = row.querySelector('.task-text');
  const field = document.createElement('input');
  field.className = 'edit-input'; field.value = task.text; field.maxLength = 240;
  field.setAttribute('aria-label', 'Edit task. Enter to save, Escape to cancel.');
  label.replaceWith(field); field.focus(); field.select();
  let finished = false;
  function finish(cancel = false) {
    if (finished) return;
    finished = true;
    const text = field.value.trim();
    if (!cancel && text) { task.text = text; save(); announce('Task updated.'); }
    render();
    list.querySelector(`[data-id="${CSS.escape(task.id)}"] .edit-task`)?.focus();
  }
  field.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === 'Escape') { event.preventDefault(); finish(event.key === 'Escape'); }
  });
  field.addEventListener('blur', () => finish());
}
function render() {
  const completed = tasks.filter(task => task.completed).length;
  const active = tasks.length - completed;
  const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  for (const [name, value] of [['total', tasks.length], ['active', active], ['completed', completed]]) {
    $(`#${name}-stat`).textContent = String(value).padStart(2, '0');
    $(`#nav-${name === 'total' ? 'all' : name}`).textContent = value;
  }
  $('#progress-percent').replaceChildren(document.createTextNode(percent), Object.assign(document.createElement('span'), { textContent: '%' }));
  $('#progress-ring').style.setProperty('--progress', `${percent}%`);
  $('#progress-ring').setAttribute('aria-label', `${percent} percent completed`);
  $('#progress-caption').textContent = !tasks.length ? 'Your progress starts here' : percent === 100 ? 'All done. Enjoy the breathing room.' : `${active} more ${active === 1 ? 'step' : 'steps'} forward`;
  $('#clear-completed').disabled = completed === 0;
  $('#save-status').textContent = storageAvailable ? 'Saved on this device' : 'Storage unavailable. Changes stay in this tab.';
  const query = $('#search-input').value.trim().toLowerCase();
  let visible = tasks.filter(task => (filter === 'all' || (filter === 'completed' ? task.completed : !task.completed)) && task.text.toLowerCase().includes(query));
  const sort = $('#sort-select').value;
  if (sort === 'newest') visible.reverse();
  else if (sort === 'az') visible.sort((a, b) => a.text.localeCompare(b.text));
  $('#view-count').textContent = visible.length;
  list.replaceChildren();
  visible.forEach((task, index) => {
    const row = document.createElement('li'); row.className = `task${task.completed ? ' completed' : ''}`; row.dataset.id = task.id;
    const check = document.createElement('input'); check.type = 'checkbox'; check.className = 'task-check'; check.checked = task.completed;
    check.setAttribute('aria-label', `Mark ${task.text} ${task.completed ? 'incomplete' : 'complete'}`);
    check.addEventListener('change', () => {
      task.completed = check.checked; save(); render();
      const target = list.querySelector(`[data-id="${CSS.escape(task.id)}"] .task-check`) || list.children[Math.min(index, list.children.length - 1)]?.querySelector('.task-check') || input;
      target.focus(); announce(task.completed ? 'Task completed. A step forward!' : 'Task marked to do.');
    });
    const text = document.createElement('span'); text.className = 'task-text'; text.textContent = task.text;
    const badge = document.createElement('span'); badge.className = `category-badge category-${task.category.toLowerCase()}`; badge.textContent = task.category;
    const actions = document.createElement('div'); actions.className = 'task-actions';
    const edit = document.createElement('button'); edit.className = 'icon-button edit-task'; edit.innerHTML = pencil; edit.setAttribute('aria-label', `Edit ${task.text}`); edit.title = 'Edit task'; edit.addEventListener('click', () => editTask(task, row));
    const remove = document.createElement('button'); remove.className = 'icon-button delete-task'; remove.innerHTML = trash; remove.setAttribute('aria-label', `Delete ${task.text}`); remove.title = 'Delete task';
    remove.addEventListener('click', () => {
      const snapshot = tasks.map(item => ({ ...item }));
      tasks = tasks.filter(item => item.id !== task.id); save(); render(); notify('Task deleted', snapshot);
      (list.children[Math.min(index, list.children.length - 1)]?.querySelector('.delete-task') || input).focus();
    });
    actions.append(edit, remove); row.append(check, text, badge, actions); list.append(row);
  });
  $('#empty-state').hidden = visible.length > 0;
  $('#empty-add').hidden = Boolean(query) || filter === 'completed';
  $('#empty-state h3').textContent = query ? 'Nothing by that name.' : filter === 'completed' ? 'Good things are in progress.' : filter === 'active' && tasks.length ? 'Look at you. All done.' : 'A fresh page. A clear head.';
  $('#empty-state p').textContent = query ? 'Try a different search or clear it to see your tasks.' : filter === 'completed' ? 'Check off a task and your wins will show up here.' : filter === 'active' && tasks.length ? 'You’ve earned a little breathing room.' : 'Put that thing on your mind on your list. Your first small win starts here.';
}
function setFilter(value) {
  filter = value;
  document.querySelectorAll('[data-filter]').forEach(button => { const active = button.dataset.filter === value; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  document.querySelectorAll('[data-view]').forEach(button => { const active = button.dataset.view === value; button.classList.toggle('active', active); if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
  $('#breadcrumb').textContent = { all: 'All tasks', active: 'In progress', completed: 'Completed' }[value];
  render();
}
$('#task-form').addEventListener('submit', event => {
  event.preventDefault(); const text = input.value.trim(); if (!text) { input.value = ''; input.focus(); return; }
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  tasks.push({ id, text, completed: false, category: $('#task-category').value });
  save(); input.value = ''; $('#search-input').value = ''; setFilter('all'); input.focus(); announce('Task added.');
});
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setFilter(button.dataset.view)));
$('#search-input').addEventListener('input', render);
$('#sort-select').addEventListener('change', render);
for (const id of ['#new-task', '#empty-add']) $(id).addEventListener('click', () => { input.focus(); input.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); });
$('#clear-completed').addEventListener('click', () => { const snapshot = tasks.map(task => ({ ...task })); tasks = tasks.filter(task => !task.completed); save(); render(); input.focus(); notify('Completed tasks cleared', snapshot); });
$('#undo-button').addEventListener('click', () => { if (undoTasks) { tasks = undoTasks; save(); render(); dismissToast(); input.focus(); announce('Tasks restored.'); } });
$('#dismiss-toast').addEventListener('click', dismissToast);
document.addEventListener('keydown', event => {
  if (event.key.toLowerCase() === 'n' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input, textarea, select, [contenteditable]')) { event.preventDefault(); input.focus(); }
});
window.addEventListener('storage', event => { if (event.key === STORAGE_KEY || event.key === null) window.location.reload(); });
$('#today').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
render();

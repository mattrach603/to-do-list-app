import { addTask, editTask, toggleTask, deleteTask, loadTasks, saveTasks } from './tasks.js';

const list = document.querySelector('#tasks');
const form = document.querySelector('#add-form');
const input = document.querySelector('#title');
const error = document.querySelector('#error');
let tasks = [];
let storageReady = true;
try {
  tasks = loadTasks(window.localStorage);
} catch {
  storageReady = false;
  showError('Saved tasks could not be loaded. Check browser storage and reload. Changes are disabled to protect existing data.');
  form.querySelectorAll('input, button').forEach(element => { element.disabled = true; });
}

function showError(message) {
  error.textContent = message;
  error.hidden = false;
}

// Persist first: failed writes leave both the UI and in-memory tasks unchanged.
function commit(next) {
  if (!storageReady) return false;
  try {
    saveTasks(window.localStorage, next);
    tasks = next;
    error.hidden = true;
    render();
    return true;
  } catch {
    showError('Could not save your change. Check available browser storage and try again.');
    return false;
  }
}

function button(label, action) {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.addEventListener('click', action);
  return element;
}

function render() {
  list.replaceChildren();
  document.querySelector('#empty').hidden = tasks.length > 0;
  const remaining = tasks.filter(task => !task.completed).length;
  document.querySelector('#summary').textContent = `${remaining} remaining · ${tasks.length} total`;
  for (const task of tasks) {
    const row = document.createElement('li');
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => {
      if (commit(toggleTask(tasks, task.id))) {
        document.getElementById(task.id).focus();
      } else checkbox.checked = task.completed;
    });
    checkbox.id = task.id;
    const title = document.createElement('span');
    title.textContent = task.title;
    title.className = task.completed ? 'completed' : '';
    label.append(checkbox, title);
    const actions = document.createElement('div');
    actions.className = 'actions';
    const edit = button('Edit', () => {
      const editor = document.createElement('form');
      const field = document.createElement('input');
      field.value = task.title;
      field.required = true;
      field.maxLength = 200;
      field.setAttribute('aria-label', 'Edit task title');
      const save = document.createElement('button');
      save.textContent = 'Save';
      const cancel = button('Cancel', () => { render(); document.getElementById(task.id).focus(); });
      editor.append(field, save, cancel);
      editor.addEventListener('submit', event => {
        event.preventDefault();
        try {
          if (commit(editTask(tasks, task.id, field.value))) document.getElementById(task.id).focus();
        } catch (cause) { showError(cause.message); }
      });
      editor.addEventListener('keydown', event => { if (event.key === 'Escape') cancel.click(); });
      row.replaceChildren(editor);
      field.focus();
      field.select();
    });
    edit.setAttribute('aria-label', `Edit ${task.title}`);
    const remove = button('Delete', () => { if (commit(deleteTask(tasks, task.id))) input.focus(); });
    remove.setAttribute('aria-label', `Delete ${task.title}`);
    actions.append(edit, remove);
    row.append(label, actions);
    list.append(row);
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    if (commit(addTask(tasks, input.value))) { form.reset(); input.focus(); }
  } catch (cause) { showError(cause.message); }
});
render();

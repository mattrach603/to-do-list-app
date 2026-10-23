export const STORAGE_KEY = 'todo.tasks.v1';
export const MAX_TITLE_LENGTH = 200;

function cleanTitle(title) {
  if (typeof title !== 'string' || !title.trim() || title.trim().length > MAX_TITLE_LENGTH) {
    throw new Error(`Enter a task between 1 and ${MAX_TITLE_LENGTH} characters.`);
  }
  return title.trim();
}

/** @typedef {{id: string, title: string, completed: boolean, createdAt: string}} Task */
export function addTask(tasks, title) {
  return [...tasks, { id: crypto.randomUUID(), title: cleanTitle(title), completed: false, createdAt: new Date().toISOString() }];
}

export function editTask(tasks, id, title) {
  const cleaned = cleanTitle(title);
  return tasks.map(task => task.id === id ? { ...task, title: cleaned } : task);
}

export function toggleTask(tasks, id) {
  return tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
}

export function deleteTask(tasks, id) {
  return tasks.filter(task => task.id !== id);
}

export function loadTasks(storage) {
  const tasks = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
  if (!Array.isArray(tasks) || tasks.some(task =>
    !task || typeof task.id !== 'string' || !task.id ||
    typeof task.title !== 'string' || !task.title.trim() || task.title.length > MAX_TITLE_LENGTH ||
    typeof task.completed !== 'boolean' || typeof task.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(task.createdAt))) || new Set(tasks.map(task => task.id)).size !== tasks.length) {
    throw new Error('Stored tasks are invalid.');
  }
  return tasks;
}

export function saveTasks(storage, tasks) {
  storage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

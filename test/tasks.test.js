import test from 'node:test';
import assert from 'node:assert/strict';
import { addTask, editTask, toggleTask, deleteTask, loadTasks, saveTasks } from '../src/tasks.js';

test('task lifecycle persists and does not mutate previous state', () => {
  const original = addTask([], '  Buy milk  ');
  assert.equal(original[0].title, 'Buy milk');
  assert.equal(original[0].completed, false);
  const second = addTask(original, 'Read');
  assert.notEqual(second[0].id, second[1].id);
  const edited = editTask(second, original[0].id, 'Buy bread');
  assert.equal(original[0].title, 'Buy milk');
  const completed = toggleTask(edited, original[0].id);
  assert.equal(completed[0].completed, true);
  assert.equal(toggleTask(completed, original[0].id)[0].completed, false);
  let value;
  const storage = { setItem: (_, next) => { value = next; }, getItem: () => value };
  saveTasks(storage, completed);
  assert.deepEqual(loadTasks(storage), completed);
  assert.deepEqual(deleteTask(completed, original[0].id), [completed[1]]);
});

test('rejects invalid titles and corrupt storage without overwriting it', () => {
  for (const title of ['', '   ', 'a'.repeat(201), null]) {
    assert.throws(() => addTask([], title));
    assert.throws(() => editTask([], 'missing', title));
  }
  assert.deepEqual(loadTasks({ getItem: () => null }), []);
  for (const value of ['broken', '{}', '[null]', '[{"id":"a"}]']) {
    assert.throws(() => loadTasks({ getItem: () => value }));
  }
  assert.throws(() => saveTasks({ setItem: () => { throw new Error('full'); } }, []), /full/);
});

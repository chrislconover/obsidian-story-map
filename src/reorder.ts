import type { StoryMapData } from "./types";

/** Move an activity before `beforeId`, or to the end. Its tasks follow, because they reference it by id. */
export function moveActivity(data: StoryMapData, activityId: string, beforeId?: string): boolean {
  if (activityId === beforeId) return false;
  return moveItem(data.activities, activityId, items => beforeId ? items.findIndex(item => item.id === beforeId) : items.length);
}

/** Move a task before `beforeId`, or to the end of `activityId`; its stories follow it into the new activity. */
export function moveTask(data: StoryMapData, taskId: string, activityId: string, beforeId?: string): boolean {
  if (taskId === beforeId) return false;
  const task = data.tasks.find(item => item.id === taskId);
  const moved = moveItem(data.tasks, taskId, items => {
    const before = beforeId ? items.findIndex(item => item.id === beforeId) : -1;
    let last = -1;
    items.forEach((item, index) => { if (item.activityId === activityId) last = index; });
    return before >= 0 ? before : last >= 0 ? last + 1 : items.length;
  });
  if (!task || (!moved && task.activityId === activityId)) return false;
  task.activityId = activityId;
  for (const story of data.stories) if (story.taskId === task.id) story.activityId = activityId;
  return true;
}

/** Remove the item with `id`, then reinsert it at the index `target` picks from the remaining items; a missing target appends. Reports whether the order changed. */
function moveItem<T extends { id: string }>(items: T[], id: string, target: (rest: T[]) => number): boolean {
  const from = items.findIndex(item => item.id === id);
  if (from < 0) return false;
  const [item] = items.splice(from, 1);
  if (!item) return false;
  const picked = target(items);
  const to = picked < 0 ? items.length : picked;
  items.splice(to, 0, item);
  return to !== from;
}

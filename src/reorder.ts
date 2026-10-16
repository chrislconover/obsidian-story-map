import type { StoryMapData } from "./types";

/** Move a task before `beforeId`, or to the end of `activityId`; its stories follow it into the new activity. */
export function moveTask(data: StoryMapData, taskId: string, activityId: string, beforeId?: string): boolean {
  if (taskId === beforeId) return false;
  const from = data.tasks.findIndex(task => task.id === taskId);
  if (from < 0) return false;
  const [task] = data.tasks.splice(from, 1);
  if (!task) return false;
  const before = beforeId ? data.tasks.findIndex(item => item.id === beforeId) : -1;
  let last = -1;
  data.tasks.forEach((item, index) => { if (item.activityId === activityId) last = index; });
  const to = before >= 0 ? before : last >= 0 ? last + 1 : data.tasks.length;
  data.tasks.splice(to, 0, task);
  if (to === from && task.activityId === activityId) return false;
  task.activityId = activityId;
  for (const story of data.stories) if (story.taskId === task.id) story.activityId = activityId;
  return true;
}

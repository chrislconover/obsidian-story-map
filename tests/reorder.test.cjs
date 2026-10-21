const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const context={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../src/reorder.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
const {moveActivity,moveTask}=context.exports;

const map=()=>({tasks:[{id:'a1',activityId:'A'},{id:'a2',activityId:'A'},{id:'b1',activityId:'B'},{id:'b2',activityId:'B'}],stories:[{id:'s1',taskId:'a1',activityId:'A'},{id:'s2',taskId:'a2',activityId:'A'},{id:'s3',taskId:'a1',activityId:'A'}]});
const order=data=>data.tasks.map(task=>`${task.activityId}:${task.id}`).join(' ');

test('tasks reorder within an activity, before a task or at its end',()=>{
 const data=map();
 assert.equal(moveTask(data,'a2','A','a1'),true);assert.equal(order(data),'A:a2 A:a1 B:b1 B:b2');
 assert.equal(moveTask(data,'a2','A'),true);assert.equal(order(data),'A:a1 A:a2 B:b1 B:b2');
});
test('a task moved to another activity takes all its stories with it and leaves others alone',()=>{
 const data=map();
 assert.equal(moveTask(data,'a1','B','b2'),true);assert.equal(order(data),'A:a2 B:b1 B:a1 B:b2');
 assert.deepEqual(data.stories.map(story=>story.activityId),['B','A','B']);
 assert.equal(moveTask(data,'a2','B'),true);assert.equal(order(data),'B:b1 B:a1 B:b2 B:a2');
});
test('a task can move into an activity that has no tasks',()=>{
 const data=map();
 assert.equal(moveTask(data,'b1','C'),true);assert.equal(order(data),'A:a1 A:a2 B:b2 C:b1');
});
test('drops that leave the order unchanged report no change, so no undo step is recorded',()=>{
 const data=map();const before=JSON.stringify(data);
 assert.equal(moveTask(data,'a1','A','a1'),false);
 assert.equal(moveTask(data,'a1','A','a2'),false);
 assert.equal(moveTask(data,'a2','A'),false);
 assert.equal(moveTask(data,'missing','A'),false);
 assert.equal(JSON.stringify(data),before);
});

const activities=()=>({activities:[{id:'A'},{id:'B'},{id:'C'}],tasks:map().tasks,stories:map().stories});
const activityOrder=data=>data.activities.map(activity=>activity.id).join(' ');

test('activities reorder before an activity or to the end, without touching tasks or stories',()=>{
 const data=activities();const tasks=JSON.stringify(data.tasks),stories=JSON.stringify(data.stories);
 assert.equal(moveActivity(data,'C','A'),true);assert.equal(activityOrder(data),'C A B');
 assert.equal(moveActivity(data,'C'),true);assert.equal(activityOrder(data),'A B C');
 assert.equal(moveActivity(data,'A','C'),true);assert.equal(activityOrder(data),'B A C');
 assert.equal(JSON.stringify(data.tasks),tasks);assert.equal(JSON.stringify(data.stories),stories);
});
test('activity drops that leave the order unchanged report no change',()=>{
 const data=activities();const before=JSON.stringify(data);
 assert.equal(moveActivity(data,'A','A'),false);
 assert.equal(moveActivity(data,'A','B'),false);
 assert.equal(moveActivity(data,'C'),false);
 assert.equal(moveActivity(data,'missing'),false);
 assert.equal(JSON.stringify(data),before);
});

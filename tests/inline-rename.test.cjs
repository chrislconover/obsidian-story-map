const {test,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const {createMapView}=require('./helpers/map-view.cjs');
let f;
beforeEach(async()=>{f=await createMapView()});
afterEach(()=>f?.close());
const input=()=>f.target('.story-map-inline-input');
const title=kind=>f.target(`[data-rename-kind="${kind}"] .story-map-rename-title`);
const enter=()=>input().dispatchEvent(new f.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
const tick=()=>new Promise(r=>setTimeout(r,0));
async function edit(kind,value){title(kind).click();input().value=value;input().dispatchEvent(new f.window.Event('input',{bubbles:true}));}

test('Activity, Task and Story title clicks save inline, persist and undo/redo without renaming notes',async()=>{
 for(const [kind,key] of [['activity','activities'],['task','tasks'],['story','stories']]){
  const old=f.plugin.data[key][0].title;
  await edit(kind,old+' renamed');assert.equal(f.plugin.activeEditors,1);enter();await tick();await f.settle();
  assert.equal(f.plugin.activeEditors,0);assert.equal(f.plugin.data[key][0].title,old+' renamed');
  assert.equal(JSON.parse(f.files.get('.story-map.json'))[key][0].title,old+' renamed');
  f.plugin.undo();await f.settle();assert.equal(f.plugin.data[key][0].title,old);
  f.plugin.redo();await f.settle();assert.equal(f.plugin.data[key][0].title,old+' renamed');
 }
 assert.equal(f.plugin.data.stories[0].notePath,'Original.md');
});
test('Escape, unchanged and whitespace do not write or add undo history; blur saves',async()=>{
 const n=f.plugin.history.length;
 await edit('story','Discard');input().dispatchEvent(new f.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
 assert.equal(f.plugin.data.stories[0].title,'Story');
 await edit('story','   ');enter();await tick();assert.equal(f.plugin.history.length,n);
 await edit('story','Story');enter();await tick();assert.equal(f.plugin.history.length,n);
 await edit('story','Blur title');input().dispatchEvent(new f.window.Event('blur'));await tick();await f.settle();assert.equal(f.plugin.data.stories[0].title,'Blur title');
});
test('IME Enter does not submit, inputs isolate click/drag, and redraw preserves draft',async()=>{
 await edit('task','中文输入');
 input().dispatchEvent(new f.window.KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true,cancelable:true}));
 assert.equal(f.plugin.activeEditors,1);assert.notEqual(f.plugin.data.tasks[0].title,'中文输入');
 const box=input().closest('.story-map-task');assert.equal(box.draggable,false);
 input().click();assert.equal(f.view.contentEl.querySelector('.story-map-inspector'),null);
 const drag=new f.window.Event('dragstart',{bubbles:true,cancelable:true});input().dispatchEvent(drag);assert.equal(drag.defaultPrevented,true);
 f.view.render();assert.equal(input().value,'中文输入');assert.equal(f.plugin.activeEditors,1);
 enter();await tick();await f.settle();assert.equal(f.plugin.data.tasks[0].title,'中文输入');assert.equal(f.target('.story-map-task[data-task-id]').draggable,true);
});
test('write failure retains draft and rolls back title/history, then retry saves once',async()=>{
 const write=f.plugin.app.vault.adapter.write;const n=f.plugin.history.length;const old=f.plugin.data.stories[0].title;
 f.plugin.app.vault.adapter.write=async()=>{throw Error('disk full')};
 await edit('story','Retry title');enter();await tick();await f.settle();await tick();
 assert.equal(f.plugin.data.stories[0].title,old);assert.equal(f.plugin.history.length,n);assert.equal(input().value,'Retry title');assert.equal(f.plugin.activeEditors,1);assert.equal(input().disabled,false);
 f.plugin.app.vault.adapter.write=write;enter();await tick();await f.settle();assert.equal(f.plugin.data.stories[0].title,'Retry title');assert.equal(f.plugin.history.length,n+1);assert.equal(f.plugin.activeEditors,0);
});
test('closing/resetting the map clears active editor state without saving a draft',async()=>{
 await edit('activity','Unsaved');f.view.resetMapState();assert.equal(f.plugin.activeEditors,0);assert.notEqual(f.plugin.data.activities[0].title,'Unsaved');
 f.view.render();await edit('task','Also unsaved');await f.view.onClose();assert.equal(f.plugin.activeEditors,0);assert.notEqual(f.plugin.data.tasks[0].title,'Also unsaved');
});

test('switching rename targets leaves exactly one editor and re-enables the old drag source',async()=>{
 await edit('task','Draft');
 // Context-menu activation need not cause a browser blur first.
 f.view.beginRename('activity','a');
 assert.equal(f.view.contentEl.querySelectorAll('.story-map-inline-input').length,1);
 assert.equal(input().value,'Activity');assert.equal(f.plugin.activeEditors,1);
 assert.equal(f.target('.story-map-task[data-task-id]').draggable,true);
});
test('Story context-menu Rename opens the same protected inline editor',()=>{
 const e=new f.window.MouseEvent('contextmenu',{bubbles:true,cancelable:true});f.target('.story-map-card').dispatchEvent(e);
 const menu=f.menus.at(-1);const rename=menu.items.find(i=>i.title==='Rename');assert.ok(rename);rename.run();
 assert.equal(input().value,'Story');assert.equal(f.target('.story-map-card').draggable,false);
});
test('renamed Story updates search data and the already selected inspector',async()=>{
 f.view.selectedId='s';f.view.inspectorOpen=true;f.view.render();
 await edit('story','New searchable title');enter();await tick();await f.settle();
 assert.equal(f.target('.story-map-inspector-title').value,'New searchable title');
 assert.match(f.target('.story-map-card').dataset.search,/new searchable title/);
 const search=f.target('input[type="search"]');search.value='New searchable';search.dispatchEvent(new f.window.Event('input'));
 assert.equal(f.target('.story-map-card').classList.contains('is-search-hidden'),false);
});
test('external-change protection keeps the inline draft without writing a conflicted map',async()=>{
 await edit('story','Protected draft');f.plugin.conflicted=true;const n=f.plugin.history.length;
 enter();await tick();assert.equal(f.plugin.data.stories[0].title,'Story');assert.equal(input().value,'Protected draft');assert.equal(f.plugin.history.length,n);
});

test('single title click starts editing without replacing the canvas, and has no pencil',()=>{
 const canvas=f.target('.story-map-canvas');const card=f.target('.story-map-card');
 title('story').click();assert.equal(input().value,'Story');assert.equal(f.target('.story-map-canvas'),canvas);assert.equal(f.target('.story-map-card'),card);
 assert.equal(f.view.contentEl.querySelector('.story-map-rename-button'),null);
 input().dispatchEvent(new f.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(f.target('.story-map-canvas'),canvas);
 assert.equal(f.target('.story-map-card').draggable,true);
});

test('pointer title edit places the caret at the clicked text offset',()=>{
 const node=title('story').firstChild;f.document.caretPositionFromPoint=()=>({offsetNode:node,offset:2});
 title('story').dispatchEvent(new f.window.MouseEvent('click',{bubbles:true,detail:1,clientX:10,clientY:10}));
 assert.equal(input().selectionStart,2);assert.equal(input().selectionEnd,2);
});
test('Enter on a focused Story title edits it without opening its inspector',()=>{
 title('story').dispatchEvent(new f.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
 assert.equal(input().value,'Story');assert.equal(f.view.contentEl.querySelector('.story-map-inspector'),null);
});

test('all three titles support multiline drafts, Shift+Enter, save and undo/redo',async()=>{
 for(const [kind,key] of [['activity','activities'],['task','tasks'],['story','stories']]){
  const old=f.plugin.data[key][0].title;
  await edit(kind,'第一行很长的标题 '+ '自动换行内容'.repeat(15)+'\n第二行');
  assert.equal(input().tagName,'TEXTAREA');assert.equal(input().rows,1);
  const shift=new f.window.KeyboardEvent('keydown',{key:'Enter',shiftKey:true,bubbles:true,cancelable:true});
  input().dispatchEvent(shift);assert.equal(shift.defaultPrevented,false);assert.equal(f.plugin.data[key][0].title,old);
  const value=input().value;f.view.render();assert.equal(input().value,value);
  enter();await tick();await f.settle();
  assert.equal(title(kind).textContent,value);assert.equal(JSON.parse(f.files.get('.story-map.json'))[key][0].title,value);
  f.plugin.undo();await f.settle();assert.equal(f.plugin.data[key][0].title,old);
  f.plugin.redo();await f.settle();assert.equal(f.plugin.data[key][0].title,value);
 }
});
test('multiline textarea grows and shrinks on input and removes its sizing listener on cancel',async()=>{
 title('story').click();const el=input();let height=90;
 Object.defineProperty(el,'clientWidth',{get:()=>150});Object.defineProperty(el,'scrollHeight',{get:()=>height});
 el.dispatchEvent(new f.window.Event('input'));assert.match(el.style.getPropertyValue('--story-description-height'),/^9[0-9]px$/);
 height=24;el.dispatchEvent(new f.window.Event('input'));assert.match(el.style.getPropertyValue('--story-description-height'),/^2[0-9]px$/);
 f.view.cancelRename();height=120;el.dispatchEvent(new f.window.Event('input'));assert.match(el.style.getPropertyValue('--story-description-height'),/^2[0-9]px$/);
});

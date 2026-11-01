const {test,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const {createMapView}=require('./helpers/map-view.cjs');
let f;
beforeEach(async()=>{f=await createMapView()});
afterEach(()=>f?.close());
const tick=()=>new Promise(r=>setTimeout(r,0));
const story=()=>f.plugin.data.stories[0];
function inspectStory(){f.view.selectedId='s';f.view.inspectorOpen=true;f.view.render();return f.target('.story-map-inspector .story-map-note-selector');}
function editStory(){
 f.target('.story-map-card').dispatchEvent(new f.window.MouseEvent('contextmenu',{bubbles:true,cancelable:true}));
 f.menus.at(-1).items.find(item=>item.title==='Edit').run();
 return f.modals.at(-1).contentEl;
}
const buttons=row=>[...row.querySelectorAll('button')].map(b=>b.textContent);
const click=(row,text)=>[...row.querySelectorAll('button')].find(b=>b.textContent===text).click();
async function settled(){await tick();await tick();await f.settle();}

test('an existing linked note offers Open note and Unlink',()=>{
 f.notes.set('Original.md',new f.TFile());
 const row=inspectStory();
 assert.deepEqual(buttons(row),['Original','Open note','Unlink']);
 assert.equal(row.querySelector('.is-missing'),null);
});

test('a deleted linked note shows as missing, offers Create note and recreates it at the stored path',async()=>{
 const row=inspectStory();
 assert.deepEqual(buttons(row),['Original','Create note','Unlink']);
 assert.ok(row.querySelector('button.is-missing'));
 click(row,'Create note');await settled();
 assert.match(f.notes.get('Original.md').content,/^---\nstatus: planned/);
 assert.deepEqual(f.opened,['Original.md']);
 assert.equal(story().notePath,'Original.md');
 assert.deepEqual(buttons(f.target('.story-map-inspector .story-map-note-selector')),['Original','Open note','Unlink']);
});

test('a story without a note offers Create note at the default path and links it',async()=>{
 story().notePath=undefined;
 const row=inspectStory();
 assert.deepEqual(buttons(row),['Search notes','Create note']);
 click(row,'Create note');await settled();
 assert.ok(f.notes.has('Stories/Story.md'));
 assert.equal(story().notePath,'Stories/Story.md');
 assert.equal(JSON.parse(f.files.get('.story-map.json')).stories[0].notePath,'Stories/Story.md');
});

test('the story modal shows the same missing state and creates from the unsaved form without saving the story',async()=>{
 story().notePath=undefined;f.view.render();
 const modal=editStory();
 modal.querySelector('.story-map-edit-title input').value='Draft title';
 const row=modal.querySelector('.story-map-note-selector');
 assert.deepEqual(buttons(row),['Search notes','Create note']);
 click(row,'Create note');await settled();
 assert.match(f.notes.get('Stories/Draft title.md').content,/# Draft title/);
 assert.deepEqual(buttons(row),['Draft title','Open note','Unlink']);
 assert.equal(story().notePath,undefined,'the link waits for Save');
 assert.equal(story().title,'Story');
 click(modal,'Save');await settled();
 assert.equal(story().notePath,'Stories/Draft title.md');
 assert.equal(story().title,'Draft title');
});

test('Open linked note from the card menu recreates a deleted note and keeps the link',async()=>{
 f.target('.story-map-card').dispatchEvent(new f.window.MouseEvent('contextmenu',{bubbles:true,cancelable:true}));
 f.menus.at(-1).items.find(item=>item.title==='Open linked note').run();await settled();
 assert.ok(f.notes.has('Original.md'));
 assert.deepEqual(f.opened,['Original.md']);
 assert.equal(story().notePath,'Original.md');
});

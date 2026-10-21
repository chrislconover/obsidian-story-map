const assert=require('node:assert/strict');
const fs=require('fs'); const vm=require('vm'); const {JSDOM}=require('jsdom');
async function createMapView() {
const dom=new JSDOM('<!doctype html><body></body>',{pretendToBeVisual:true});
const {window}=dom; const {document}=window;
const proto=window.HTMLElement.prototype;
proto.empty=function(){this.replaceChildren()};
proto.addClass=function(...c){this.classList.add(...c)};
proto.removeClass=function(...c){this.classList.remove(...c)};
proto.toggleClass=function(c,b){this.classList.toggle(c,b)};
proto.setCssProps=function(p){for(const [k,v]of Object.entries(p))this.style.setProperty(k,v)};
proto.createEl=function(tag,opts={}){if(typeof opts==='string')opts={cls:opts};const e=document.createElement(tag);if(opts.text)e.textContent=opts.text;if(opts.cls)e.className=opts.cls;for(const k of ['value','type','placeholder'])if(opts[k]!==undefined)e[k]=opts[k];for(const[k,v]of Object.entries(opts.attr||{}))e.setAttribute(k,v);this.append(e);return e};
proto.createDiv=function(o){return this.createEl('div',o)};proto.createSpan=function(o){return this.createEl('span',o)};proto.scrollIntoView=function(){};
let factory; const files=new Map(); const baseline={version:1,title:'Rename test',zoom:1,activities:[{id:'a',title:'Activity'}],tasks:[{id:'t',title:'Task',activityId:'a'}],releases:[{id:'r',title:'MVP',subtitle:''}],roles:[],stories:[{id:'s',title:'Story',activityId:'a',taskId:'t',releaseId:'r',description:'',status:'planned',priority:'medium',estimate:1,tags:[],color:'blue',notePath:'Original.md'}]};
class FileView{constructor(){this.containerEl=document.createElement('div');this.containerEl.createDiv();this.contentEl=this.containerEl.createDiv();document.body.append(this.containerEl)}}
class Modal{constructor(){this.contentEl=document.createElement('div')}open(){this.onOpen?.()}close(){}}
class Plugin{constructor(app){this.app=app}async loadData(){return {language:'en'}}async saveData(){}addSettingTab(){}registerView(t,f){factory=f}registerExtensions(){}registerEvent(){}addRibbonIcon(){}addCommand(){}}
const menus=[];
class Menu { constructor(){this.items=[];menus.push(this)} setUseNativeMenu(){return this} addSeparator(){return this} showAtMouseEvent(){} addItem(build){const item={setTitle(v){this.title=v;return this},setIcon(){return this},setDisabled(){return this},onClick(fn){this.run=fn;return this}};build(item);this.items.push(item);return this} }
const obsidian={FileView,Plugin,Modal,FuzzySuggestModal:class{},PluginSettingTab:class{},TFile:class{},TFolder:class{},Menu,Notice:class{},Setting:class{},getLanguage:()=> 'en',normalizePath:p=>p,setIcon:(e,n)=>e.textContent=n};
let view;
const app={vault:{adapter:{exists:async p=>files.has(p),read:async p=>files.get(p),write:async(p,v)=>files.set(p,v)},on:()=>({})},workspace:{on:()=>({}),getLeavesOfType:()=>view?[{view}]:[]}};
const context={module:{exports:{}},exports:{},ResizeObserver:class{observe(){}disconnect(){}unobserve(){}},navigator:window.navigator,window,document,console,setTimeout,clearTimeout,TextEncoder,Uint8Array,ArrayBuffer,HTMLElement:window.HTMLElement,createEl:tag=>document.createElement(tag),require:id=>id==='obsidian'?obsidian:require(id)};
vm.runInNewContext(fs.readFileSync(require.resolve('../../main.js'),'utf8'),context);
const PluginClass=context.module.exports.default; const plugin=new PluginClass(app);
function target(q){const el=view.contentEl.querySelector(q);assert.ok(el,'missing '+q);return el}
async function settle(){await plugin.saveQueue}
async function reset(){plugin.data=JSON.parse(JSON.stringify(baseline));await plugin.commit(false);plugin.history=[];plugin.future=[]}

await plugin.onload();view=factory({});await reset();view.render();
return {plugin,view,window,document,files,menus,target,settle,close:()=>dom.window.close()};
}
module.exports={createMapView};

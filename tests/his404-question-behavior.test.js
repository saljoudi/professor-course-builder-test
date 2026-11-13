import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { renderCourseHtml } from '../courses/P9CKVS4L/runtime/renderer.js';

const folder=new URL('../courses/P9CKVS4L/',import.meta.url);
const read=(path)=>JSON.parse(fs.readFileSync(new URL(path,folder),'utf8'));
const manifest=read('course.json');
const weeks=manifest.weekOrder.map(id=>read('weeks/'+id+'.json'));
const ontology=read('ontology/course_ontology.json');
const html=renderCourseHtml({schemaVersion:manifest.schemaVersion,metadata:manifest.metadata,privacy:manifest.privacy,ontology,weeks});
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
function fakeClassList(){const values=new Set();return {add(...names){for(const n of names){if(!n)throw new Error('Empty CSS class is invalid');values.add(n)}},remove(...names){for(const n of names)values.delete(n)},contains(n){return values.has(n)},toJSON(){return [...values]}}}
function fakeElement(props={}){
 const handlers={};
 return {dataset:{...props.dataset},style:{},classList:fakeClassList(),hidden:false,attrs:{},children:[],
   setAttribute(k,v){this.attrs[k]=v},addEventListener(type,fn){(handlers[type]??=[]).push(fn)},
   fire(type){for(const fn of handlers[type]||[])fn()},
   appendChild(item){this.children.push(item)},insertAdjacentElement(position,item){this.children.push(item)},
   closest(selector){return selector==='.activity'?props.activity:null}
 };
}
function block(start,end){
 const i=script.indexOf(start),j=script.indexOf(end,i+start.length);
 assert.ok(i>0,'Expected runtime handler: '+start);
 assert.ok(j>i,'Expected next handler: '+end);
 return script.slice(i,j);
}

test('course retains the correct eight weeks without week 7',()=>{
 assert.deepEqual(manifest.weekOrder,['week-01','week-02','week-03','week-04','week-05','week-06','week-08','week-09']);
 assert.equal(manifest.metadata.styleId,'notebook');
 assert.equal(weeks.length,8);
});

test('every knowledge check has four unique options, a valid answer and explanation',()=>{
 let questions=0;
 for(const week of weeks){
   for(const [index,q] of week.quiz.entries()){
     questions++;
     assert.ok(q.question?.trim(),week.id+' question '+index+' lacks text');
     assert.equal(q.options?.length,4,week.id+' question '+index+' answer count');
     assert.equal(new Set(q.options).size,4,week.id+' question '+index+' duplicated answer options');
     assert.ok(Number.isInteger(q.answerIndex)&&q.answerIndex>=0&&q.answerIndex<4,week.id+' question '+index+' invalid answer index');
     assert.ok(q.rationale?.trim(),week.id+' question '+index+' missing explanation');
   }
 }
 assert.equal(questions,84);
});

test('all practice activities have resolvable answers and all flashcards have backs',()=>{
 let activityCount=0,flashCount=0;
 for(const week of weeks){
   for(const [index,a] of week.activities.entries()){
     activityCount++;
     const location=week.id+' activity '+index;
     assert.ok(a.title&&a.prompt,location+' lacks title or prompt');
     if(a.type==='classification'){assert.ok(a.items?.length,location);assert.ok(a.items.every(item=>a.categories.includes(item.answer)),location+' invalid category')}
     if(a.type==='matching'){assert.ok(a.pairs?.length,location);assert.ok(a.pairs.every(pair=>a.choices.includes(pair.right)),location+' unmatched pair')}
     if(a.type==='ordering'){assert.ok(a.items?.length,location);assert.deepEqual(a.items.map(item=>item.order),a.items.map((_,i)=>i),location+' nonsequential order')}
     if(a.type==='scenario'||a.type==='choice'){assert.equal(a.options?.length,4,location);assert.ok(Number.isInteger(a.answerIndex)&&a.answerIndex>=0&&a.answerIndex<4,location)}
     if(a.type==='retrieval'||a.type==='comparison') assert.ok(a.answer,location+' missing guidance');
   }
   for(const f of week.flashcards){flashCount++;assert.ok(f.front&&f.back,week.id+' incomplete flashcard')}
 }
 assert.equal(activityCount,68);assert.equal(flashCount,89);
});

test('generated course and entire embedded runtime compile without errors',()=>{
 assert.match(html,/<!doctype html>/);
 assert.ok(script);
 assert.doesNotThrow(()=>new vm.Script(script));
 assert.ok(!script.includes("classList.add(i===ans?'correct':(x===btn?'wrong':''))"));
 assert.ok(!script.includes("classList.add(i===answer?'correct':(i===chosen?'wrong':''))"));
});

test('knowledge check handles incorrect selection, feedback and retry without throwing',()=>{
 const buttons=Array.from({length:4},(_,i)=>fakeElement({dataset:{option:String(i)}}));
 const feedback={classList:fakeClassList(),attrs:{},setAttribute(k,v){this.attrs[k]=v}};
 const box=fakeElement({dataset:{answer:'2'}});
 const selector={
   '.quiz-q':[box],'.option':buttons,'.feedback':feedback
 };
 const newButtons=[];
 const document={createElement(){const b=fakeElement();newButtons.push(b);return b}};
 const qsa=(s,r)=>selector[s]||[];
 const qs=(s,r)=>s==='.feedback'?feedback:null;
 vm.runInNewContext(block("qsa('.quiz-q').forEach(box=>{","\nqsa('[data-check-classification]'"),{qsa,qs,document});
 buttons[0].fire('click');
 assert.equal(box.dataset.selected,'0');
 assert.ok(buttons[0].classList.contains('wrong'));
 assert.ok(buttons[2].classList.contains('correct'));
 assert.ok(feedback.classList.contains('show'));
 assert.equal(newButtons[0].hidden,false);
 newButtons[0].fire('click');
 assert.equal(box.dataset.selected,undefined);
 assert.ok(!feedback.classList.contains('show'));
 buttons[2].fire('click');
 assert.equal(box.dataset.selected,'2');
 assert.ok(buttons[2].classList.contains('correct'));
 assert.ok(!buttons[2].classList.contains('wrong'));
});

test('scenario decision handles incorrect choice, feedback and retry',()=>{
 const activity=fakeElement({dataset:{feedback:'Review the decision in context.'}});
 const buttons=Array.from({length:4},(_,i)=>fakeElement({dataset:{choiceIndex:String(i)}}));
 const feedback={classList:fakeClassList(),textContent:''};
 const list=fakeElement({dataset:{answer:'1'},activity});
 const qsa=(s,r)=>s==='[data-choice-list]'?[list]:s==='.activity-choice'?buttons:[];
 const qs=(s,r)=>s==='.activity-feedback'?feedback:null;
 const document={createElement(){return fakeElement()}};
 const showFeedback=(a,message,good)=>{feedback.textContent=message;feedback.good=good;feedback.classList.add('show')};
 vm.runInNewContext(block("qsa('[data-choice-list]').forEach(list=>{","\nqsa('[data-reveal-activity]'"),{qsa,qs,document,showFeedback});
 buttons[0].fire('click');
 assert.equal(list.dataset.selected,'0');
 assert.ok(buttons[0].classList.contains('wrong'));
 assert.ok(buttons[1].classList.contains('correct'));
 assert.equal(feedback.good,false);
 const retry=list.children[0];
 assert.equal(retry.hidden,false);
 retry.fire('click');
 assert.equal(list.dataset.selected,undefined);
 assert.equal(feedback.textContent,'');
 buttons[1].fire('click');
 assert.equal(list.dataset.selected,'1');
 assert.equal(feedback.good,true);
});

test('printed ordering result distinguishes an untouched activity from an attempted answer',()=>{
 assert.ok(script.includes("answered=list?.dataset.attempted==='1'"));
 assert.ok(script.includes("list.dataset.attempted='1'"));
 assert.ok(script.includes("delete list.dataset.attempted"));
});

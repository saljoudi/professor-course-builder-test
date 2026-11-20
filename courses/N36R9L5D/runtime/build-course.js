import fs from 'node:fs/promises';
import path from 'node:path';
import {renderCourseHtml} from './renderer.js';
const id='N36R9L5D',root=path.resolve('courses',id),manifest=JSON.parse(await fs.readFile(path.resolve('courses',id,'course.json'),'utf8')),out=path.resolve('dist');
await fs.rm(out,{recursive:true,force:true});await fs.mkdir(path.join(out,'ar'),{recursive:true});
for(const lang of ['en','ar']){
 const weeks=await Promise.all(manifest.weekOrder.map(async name=>JSON.parse(await fs.readFile(path.join(root,'weeks',lang,name+'.json'),'utf8'))));
 for(const week of weeks)if(!Array.isArray(week.quiz)||week.quiz.some(q=>!Array.isArray(q.options)||q.options.length!==4||!Number.isInteger(q.answerIndex)||q.answerIndex<0||q.answerIndex>3))throw Error('Invalid quiz '+lang+'/'+week.id);
 const meta={...manifest.metadata,...(lang==='ar'?{title:manifest.metadata.titleArabic,intro:manifest.metadata.introArabic,contentLabel:'الأسبوع'}:{})};
 let html=renderCourseHtml({schemaVersion:'2.0',metadata:meta,privacy:manifest.privacy,ontology:{concepts:[],relations:[]},weeks});
 const target=lang==='ar'?'/':'/ar/',label=lang==='ar'?'English':'العربية';
 const switcher='<a href="'+target+'" class="language-switch" lang="'+(lang==='ar'?'en':'ar')+'" aria-label="Switch course language">'+label+'</a>';
 const css='<style>.language-switch{position:fixed;bottom:18px;right:18px;z-index:10000;border-radius:999px;padding:11px 18px;color:#fff;background:#244477;text-decoration:none;font:700 15px system-ui,sans-serif;box-shadow:0 5px 18px #0003}.language-switch:hover{background:#152e58}'+(lang==='ar'?'html{direction:rtl}body{direction:rtl;font-family:Tahoma,"Segoe UI",system-ui,sans-serif}.topbar .top-inner,.shell,.sidebar,.card,.hero{text-align:right}.language-switch{right:auto;left:18px}.option{text-align:right}':'')+'</style>';
 html=html.replace('<html lang="en">','<html lang="'+lang+'" dir="'+(lang==='ar'?'rtl':'ltr')+'">').replace('</head>',css+'</head>').replace('</body>',switcher+'</body>');
 await fs.writeFile(path.join(out,lang==='ar'?'ar/index.html':'index.html'),html);
 console.log(lang+': '+weeks.length+' weeks; '+weeks.reduce((a,w)=>a+w.quiz.length,0)+' questions; '+weeks.reduce((a,w)=>a+(w.activities?.length||0),0)+' activities');
}

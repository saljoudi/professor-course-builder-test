import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCourseHtml } from '../packages/course-renderer/renderer.js';

const course={metadata:{publicId:'TEST1234',title:'Test Course',courseCode:'T101',term:'Fall',styleId:'modern'},syllabus:{summary:'Summary',outcomes:['Outcome']},weeks:[{id:'week-1',order:1,title:'Week 1',overview:'Overview',objectives:['Learn'],concepts:[{id:'c1',name:'Concept',definition:'Definition'}],sections:[],activities:[],quiz:[]}],ontology:{relations:[]},review:{title:'Review',instructions:'Review it.',prompts:[]}};

test('renderer creates a complete document with selected theme',()=>{const html=renderCourseHtml(course);assert.match(html,/<!doctype html>/);assert.match(html,/theme-modern/);assert.match(html,/Test Course/);assert.match(html,/TEST1234/);});

import {collectUnstop,collectInternshala} from './lib/jobs.ts';
import {writeFile} from 'node:fs/promises';
const results=await Promise.all([collectUnstop(),collectInternshala()]);
const jobs=results.flat();
const sources=results.map((r,i)=>({name:i?'Internshala':'Unstop',status:'ok',collected:r.length,url:i?'https://internshala.com/internships/':'https://unstop.com/internships'}));
await writeFile(process.argv[2]||'collected.json',JSON.stringify({jobs,sources}));
console.log(JSON.stringify({collected:jobs.length,sources}));

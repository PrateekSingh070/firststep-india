import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const updaterToken='test-updater-only';
const updaterHash=createHash('sha256').update(updaterToken).digest('hex');
import {api} from '../lib/jobs.ts';
import archivedSeed from '../data/seed.json' with {type:'json'};
// Historical source deadlines must not make active test fixtures expire over time.
// The expiration test below supplies its own deliberately expired listing.
const seed={...archivedSeed,jobs:archivedSeed.jobs.map(job=>({...job,deadline:new Date(Date.now()+30*86400000).toISOString()}))};
class Bucket{items=new Map();etags=new Map();revision=0;async get(k){const s=this.items.get(k);return s?{etag:this.etags.get(k),json:async()=>JSON.parse(s)}:null;}async put(k,v,options={}){if(options.onlyIf?.etagMatches&&options.onlyIf.etagMatches!==this.etags.get(k))return null;if(options.onlyIf?.etagDoesNotMatch==='*'&&this.items.has(k))return null;this.items.set(k,v);const etag=String(++this.revision);this.etags.set(k,etag);return {etag};}}
const sources=[{name:'Unstop',status:'ok'},{name:'Internshala',status:'ok'}];
const post=(path,body,env,headers={})=>api(new Request('https://test.site/api/'+path,{method:'POST',headers:{'Content-Type':'application/json','X-FirstStep-Update-Token':updaterToken,...headers},body:JSON.stringify(body)}),env);
test('missing annotations and incomplete sources do not replace last good data',async()=>{
const env={BUCKET:new Bucket(),UPDATE_TOKEN_SHA256:updaterHash};
assert.equal((await post('stage',{jobs:seed.jobs,sources:[sources[0]]},env)).status,400);
const candidate={...seed.jobs[0],id:'new-one',title:'Changed title'};
const run=await (await post('stage',{jobs:[candidate],sources},env)).json();
const r=await post('publish',{runId:run.runId},env);assert.equal(r.status,422);
assert.equal(env.BUCKET.items.has('latest.json'),false);
assert.equal((await post('tag',{runId:run.runId,tags:[{id:'new-one',role:'Invented category',cities:['Pune']}]},env)).status,400);
assert.equal((await post('tag',{runId:run.runId,tags:[{id:'new-one',role:'Operations',cities:['Pune']}]},env)).status,200);
assert.equal((await post('publish',{runId:run.runId},env)).status,422);
assert.equal(env.BUCKET.items.has('latest.json'),false);
});
test('deduplication, expiration, durable publish, idempotency, stale-run rejection',async()=>{
const env={BUCKET:new Bucket(),UPDATE_TOKEN_SHA256:updaterHash};
const expired={...seed.jobs[1],id:'expired',deadline:'2020-01-01T00:00:00Z'};
const duplicate={...seed.jobs[0],id:'duplicate'};
const run1=await (await post('stage',{jobs:[...seed.jobs,duplicate,expired],sources},env)).json();
const run2=await (await post('stage',{jobs:seed.jobs,sources},env)).json();
const result=await (await post('publish',{runId:run1.runId},env)).json();
assert.equal(result.published,true);assert.equal(result.count,seed.jobs.length);
assert.equal(JSON.parse(env.BUCKET.items.get('latest.json')).runId,run1.runId);
assert.equal((await (await post('publish',{runId:run1.runId},env)).json()).idempotent,true);
assert.equal((await post('publish',{runId:run2.runId},env)).status,409);
assert.equal((await post('stage',{jobs:seed.jobs,sources},env,{Origin:'https://attacker.test'})).status,403);
assert.equal((await (await api(new Request('https://test.site/api/health'),env)).json()).count,seed.jobs.length);
});

test('public reads stay available while every maintenance route requires the updater credential',async()=>{
const env={BUCKET:new Bucket(),UPDATE_TOKEN_SHA256:updaterHash};
for(const route of ['collect','stage','tag','publish'])assert.equal((await post(route,{},env,{'X-FirstStep-Update-Token':''})).status,401);
assert.equal((await api(new Request('https://test.site/api/candidates?runId=test'),env)).status,401);
assert.equal((await post('stage',{},env,{'X-FirstStep-Update-Token':'wrong'})).status,401);
assert.equal((await api(new Request('https://test.site/api/jobs'),env)).status,200);
assert.equal((await api(new Request('https://test.site/api/health'),env)).status,200);
assert.equal((await api(new Request('https://test.site/api/maintenance'),env)).status,200);
assert.equal((await post('stage',{}, {BUCKET:new Bucket()})).status,401);
});

test('simultaneous publishers cannot overwrite a newer snapshot',async()=>{
const env={BUCKET:new Bucket(),UPDATE_TOKEN_SHA256:updaterHash};
const a=await(await post('stage',{jobs:seed.jobs,sources},env)).json();
const b=await(await post('stage',{jobs:seed.jobs,sources},env)).json();
const results=await Promise.all([post('publish',{runId:a.runId},env),post('publish',{runId:b.runId},env)]);
assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
});

'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {start}=require('../src/server');

test('HTTP smoke: public health, scenario API, role rejection and reset',async()=>{
  const server=start(0);
  await new Promise(resolve=>server.once('listening',resolve));
  try{
    const url=`http://127.0.0.1:${server.address().port}`;
    const health=await (await fetch(`${url}/api/health`)).json();
    assert.equal(health.ok,true);
    assert.equal(health.mode,'LOCAL_SYNTHETIC_DEMO');
    const noAuth=await fetch(`${url}/api/demo/run`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenario:'allow'})});
    assert.equal(noAuth.status,403);
    const runRes=await fetch(`${url}/api/demo/run`,{method:'POST',headers:{'Content-Type':'application/json','x-demo-actor':'demo-operator'},body:JSON.stringify({scenario:'revoke'})});
    assert.equal(runRes.status,200);
    const run=await runRes.json();
    assert.equal(run.accessAfter.reasonCode,'DENIED_GRANT_REVOKED');
    assert.equal(run.state.receiptChainValid,true);
    const state=await(await fetch(`${url}/api/state`)).json();
    assert.equal(state.counts.participants,24);
    const html=await(await fetch(`${url}/`)).text();
    assert.ok(html.includes('Data access should be'));
    const resetRes=await fetch(`${url}/api/demo/reset`,{method:'POST',headers:{'x-demo-actor':'demo-operator'}});
    const reset=await resetRes.json();
    assert.equal(reset.state.receipts.length,0);
  } finally{await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));}
});


test('server binds to loopback and sends restrictive browser headers',async()=>{
  const server=start(0);
  await new Promise(resolve=>server.once('listening',resolve));
  try {
    assert.equal(server.address().address,'127.0.0.1');
    const res=await fetch(`http://127.0.0.1:${server.address().port}/`);
    assert.equal(res.headers.get('x-content-type-options'),'nosniff');
    assert.ok(res.headers.get('content-security-policy').includes("default-src 'self'"));
    assert.equal(res.headers.get('cache-control'),'no-store');
  } finally {await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));}
});

test('static server never exposes repository files through HTTP',async()=>{
  const server=start(0);
  await new Promise(resolve=>server.once('listening',resolve));
  try {
    const base=`http://127.0.0.1:${server.address().port}`;
    for (const file of ['/src/engine.js','/README.md','/.github/workflows/ci.yml','/package.json']) {
      const res=await fetch(base+file);
      assert.equal(res.status,404,file);
    }
  } finally {await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));}
});

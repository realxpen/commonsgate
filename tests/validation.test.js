'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {start} = require('../src/server');

async function withServer(check) {
  const server = start(0);
  await new Promise(resolve => server.once('listening', resolve));
  try { await check('http://127.0.0.1:' + server.address().port); }
  finally { await new Promise((resolve,reject) => server.close(error => error ? reject(error) : resolve())); }
}

test('governance review assets are local-only and served with restrictive headers', async () => {
  await withServer(async base => {
    const expected = [
      ['/review.html','text/html','Can people understand and challenge'],
      ['/review.js','application/javascript','commonsgate.review.v1'],
      ['/review.css','text/css','fieldset']
    ];
    for(const [path,type,snippet] of expected) {
      const res = await fetch(base + path);
      assert.equal(res.status,200,path);
      assert.match(res.headers.get('content-type'),new RegExp(type));
      assert.equal(res.headers.get('cache-control'),'no-store');
      assert.match(res.headers.get('content-security-policy'),/script-src 'self'/);
      assert.ok((await res.text()).includes(snippet),path);
    }
  });
});

test('review kit has no submission endpoint and cannot mutate simulated access through feedback', async () => {
  await withServer(async base => {
    const before = await (await fetch(base+'/api/state')).json();
    for(const endpoint of ['/api/feedback','/api/reviews','/api/validation/submit']) {
      const res=await fetch(base+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:'{"note":"dummy"}'});
      assert.equal(res.status,404,endpoint);
    }
    const after=await (await fetch(base+'/api/state')).json();
    assert.deepEqual(after.counts,before.counts);
    assert.equal(after.receipts.length,0);
  });
});

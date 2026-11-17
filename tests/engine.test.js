'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {CommonsGate}=require('../src/engine');
function prepare(g,id='R-001'){
  g.addReview('river-reviewer-1',id,'APPROVE');
  g.addReview('river-reviewer-2',id,'APPROVE');
  g.setStewardCheck('river-steward',id,'APPROVED');
}
test('fixtures have exactly 24 fictional participants, 2 communities, 3 datasets, 4 policies and 6 requests',()=>{
  const g=new CommonsGate(),s=g.state();
  assert.deepEqual(s.counts,{participants:24,communities:2,datasets:3,policies:4,requests:6,benefitCommitments:2});
  assert.ok(g.db.participants.every(p=>p.isSynthetic));
});
test('deny by default without community quorum or steward review',()=>{
  const g=new CommonsGate(),out=g.evaluate('researcher-1','R-001');
  assert.equal(out.status,'DENIED');
  assert.ok(out.reasonCodes.includes('DENIED_COMMUNITY_QUORUM'));
  assert.ok(out.reasonCodes.includes('DENIED_STEWARD_REVIEW'));
  assert.equal(g.db.grants.length,0);
});
test('allow path produces scoped grant and only fictional aggregate',()=>{
  const g=new CommonsGate();prepare(g);
  const out=g.evaluate('researcher-1','R-001');
  assert.equal(out.status,'APPROVED');
  assert.equal(out.grantToken.length,64);
  assert.equal(g.state().grants[0].tokenHash,undefined);
  assert.equal(g.state().grants[0].grantToken,undefined);
  const res=g.access('researcher-1','R-001',out.grantToken);
  assert.equal(res.status,'ALLOWED');
  assert.equal(res.aggregate.fictionalSampleSize,8);
  assert.equal(res.aggregate.type,'FICTIONAL_AGGREGATE');
  assert.equal(g.verifyReceipts(),true);
});
test('community veto denies request despite individual and steward approval',()=>{
  const g=new CommonsGate();
  g.addReview('river-reviewer-1','R-001','APPROVE');
  g.addReview('river-reviewer-2','R-001','REJECT');
  g.setStewardCheck('river-steward','R-001','APPROVED');
  const out=g.evaluate('researcher-1','R-001');
  assert.equal(out.status,'DENIED');
  assert.ok(out.reasonCodes.includes('DENIED_COMMUNITY_VETO'));
  assert.equal(g.db.grants.length,0);
});
test('individual withdrawal revokes active grant and denies later access',()=>{
  const g=new CommonsGate();prepare(g);
  const result=g.evaluate('researcher-1','R-001');
  assert.equal(g.access('researcher-1','R-001',result.grantToken).status,'ALLOWED');
  const withdrawal=g.withdrawConsent('participant-P-001','CN-D-001-P-001');
  assert.equal(withdrawal.affectedGrantCount,1);
  const later=g.access('researcher-1','R-001',result.grantToken);
  assert.equal(later.status,'DENIED');
  assert.equal(later.reasonCode,'DENIED_GRANT_REVOKED');
  assert.equal(g.verifyReceipts(),true);
});
test('withdrawal before evaluation denies request even if all other checks pass',()=>{
  const g=new CommonsGate();prepare(g);g.withdrawConsent('participant-P-001','CN-D-001-P-001');
  const out=g.evaluate('researcher-1','R-001');
  assert.ok(out.reasonCodes.includes('DENIED_INDIVIDUAL_PERMISSION'));
  assert.equal(out.status,'DENIED');
});
test('no steward approval means no access grant',()=>{
  const g=new CommonsGate();
  g.addReview('river-reviewer-1','R-001','APPROVE');g.addReview('river-reviewer-2','R-001','APPROVE');
  assert.ok(g.evaluate('researcher-1','R-001').reasonCodes.includes('DENIED_STEWARD_REVIEW'));
});
test('token expiration is evaluated on every gateway use',()=>{
  let now=Date.UTC(2026,10,16,12,0,0);
  const g=new CommonsGate({now:()=>now});prepare(g);
  const out=g.evaluate('researcher-1','R-001');
  now+=16*60*1000;
  const res=g.access('researcher-1','R-001',out.grantToken);
  assert.equal(res.reasonCode,'DENIED_GRANT_EXPIRED');
});
test('term changes never silently carry over approval',()=>{
  const g=new CommonsGate();prepare(g);
  const out=g.evaluate('researcher-1','R-001');
  g.getRequest('R-001').commercialUse=true; // simulates an integrity check on changed underlying terms
  const result=g.access('researcher-1','R-001',out.grantToken);
  assert.equal(result.reasonCode,'DENIED_TERMS_CHANGED');
});
test('a policy change invalidates outstanding grants before later access',()=>{
  const g=new CommonsGate();prepare(g);
  const out=g.evaluate('researcher-1','R-001');
  g.changePolicy('demo-operator','D-001',[]);
  assert.equal(g.access('researcher-1','R-001',out.grantToken).reasonCode,'DENIED_GRANT_REVOKED');
});
test('wrong tokens or cross-request attempts fail',()=>{
  const g=new CommonsGate();prepare(g);
  const out=g.evaluate('researcher-1','R-001');
  assert.equal(g.access('researcher-1','R-001','wrong token').reasonCode,'DENIED_NO_VALID_GRANT');
  assert.equal(g.access('researcher-1','R-003',out.grantToken).reasonCode,'DENIED_NO_VALID_GRANT');
});
test('role escalation, cross-participant withdrawal, duplicate review are blocked',()=>{
  const g=new CommonsGate();
  assert.throws(()=>g.addReview('researcher-1','R-001','APPROVE'),{code:'DENIED_ROLE'});
  assert.throws(()=>g.addReview('hill-reviewer-1','R-001','APPROVE'),{code:'DENIED_ROLE'});
  assert.throws(()=>g.withdrawConsent('participant-P-002','CN-D-001-P-001'),{code:'DENIED_ROLE'});
  assert.throws(()=>g.evaluate('observer','R-001'),{code:'DENIED_ROLE'});
  g.addReview('river-reviewer-1','R-001','APPROVE');
  assert.throws(()=>g.addReview('river-reviewer-1','R-001','APPROVE'),{code:'DUPLICATE_REVIEW'});
});
test('community rule prohibits a requested AI-training purpose',()=>{
  const g=new CommonsGate();
  const out=g.evaluate('researcher-1','R-002');
  assert.ok(out.reasonCodes.includes('DENIED_COMMUNITY_POLICY'));
});
test('receipt chain verification detects in-memory tampering',()=>{
  const g=new CommonsGate();g.evaluate('researcher-1','R-001');
  assert.equal(g.verifyReceipts(),true);
  g.db.receipts[0].decision='ALTERED';
  assert.equal(g.verifyReceipts(),false);
});
test('public report exposes only synthetic aggregate benefit data',()=>{
  const g=new CommonsGate();
  const report=g.publicBenefits(),json=JSON.stringify(report);
  assert.equal(report.commitments.length,2);
  assert.ok(!json.includes('P-001'));
  assert.ok(!json.includes('Fictional participant'));
});
test('all three demonstration scenarios yield expected end states',()=>{
  const g=new CommonsGate();
  assert.equal(g.runScenario('demo-operator','allow').accessBefore.status,'ALLOWED');
  const deny=g.runScenario('demo-operator','deny');
  assert.ok(deny.decision.reasonCodes.includes('DENIED_COMMUNITY_VETO'));
  assert.equal(deny.accessAfter.status,'DENIED');
  const revoke=g.runScenario('demo-operator','revoke');
  assert.equal(revoke.accessBefore.status,'ALLOWED');
  assert.equal(revoke.accessAfter.reasonCode,'DENIED_GRANT_REVOKED');
  assert.equal(revoke.state.receiptChainValid,true);
});
test('simulated policy and withdrawal events cannot leave an old grant active',()=>{
  for(const what of ['withdraw','policy']){
    const g=new CommonsGate();prepare(g);
    const grant=g.evaluate('researcher-1','R-001');
    if(what==='withdraw')g.withdrawConsent('participant-P-001','CN-D-001-P-001');
    else g.changePolicy('demo-operator','D-001',[]);
    assert.equal(g.access('researcher-1','R-001',grant.grantToken).status,'DENIED');
  }
});

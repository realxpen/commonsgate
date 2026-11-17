'use strict';
const crypto = require('node:crypto');
const { makeFixtures } = require('./fixtures');

const REASONS = {
  ALLOWED: 'All required approvals and permissions are currently valid.',
  DENIED_COMMUNITY_VETO: 'An authorised community reviewer rejected the proposed use.',
  DENIED_COMMUNITY_QUORUM: 'Required community approvals have not been collected.',
  DENIED_COMMUNITY_POLICY: 'The proposed use is not permitted by the community policy.',
  DENIED_INDIVIDUAL_PERMISSION: 'One or more fictional participants do not permit this use.',
  DENIED_STEWARD_REVIEW: 'An approved and current data-steward check is required.',
  DENIED_NO_VALID_GRANT: 'No valid, scoped access grant was supplied.',
  DENIED_GRANT_REVOKED: 'This access grant was revoked and can no longer be used.',
  DENIED_GRANT_EXPIRED: 'This access grant has expired.',
  DENIED_TERMS_CHANGED: 'The requested terms no longer match the approved terms.',
  DENIED_SCOPE_MISMATCH: 'The grant or requester does not match the requested scope.',
  DENIED_ROLE: 'This demonstration actor is not permitted to perform that operation.',
};
function digest(value){ return crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex'); }
function failure(code,status=403){ const error=new Error(REASONS[code]||code);error.code=code;error.status=status;return error; }
function requestTerms(req){ return {requesterId:req.requesterId,datasetId:req.datasetId,purpose:req.purpose,commercialUse:req.commercialUse,modelTraining:req.modelTraining}; }

class CommonsGate {
  constructor({now=()=>Date.now(),randomBytes=(n)=>crypto.randomBytes(n)}={}){
    this.now=now;this.randomBytes=randomBytes;this.reset();
  }
  reset(){this.db=makeFixtures();this.sequence=0;return this.state();}
  at(){return new Date(this.now()).toISOString();}
  getRequest(id){const req=this.db.requests.find(r=>r.id===id);if(!req)throw failure('NOT_FOUND',404);return req;}
  getDataset(id){const data=this.db.datasets.find(d=>d.id===id);if(!data)throw failure('NOT_FOUND',404);return data;}
  getPolicy(datasetId){return this.db.policies.find(p=>p.datasetId===datasetId&&!p.isAlternateRule);}
  requireActor(actor,allowed){if(!allowed.includes(actor))throw failure('DENIED_ROLE');}
  receipt(requestId,decision,reasonCodes=[],meta={}){
    const prevHash=this.db.receipts.at(-1)?.hash || 'GENESIS';
    const entry={seq:++this.sequence,requestId,decision,reasonCodes,timestamp:this.at(),prevHash,meta};
    entry.hash=digest(entry);
    this.db.receipts.push(entry);
    return structuredClone(entry);
  }
  verifyReceipts(){
    let prevHash='GENESIS';
    for(const r of this.db.receipts){
      if(r.prevHash!==prevHash)return false;
      const {hash,...unhashed}=r;
      if(digest(unhashed)!==hash)return false;
      prevHash=hash;
    }
    return true;
  }
  addReview(actor,requestId,vote){
    const req=this.getRequest(requestId),data=this.getDataset(req.datasetId);
    this.requireActor(actor,this.db.reviewerIds[data.communityId]);
    if(!['APPROVE','REJECT'].includes(vote))throw failure('INVALID_VOTE',400);
    const existing=this.db.reviews.find(r=>r.requestId===requestId&&r.reviewerId===actor);
    if(existing)throw failure('DUPLICATE_REVIEW',409);
    const review={requestId,reviewerId:actor,vote,policyVersion:this.getPolicy(data.id).version,timestamp:this.at()};
    this.db.reviews.push(review);
    this.receipt(requestId,'REVIEW_RECORDED',[vote==='REJECT'?'COMMUNITY_VETO':'COMMUNITY_APPROVAL'],{reviewerId:actor});
    return structuredClone(review);
  }
  setStewardCheck(actor,requestId,ethicsStatus){
    const req=this.getRequest(requestId),data=this.getDataset(req.datasetId);
    this.requireActor(actor,[this.db.stewardIds[data.communityId]]);
    if(!['APPROVED','PENDING','REJECTED'].includes(ethicsStatus))throw failure('INVALID_ETHICS_STATUS',400);
    const entry={requestId,stewardId:actor,ethicsStatus,termsHash:digest(requestTerms(req)),expiresAt:new Date(this.now()+30*60*1000).toISOString(),timestamp:this.at()};
    this.db.stewardChecks=this.db.stewardChecks.filter(s=>s.requestId!==requestId);
    this.db.stewardChecks.push(entry);
    this.receipt(requestId,'STEWARD_CHECK_RECORDED',[`STEWARD_${ethicsStatus}`]);
    return structuredClone(entry);
  }
  checks(req){
    const data=this.getDataset(req.datasetId),policy=this.getPolicy(data.id);
    const votes=this.db.reviews.filter(r=>r.requestId===req.id&&r.policyVersion===policy.version);
    const veto=votes.some(r=>r.vote==='REJECT');
    const approvals=new Set(votes.filter(r=>r.vote==='APPROVE').map(r=>r.reviewerId));
    const policyPass=policy.allowedPurposes.includes(req.purpose)&&(!req.commercialUse||!policy.bannedUses.includes('commercial_sale'))&&(!req.modelTraining||!policy.bannedUses.includes('model_training'));
    const communityPass=!veto&&approvals.size>=policy.minApprovals;
    const affectedConsents=this.db.consents.filter(c=>c.datasetId===data.id&&c.purpose===req.purpose&&data.participantIds.includes(c.participantId));
    const permissionPass=affectedConsents.length===data.participantIds.length&&affectedConsents.every(c=>c.status==='GRANTED');
    const steward=this.db.stewardChecks.find(s=>s.requestId===req.id);
    const stewardPass=Boolean(steward&&steward.ethicsStatus==='APPROVED'&&new Date(steward.expiresAt).getTime()>this.now()&&steward.termsHash===digest(requestTerms(req)));
    const reasons=[];
    if(!policyPass)reasons.push('DENIED_COMMUNITY_POLICY');
    if(veto)reasons.push('DENIED_COMMUNITY_VETO');
    else if(!communityPass)reasons.push('DENIED_COMMUNITY_QUORUM');
    if(!permissionPass)reasons.push('DENIED_INDIVIDUAL_PERMISSION');
    if(!stewardPass)reasons.push('DENIED_STEWARD_REVIEW');
    return { policyPass,communityPass,permissionPass,stewardPass,approvalCount:approvals.size,requiredApprovals:policy.minApprovals,veto,consentCount:affectedConsents.filter(c=>c.status==='GRANTED').length,participantCount:data.participantIds.length,policyVersion:policy.version,reasons };
  }
  evaluate(actor,requestId){
    const req=this.getRequest(requestId);
    this.requireActor(actor,[req.requesterId]);
    const checks=this.checks(req);
    if(checks.reasons.length){
      req.state='DENIED';
      const receipt=this.receipt(req.id,'DENIED',checks.reasons,{policyVersion:checks.policyVersion});
      return {status:'DENIED',checks,receipt,reasonCodes:checks.reasons};
    }
    for(const grant of this.db.grants.filter(g=>g.requestId===req.id&&!g.revokedAt))grant.revokedAt=this.at();
    const token=this.randomBytes(32).toString('hex');
    const grant={id:`G-${String(this.db.grants.length+1).padStart(3,'0')}`,requestId:req.id,requesterId:actor,datasetId:req.datasetId,purpose:req.purpose,termsHash:digest(requestTerms(req)),policyVersion:checks.policyVersion,tokenHash:digest(token),issuedAt:this.at(),expiresAt:new Date(this.now()+15*60*1000).toISOString(),revokedAt:null};
    this.db.grants.push(grant);req.state='APPROVED';
    const receipt=this.receipt(req.id,'APPROVED',['ALLOWED'],{grantId:grant.id,policyVersion:grant.policyVersion,expiresAt:grant.expiresAt});
    return {status:'APPROVED',checks,grantToken:token,grantId:grant.id,expiresAt:grant.expiresAt,receipt,reasonCodes:['ALLOWED']};
  }
  access(actor,requestId,grantToken,expectedTermsHash){
    const req=this.getRequest(requestId);
    this.requireActor(actor,[req.requesterId]);
    const matching=this.db.grants.find(g=>g.requestId===req.id&&g.tokenHash===digest(grantToken||''));
    let reason=null;
    if(!matching)reason='DENIED_NO_VALID_GRANT';
    else if(matching.revokedAt)reason='DENIED_GRANT_REVOKED';
    else if(new Date(matching.expiresAt).getTime()<=this.now())reason='DENIED_GRANT_EXPIRED';
    else if(matching.requesterId!==actor||matching.datasetId!==req.datasetId||matching.purpose!==req.purpose)reason='DENIED_SCOPE_MISMATCH';
    else if(matching.termsHash!==digest(requestTerms(req))||(expectedTermsHash&&expectedTermsHash!==matching.termsHash))reason='DENIED_TERMS_CHANGED';
    else if(matching.policyVersion!==this.getPolicy(req.datasetId).version)reason='DENIED_COMMUNITY_POLICY';
    else reason=this.checks(req).reasons[0]||null;
    if(reason){
      const receipt=this.receipt(req.id,'ACCESS_DENIED',[reason]);
      return {status:'DENIED',reasonCode:reason,explanation:REASONS[reason],receipt};
    }
    const data=this.getDataset(req.datasetId);
    const receipt=this.receipt(req.id,'ACCESS_ALLOWED',['ALLOWED'],{grantId:matching.id});
    return {status:'ALLOWED',receipt,aggregate:{type:'FICTIONAL_AGGREGATE',datasetId:data.id,fictionalSampleSize:data.participantIds.length,illustrativeCategories:{categoryA:3,categoryB:5},note:'Generated simulation totals only. Not patient records or real research results.'}};
  }
  withdrawConsent(actor,consentId){
    const c=this.db.consents.find(c=>c.id===consentId);
    if(!c)throw failure('NOT_FOUND',404);
    this.requireActor(actor,[`participant-${c.participantId}`]);
    if(c.status==='WITHDRAWN')throw failure('ALREADY_WITHDRAWN',409);
    c.status='WITHDRAWN';c.version+=1;c.updatedAt=this.at();
    const affected=this.db.grants.filter(g=>g.datasetId===c.datasetId&&g.purpose===c.purpose&&!g.revokedAt);
    for(const g of affected){g.revokedAt=this.at();this.receipt(g.requestId,'GRANT_REVOKED',['DENIED_INDIVIDUAL_PERMISSION'],{grantId:g.id,consentId:c.id});}
    this.receipt(null,'CONSENT_WITHDRAWN',['INDIVIDUAL_WITHDRAWAL'],{consentId:c.id,affectedGrantCount:affected.length});
    return {status:'WITHDRAWN',consentId:c.id,affectedGrantCount:affected.length};
  }
  changePolicy(actor,datasetId,allowedPurposes){
    this.requireActor(actor,['demo-operator']);
    if(!Array.isArray(allowedPurposes))throw failure('INVALID_POLICY',400);
    const policy=this.getPolicy(datasetId);
    if(!policy)throw failure('NOT_FOUND',404);
    policy.allowedPurposes=[...allowedPurposes];policy.version+=1;
    for(const g of this.db.grants.filter(g=>g.datasetId===datasetId&&!g.revokedAt)){
      g.revokedAt=this.at();this.receipt(g.requestId,'GRANT_REVOKED',['DENIED_COMMUNITY_POLICY'],{policyVersion:policy.version});
    }
    this.receipt(null,'SIMULATED_POLICY_CHANGE',['DEMO_ONLY'],{datasetId,policyVersion:policy.version});
    return structuredClone(policy);
  }
  publicBenefits(){
    return {isSynthetic:true,commitments:this.db.benefitCommitments.map(b=>({id:b.id,benefit:b.benefit,status:b.status})),decisionCounts:{approved:this.db.receipts.filter(r=>r.decision==='APPROVED').length,denied:this.db.receipts.filter(r=>r.decision==='DENIED').length,revoked:this.db.receipts.filter(r=>r.decision==='GRANT_REVOKED').length},note:'Counts are invented demo events, not outcomes or commitments by any partner.'};
  }
  state(){
    const d=this.db;
    const r=d.requests[0];
    return {project:'CommonsGate',version:'0.1.0',demoOnly:true,counts:{participants:d.participants.length,communities:d.communities.length,datasets:d.datasets.length,policies:d.policies.length,requests:d.requests.length,benefitCommitments:d.benefitCommitments.length},communities:d.communities,datasets:d.datasets.map(x=>({...x,participantIds:undefined,participantCount:x.participantIds.length})),currentRequest:{...r,termsHash:digest(requestTerms(r))},checks:this.checks(r),consents:d.consents.filter(c=>c.datasetId==='D-001').map(c=>({id:c.id,participantId:c.participantId,status:c.status,version:c.version})),reviews:d.reviews.filter(v=>v.requestId==='R-001'),steward:d.stewardChecks.find(s=>s.requestId==='R-001')||null,grants:d.grants.filter(g=>g.requestId==='R-001').map(g=>({id:g.id,issuedAt:g.issuedAt,expiresAt:g.expiresAt,revokedAt:g.revokedAt})),receipts:d.receipts.slice(-20),publicBenefits:this.publicBenefits(),receiptChainValid:this.verifyReceipts()};
  }
  runScenario(actor,scenario){
    this.requireActor(actor,['demo-operator']);
    if(!['allow','deny','revoke'].includes(scenario))throw failure('INVALID_SCENARIO',400);
    this.reset();
    const id='R-001';
    const trace=[];
    const add=(step,status,detail)=>trace.push({step,status,detail});
    add('Research request','SUBMITTED','Fictional academic analysis of dataset D-001; no commercial sale or model training.');
    this.addReview('river-reviewer-1',id,'APPROVE');
    add('Community reviewer 1','APPROVED','First simulated community representative approves the proposed use.');
    if(scenario==='deny'){
      this.addReview('river-reviewer-2',id,'REJECT');
      add('Community reviewer 2','VETOED','Second reviewer exercises a veto; other approvals cannot override it.');
    } else {
      this.addReview('river-reviewer-2',id,'APPROVE');
      add('Community reviewer 2','APPROVED','Second reviewer satisfies the invented two-reviewer rule.');
    }
    this.setStewardCheck('river-steward',id,'APPROVED');
    add('Data steward','APPROVED','Simulated ethics/prerequisite checklist passes. Not real ethics approval.');
    const decision=this.evaluate('researcher-1',id);
    add('Policy engine',decision.status,decision.reasonCodes.map(x=>REASONS[x]||x).join(' '));
    let accessBefore, accessAfter, withdrawal=null;
    if(decision.status==='APPROVED'){
      accessBefore=this.access('researcher-1',id,decision.grantToken);
      add('Access gateway',accessBefore.status,'Only a fictional eight-record aggregate is returned; raw records never leave the demo.');
      if(scenario==='revoke'){
        withdrawal=this.withdrawConsent('participant-P-001','CN-D-001-P-001');
        add('Individual withdrawal','WITHDRAWN','Fictional participant P-001 withdraws permission; the active grant is revoked.');
        accessAfter=this.access('researcher-1',id,decision.grantToken);
        add('Later access attempt',accessAfter.status,'The old grant is rejected. A previous result cannot be retroactively erased.');
      }
    }else{
      accessAfter=this.access('researcher-1',id,'no-token');
      add('Access gateway',accessAfter.status,'No token was issued; the gateway refuses the attempted access.');
    }
    return {scenario,headline:scenario==='allow'?'Allowed — all checks pass':scenario==='deny'?'Denied — community veto': 'Revoked — individual permission withdrawn',decision:{status:decision.status,reasonCodes:decision.reasonCodes,grantId:decision.grantId||null,expiresAt:decision.expiresAt||null},accessBefore:accessBefore?{status:accessBefore.status,aggregate:accessBefore.aggregate||null}:null,accessAfter:accessAfter?{status:accessAfter.status,reasonCode:accessAfter.reasonCode||null}:null,withdrawal,trace,state:this.state()};
  }
}
module.exports={CommonsGate,REASONS,digest,requestTerms,failure};

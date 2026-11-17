'use strict';

const communities = [
  { id: 'C-RIVER', name: 'River Collective', description: 'Invented research community A' },
  { id: 'C-HILL', name: 'Hill Collective', description: 'Invented research community B' },
];
const datasets = [
  { id: 'D-001', label: 'Community Wellbeing Survey A', communityId: 'C-RIVER', category: 'fabricated wellbeing indicators', sensitivity: 'simulation only', participantIds: Array.from({length:8},(_,i)=>`P-${String(i+1).padStart(3,'0')}`), version: 1 },
  { id: 'D-002', label: 'Community Wellbeing Survey B', communityId: 'C-HILL', category: 'fabricated survey categories', sensitivity: 'simulation only', participantIds: Array.from({length:8},(_,i)=>`P-${String(i+9).padStart(3,'0')}`), version: 1 },
  { id: 'D-003', label: 'Community Access Survey C', communityId: 'C-RIVER', category: 'fabricated access categories', sensitivity: 'simulation only', participantIds: Array.from({length:8},(_,i)=>`P-${String(i+17).padStart(3,'0')}`), version: 1 },
];
const participants = Array.from({ length:24 },(_,i)=>({
  id: `P-${String(i+1).padStart(3,'0')}`,
  alias: `Fictional participant ${String(i+1).padStart(2,'0')}`,
  communityId: i>=8 && i<16 ? 'C-HILL' : 'C-RIVER',
  isSynthetic: true
}));
const policies = [
  { id:'POL-001', datasetId:'D-001', communityId:'C-RIVER', allowedPurposes:['academic_analysis'], bannedUses:['commercial_sale','model_training'], minApprovals:2, version:1 },
  { id:'POL-002', datasetId:'D-002', communityId:'C-HILL', allowedPurposes:['academic_analysis'], bannedUses:['commercial_sale','model_training'], minApprovals:2, version:1 },
  { id:'POL-003', datasetId:'D-003', communityId:'C-RIVER', allowedPurposes:['academic_analysis'], bannedUses:['commercial_sale'], minApprovals:2, version:1 },
  { id:'POL-004', datasetId:'D-003', communityId:'C-RIVER', allowedPurposes:['public_interest_report'], bannedUses:['commercial_sale','model_training'], minApprovals:2, version:1, isAlternateRule:true },
];
const requests = [
  {id:'R-001',requesterId:'researcher-1',datasetId:'D-001',purpose:'academic_analysis',commercialUse:false,modelTraining:false,description:'Generate a fictional group-level analysis',state:'PENDING'},
  {id:'R-002',requesterId:'researcher-1',datasetId:'D-001',purpose:'model_training',commercialUse:false,modelTraining:true,description:'Train a hypothetical AI model',state:'PENDING'},
  {id:'R-003',requesterId:'researcher-1',datasetId:'D-002',purpose:'academic_analysis',commercialUse:false,modelTraining:false,description:'Generate fictional survey totals',state:'PENDING'},
  {id:'R-004',requesterId:'researcher-1',datasetId:'D-003',purpose:'model_training',commercialUse:false,modelTraining:true,description:'Train a hypothetical language model',state:'PENDING'},
  {id:'R-005',requesterId:'researcher-1',datasetId:'D-001',purpose:'academic_analysis',commercialUse:true,modelTraining:false,description:'Commercial resale of fictional survey',state:'PENDING'},
  {id:'R-006',requesterId:'researcher-1',datasetId:'D-003',purpose:'public_interest_report',commercialUse:false,modelTraining:false,description:'Publish a synthetic community report',state:'PENDING'},
];
const reviewerIds = {
  'C-RIVER': ['river-reviewer-1','river-reviewer-2'],
  'C-HILL': ['hill-reviewer-1','hill-reviewer-2']
};
const stewardIds = {'C-RIVER':'river-steward','C-HILL':'hill-steward'};
const benefitCommitments = [
  {id:'B-001',requestId:'R-001',benefit:'Open accessibility findings for community review',status:'PROMISED',evidenceRef:null},
  {id:'B-002',requestId:'R-003',benefit:'Plain-language public research summary',status:'PLANNED',evidenceRef:null}
];

function makeFixtures(){
  return {
    communities:structuredClone(communities),
    datasets:structuredClone(datasets),
    participants:structuredClone(participants),
    policies:structuredClone(policies),
    requests:structuredClone(requests),
    reviewerIds:structuredClone(reviewerIds),
    stewardIds:structuredClone(stewardIds),
    consents: datasets.flatMap(d=>d.participantIds.map(pid=>({
      id:`CN-${d.id}-${pid}`,participantId:pid,datasetId:d.id,purpose:'academic_analysis',status:'GRANTED',version:1,updatedAt:'2026-11-16T00:00:00.000Z'
    }))),
    reviews:[],
    stewardChecks:[],
    grants:[],
    receipts:[],
    benefitCommitments:structuredClone(benefitCommitments)
  };
}
module.exports={makeFixtures};

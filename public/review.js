'use strict';
// A device-only, structured feedback export. No fetch(), analytics, storage or server submission.
const form = document.getElementById('review-form');
const status = document.getElementById('review-status');
const questions = ['withdrawal','veto','clarity','agency','usefulness','priority'];
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const answers = {};
  const values = new FormData(form);
  for (const key of questions) {
    const value = values.get(key);
    if (typeof value !== 'string' || !value) {
      status.textContent = 'Please answer every question before exporting.';
      return;
    }
    answers[key] = value;
  }
  const result = {
    schema: 'commonsgate.review.v1',
    version: '0.2.0',
    source: 'voluntary-local-review',
    disclaimer: 'Synthetic demonstration only; no identity, clinical data, or host endorsement',
    responses: answers
  };
  const content = new Blob([JSON.stringify(result,null,2)+'\n'], {type:'application/json'});
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'commonsgate-review.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = 'A JSON file was generated on this device. No response was sent to CommonsGate.';
});
form.addEventListener('reset', () => {
  status.textContent = 'Answers cleared. No responses are saved by CommonsGate.';
});

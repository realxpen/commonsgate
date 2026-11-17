'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const { CommonsGate }=require('./engine');

const gate=new CommonsGate();
const root=path.resolve(__dirname,'..','public');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon'};
function send(res,status,body,contentType='application/json; charset=utf-8'){
  res.writeHead(status,{'Content-Type':contentType,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'"});
  res.end(Buffer.isBuffer(body)||typeof body==='string'?body:JSON.stringify(body));
}
async function bodyJson(req){
  let raw='';
  for await(const chunk of req){raw+=chunk.toString();if(raw.length>16_384){const err=new Error('Request exceeds demo limit');err.status=413;throw err;}}
  if(!raw)return {};
  try{return JSON.parse(raw);}catch{const err=new Error('Invalid JSON');err.status=400;throw err;}
}
async function route(req,res){
  const url=new URL(req.url,'http://localhost');
  const pathname=url.pathname;
  const actor=req.headers['x-demo-actor']||'observer';
  if(pathname.startsWith('/api/')){
    try{
      if(req.method==='GET'&&pathname==='/api/health')return send(res,200,{ok:true,mode:'LOCAL_SYNTHETIC_DEMO',dataSource:'generated fixtures'});
      if(req.method==='GET'&&pathname==='/api/state')return send(res,200,gate.state());
      if(req.method==='GET'&&pathname==='/api/public/benefits')return send(res,200,gate.publicBenefits());
      if(req.method==='POST'&&pathname==='/api/demo/reset'){
        gate.requireActor(actor,['demo-operator']);return send(res,200,{status:'RESET',state:gate.reset()});
      }
      if(req.method==='POST'&&pathname==='/api/demo/run'){
        const body=await bodyJson(req);return send(res,200,gate.runScenario(actor,body.scenario));
      }
      const rev=pathname.match(/^\/api\/requests\/(R-\d{3})\/reviews$/);
      if(req.method==='POST'&&rev){const body=await bodyJson(req);return send(res,200,gate.addReview(actor,rev[1],body.vote));}
      const steward=pathname.match(/^\/api\/requests\/(R-\d{3})\/steward-check$/);
      if(req.method==='POST'&&steward){const body=await bodyJson(req);return send(res,200,gate.setStewardCheck(actor,steward[1],body.ethicsStatus));}
      const evaluate=pathname.match(/^\/api\/requests\/(R-\d{3})\/evaluate$/);
      if(req.method==='POST'&&evaluate)return send(res,200,gate.evaluate(actor,evaluate[1]));
      const consent=pathname.match(/^\/api\/consents\/(CN-D-\d{3}-P-\d{3})\/withdraw$/);
      if(req.method==='POST'&&consent)return send(res,200,gate.withdrawConsent(actor,consent[1]));
      if(req.method==='POST'&&pathname==='/api/access/authorize'){
        const body=await bodyJson(req);return send(res,200,gate.access(actor,body.requestId,body.grantToken,body.termsHash));
      }
      return send(res,404,{error:'NOT_FOUND',message:'No such demo API endpoint.'});
    }catch(e){return send(res,e.status||500,{error:e.code||'INTERNAL_ERROR',message:e.status?e.message:'Internal demo error'});}
  }
  if(req.method!=='GET')return send(res,405,'Method Not Allowed','text/plain');
  const assets={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/styles.css':'styles.css','/favicon.svg':'favicon.svg'};
  const filename=assets[pathname];
  if(!filename)return send(res,404,'Not Found','text/plain');
  fs.readFile(path.join(root,filename),(err,data)=>{
    if(err)return send(res,404,'Not Found','text/plain');
    send(res,200,data,mime[path.extname(filename)]||'application/octet-stream');
  });
}
function start(port=process.env.PORT||4173,host='127.0.0.1'){
  const server=http.createServer((req,res)=>{route(req,res).catch(e=>send(res,500,{error:'SERVER_ERROR',message:'Unexpected local demo error'}));});
  server.listen(port,host,()=>console.log(`CommonsGate synthetic demo available at http://${host}:${server.address().port}`));
  return server;
}
if(require.main===module)start();
module.exports={start,gate};

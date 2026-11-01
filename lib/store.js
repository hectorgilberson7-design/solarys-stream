// Stockage : Upstash Redis (Vercel Marketplace) si dispo, sinon /tmp (temporaire).
const fs=require('fs'),F='/tmp/solarys-store.json';
const U=process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL;
const T=process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;
const H={Authorization:`Bearer ${T}`};
exports.persistent=!!(U&&T);
exports.get=async k=>{
  if(U&&T){const r=await fetch(`${U}/get/${k}`,{headers:H}).then(r=>r.json());return r.result?JSON.parse(r.result):null}
  try{return JSON.parse(fs.readFileSync(F,'utf8'))[k]??null}catch{return null}};
exports.set=async(k,v)=>{
  if(U&&T){await fetch(`${U}/set/${k}`,{method:'POST',headers:H,body:JSON.stringify(v)});return}
  let d={};try{d=JSON.parse(fs.readFileSync(F,'utf8'))}catch{}d[k]=v;fs.writeFileSync(F,JSON.stringify(d))};

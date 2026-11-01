const dns=require('dns').promises;
const PRIV=/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|::1|fc|fd|fe80)/i;
const pick=(o,p)=>p?String(p).split('.').reduce((a,k)=>a==null?a:a[k],o):o;
const https=s=>/^https:\/\//.test(s||'');
async function safeUrl(u){
  const x=new URL(u);if(x.protocol!=='https:')throw new Error('HTTPS obligatoire');
  const a=await dns.lookup(x.hostname,{all:true});
  if(a.some(r=>PRIV.test(r.address)))throw new Error('Adresse privée refusée');return x}
exports.validate=m=>{
  const need=(c,msg)=>{if(!c)throw new Error('manifest invalide : '+msg)};
  need(m&&m.name,'name manquant');
  need(m.license&&String(m.license).length>=10,'license manquante (contrat, URL ou référence prouvant vos droits de diffusion)');
  need(https(m.baseUrl),'baseUrl doit commencer par https://');
  need(m.catalog&&m.catalog.path,'catalog.path manquant');
  const p=m.catalog.map||{};need(p.id&&p.title&&p.stream,'catalog.map doit contenir id, title, stream');
  return {...m,slug:String(m.name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'source'}};
const fetchItems=async m=>{
  const u=await safeUrl(m.baseUrl.replace(/\/$/,'')+m.catalog.path);
  const r=await fetch(u,{headers:m.headers||{},signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw new Error('La source répond HTTP '+r.status);
  const list=pick(await r.json(),m.catalog.itemsPath);
  if(!Array.isArray(list))throw new Error('itemsPath ne pointe pas vers une liste');
  const k=m.catalog.map;
  return list.slice(0,300).map(i=>({id:`${m.slug}:${pick(i,k.id)}`,title:pick(i,k.title),year:pick(i,k.year)||'',
    poster:https(pick(i,k.poster))?pick(i,k.poster):'',overview:pick(i,k.overview)||'',
    genre:pick(i,k.genre)||m.name,stream:pick(i,k.stream),source:m.name})).filter(i=>i.title&&https(i.stream))};
exports.fetchItems=fetchItems;
const cache=new Map();
exports.cachedItems=async m=>{const c=cache.get(m.slug);if(c&&Date.now()-c.t<3e5)return c.v;
  const v=await fetchItems(m);cache.set(m.slug,{t:Date.now(),v});return v};

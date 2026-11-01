const crypto=require('crypto'),{unzipSync,strFromU8}=require('fflate'),store=require('../lib/store'),{validate,fetchItems}=require('../lib/providers');
const same=(a,b)=>{const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&crypto.timingSafeEqual(x,y)};
module.exports=async(req,res)=>{
  const pw=process.env.ADMIN_PASSWORD;
  if(!pw)return res.status(500).json({error:'Définissez ADMIN_PASSWORD dans les variables Vercel'});
  if(!same(req.headers['x-admin-password'],pw))return res.status(401).json({error:'Mot de passe incorrect'});
  const b=req.body||{};let ps=(await store.get('providers'))||[];
  if(req.method==='GET'||b.action==='list')
    return res.json({persistent:store.persistent,providers:ps.map(({headers,...p})=>p)});
  if(b.action==='delete'){ps=ps.filter(p=>p.slug!==b.slug);await store.set('providers',ps);return res.json({ok:true})}
  if(b.action==='upload'){
    try{
      if(ps.length>=10)throw new Error('10 sources maximum');
      const f=unzipSync(new Uint8Array(Buffer.from(b.data||'','base64')),{filter:e=>/(^|\/)manifest\.json$/.test(e.name)&&e.originalSize<1e5});
      const k=Object.keys(f)[0];if(!k)throw new Error('manifest.json introuvable dans le zip');
      const m=validate(JSON.parse(strFromU8(f[k])));
      const items=await fetchItems(m); // test automatique
      if(!items.length)throw new Error('Test automatique : aucun film lisible (id, title et stream https requis)');
      ps=ps.filter(p=>p.slug!==m.slug);ps.push({...m,addedAt:new Date().toISOString(),count:items.length});
      await store.set('providers',ps);
      return res.json({ok:true,name:m.name,count:items.length})
    }catch(e){return res.status(400).json({error:e.message})}}
  res.status(400).json({error:'Action inconnue'})};

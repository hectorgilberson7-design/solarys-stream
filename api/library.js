const free=require('../data/free-library.json'),store=require('../lib/store'),{cachedItems}=require('../lib/providers');
module.exports=async(req,res)=>{
  const ps=(await store.get('providers'))||[],items=[...free];
  await Promise.all(ps.map(async p=>{try{items.push(...await cachedItems(p))}catch{}}));
  res.setHeader('Cache-Control','s-maxage=120');
  res.json({tmdb:!!process.env.TMDB_API_KEY,items})};

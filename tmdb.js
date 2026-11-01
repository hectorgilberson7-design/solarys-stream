const OK=/^(trending\/movie\/week|movie\/(popular|top_rated|upcoming|now_playing)|movie\/\d+(\/videos)?|discover\/movie|search\/movie|genre\/movie\/list)$/;
module.exports=async(req,res)=>{
  const key=process.env.TMDB_API_KEY;if(!key)return res.status(503).json({error:'TMDB_API_KEY manquante'});
  const {path,...q}=req.query;if(!OK.test(path||''))return res.status(400).json({error:'chemin refusé'});
  const u=new URL('https://api.themoviedb.org/3/'+path);
  u.searchParams.set('language','fr-FR');for(const[k,v]of Object.entries(q))u.searchParams.set(k,v);
  u.searchParams.set('api_key',key);
  const r=await fetch(u);res.setHeader('Cache-Control','s-maxage=600');res.status(r.status).json(await r.json())};

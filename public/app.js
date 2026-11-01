const $=s=>document.querySelector(s),V=$('#view'),D=$('#dlg');
const h=(t,a={},...c)=>{const e=document.createElement(t);for(const[k,v]of Object.entries(a)){if(k==='on')for(const[n,f]of Object.entries(v))e.addEventListener(n,f);else if(k==='class')e.className=v;else e.setAttribute(k,v)}
  c.flat().forEach(x=>e.append(x&&x.nodeType?x:document.createTextNode(x==null||x===false?'':x)));return e};
const ls={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const api=async u=>{try{const r=await fetch(u);return r.ok?await r.json():null}catch{return null}};
const IMG='https://image.tmdb.org/t/p/w342',ITEMS=new Map();let LIB=[],TMDB=false,GENRES=[];
const tm=m=>{const it={id:'tmdb:'+m.id,tmdb:m.id,title:m.title,year:(m.release_date||'').slice(0,4),overview:m.overview||'',poster:m.poster_path?IMG+m.poster_path:'',genre:'',stream:''};ITEMS.set(it.id,it);return it};
const tmList=async p=>TMDB?((await api('/api/tmdb?path='+p))?.results||[]).map(tm):[];
const profile=()=>ls.get('sl_profile',{name:'Invité',avatar:'🌞'});
const myList=()=>ls.get('sl_list',[]);
const hue=s=>[...s].reduce((a,c)=>a*31+c.charCodeAt(0),7)%360;
const poster=i=>i.poster?h('img',{class:'poster',src:i.poster,alt:'',loading:'lazy'}):h('div',{class:'poster',style:`background:linear-gradient(160deg,hsl(${hue(i.title)} 55% 38%),hsl(${(hue(i.title)+50)%360} 60% 22%));color:#fff`},i.title);
const card=i=>h('button',{class:'card',on:{click:()=>open(i)}},poster(i),h('b',{},i.title),h('small',{},[i.year,i.stream?'Film complet':'Bande-annonce'].filter(Boolean).join(' · ')));
const rowOf=(t,items,grid)=>items.length?h('section',{},h('h2',{},t),h('div',{class:grid?'grid':'row'},items.map(card))):'';
function open(i){
  if(i.stream){location.hash='#/watch/'+encodeURIComponent(i.id);return}
  D.replaceChildren(h('h2',{},i.title+(i.year?` (${i.year})`:'')),h('p',{},i.overview||'Pas de synopsis.'),h('div',{id:'tr'}),
    h('p',{},h('button',{class:'btn alt',on:{click:()=>toggle(i)}},'Ma liste'),' ',h('button',{class:'btn',on:{click:()=>D.close()}},'Fermer')));
  D.showModal();
  if(i.tmdb)api(`/api/tmdb?path=movie/${i.tmdb}/videos`).then(r=>{const v=(r?.results||[]).find(x=>x.site==='YouTube'&&x.type==='Trailer')||(r?.results||[]).find(x=>x.site==='YouTube');
    $('#tr').replaceChildren(v?h('iframe',{src:'https://www.youtube-nocookie.com/embed/'+v.key,allowfullscreen:'',title:'Bande-annonce'}):h('p',{class:'note'},'Aucune bande-annonce disponible.'))});
}
const toggle=i=>{let l=myList();l=l.some(x=>x.id===i.id)?l.filter(x=>x.id!==i.id):[i,...l].slice(0,60);ls.set('sl_list',l)};
function play(i){
  const m=/\.m3u8(\?|$)/.test(i.stream),v=h('video',{controls:'',autoplay:'',playsinline:'',poster:i.poster||''});
  if(m&&!v.canPlayType('application/vnd.apple.mpegurl')){const s=h('script',{src:'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js'});s.onload=()=>{const x=new Hls();x.loadSource(i.stream);x.attachMedia(v)};document.head.append(s)}else v.src=i.stream;
  return v}
const views={
  async home(){
    const play_=LIB,hero=play_[0];
    const by={};play_.forEach(i=>(by[i.genre]??=[]).push(i));
    const [tr,po,top,up]=await Promise.all(['trending/movie/week','movie/popular','movie/top_rated','movie/upcoming'].map(tmList));
    const l=myList();
    V.replaceChildren(
      hero?h('div',{class:'hero'},h('h1',{},hero.title),h('p',{},hero.overview),h('button',{class:'btn',on:{click:()=>open(hero)}},'Regarder')):'',
      rowOf('Ma liste',l),rowOf('À regarder maintenant',play_),
      ...Object.entries(by).map(([g,x])=>rowOf(g,x)),
      rowOf('Tendances de la semaine',tr),rowOf('Populaires',po),rowOf('Les mieux notés',top),rowOf('Bientôt au cinéma',up),
      !play_.length&&!TMDB?h('p',{class:'note'},'Aucun contenu pour le moment.'):'')},
  async categories(a){
    const cur=decodeURIComponent(a||''),lib=[...new Set(LIB.map(i=>i.genre))];
    const chip=(label,key)=>h('button',{class:'chip'+(cur===key?' on':''),on:{click:()=>location.hash='#/categories/'+encodeURIComponent(key)}},label);
    V.replaceChildren(h('h2',{},'Catégories'),h('div',{class:'chips'},lib.map(g=>chip(g,'lib:'+g)),GENRES.map(g=>chip(g.name,'tmdb:'+g.id))),h('div',{id:'res'}));
    let items=[];
    if(cur.startsWith('lib:'))items=LIB.filter(i=>i.genre===cur.slice(4));
    else if(cur.startsWith('tmdb:'))items=await tmList('discover/movie&sort_by=popularity.desc&with_genres='+cur.slice(5));
    else items=[...LIB,...await tmList('movie/popular')];
    $('#res').replaceChildren(items.length?h('div',{class:'grid'},items.map(card)):h('p',{class:'note'},'Rien dans cette catégorie.'))},
  async search(a){
    const q=decodeURIComponent(a||'').trim().toLowerCase();
    const mine=LIB.filter(i=>i.title.toLowerCase().includes(q)),t=q?await tmList('search/movie&query='+encodeURIComponent(q)):[];
    V.replaceChildren(h('h2',{},`Résultats pour « ${q} »`),mine.length||t.length?h('div',{class:'grid'},[...mine,...t].map(card)):h('p',{class:'note'},'Aucun résultat.'))},
  async watch(a){
    const id=decodeURIComponent(a),i=ITEMS.get(id);
    if(!i){V.replaceChildren(h('p',{},'Film introuvable.'),h('a',{href:'#/'},'Retour à l’accueil'));return}
    ls.set('sl_hist',[i,...ls.get('sl_hist',[]).filter(x=>x.id!==id)].slice(0,30));
    V.replaceChildren(h('div',{class:'watch'},play(i),h('h1',{},i.title),h('p',{class:'note'},[i.year,i.source].filter(Boolean).join(' · ')),h('p',{},i.overview),
      h('p',{},h('button',{class:'btn alt',on:{click:e=>{toggle(i);e.target.textContent='Ma liste mise à jour'}}},'Ajouter / retirer de ma liste'))))},
  async profile(){
    const p=profile(),save=x=>{ls.set('sl_profile',{...profile(),...x});views.profile()};
    V.replaceChildren(h('h2',{},'Profil'),
      h('p',{},['🌞','🌙','🦊','🐙','🚀','🎬'].map(a=>h('button',{class:'av'+(p.avatar===a?' on':''),'aria-label':'Avatar '+a,on:{click:()=>save({avatar:a})}},a))),
      h('p',{},h('input',{class:'t',value:p.name,maxlength:'30','aria-label':'Nom',on:{change:e=>save({name:e.target.value||'Invité'})}})),
      rowOf('Ma liste',myList()),rowOf('Historique',ls.get('sl_hist',[])),
      h('p',{class:'note'},'Profil, liste et historique sont enregistrés sur cet appareil uniquement.'),
      h('button',{class:'btn alt',on:{click:()=>{['sl_profile','sl_list','sl_hist'].forEach(k=>localStorage.removeItem(k));views.profile()}}},'Effacer mes données'))}};
async function route(){
  const p=location.hash.replace(/^#\/?/,'').split('/'),name=views[p[0]]?p[0]:'home',a=p.slice(1).join('/');
  document.querySelectorAll('nav a').forEach(x=>x.classList.toggle('on',x.dataset.r===name));
  window.scrollTo(0,0);await views[name](a)}
(async()=>{
  const[l,g]=await Promise.all([api('/api/library'),api('/api/tmdb?path=genre/movie/list')]);
  LIB=l?.items||[];TMDB=!!l?.tmdb;GENRES=g?.genres||[];LIB.forEach(i=>ITEMS.set(i.id,i));
  $('#q').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.value.trim())location.hash='#/search/'+encodeURIComponent(e.target.value.trim())});
  addEventListener('hashchange',route);route()})();

import {$,html} from '../assets/common.js';
const data=await fetch('../data/functions.json').then(r=>r.json());
let category='전체';const q=$('#refSearch'),cats=$('#catList'),results=$('#refResults'),count=$('#refCount');
const categories=['전체',...new Set(data.map(x=>x.category))];
function renderCats(){cats.innerHTML=categories.map(c=>`<button class="btn small ${c===category?'soft':''}" data-cat="${html(c)}" style="text-align:left">${html(c)}</button>`).join('');cats.querySelectorAll('button').forEach(b=>b.onclick=()=>{category=b.dataset.cat;renderCats();render()})}
function render(){const term=q.value.trim().toLowerCase();const rows=data.filter(x=>(category==='전체'||x.category===category)&&(!term||`${x.name} ${x.signature} ${x.description} ${x.category}`.toLowerCase().includes(term)));count.textContent=rows.length;results.innerHTML=rows.map(x=>`<article class="ref-card"><div class="row"><h3 class="grow">${html(x.name)}</h3><span class="badge blue">${html(x.category)}</span></div><div class="sig">${html(x.signature)}</div>${x.description?`<p>${html(x.description)}</p>`:''}</article>`).join('')||'<div class="empty">검색 결과가 없습니다.</div>'}
q.addEventListener('input',render);renderCats();render();

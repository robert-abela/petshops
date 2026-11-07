'use strict';
(()=>{
 const form=document.querySelector('.filters'),list=document.querySelector('#products');
 if(!form||!list)return;
 const PAGE_SIZE=25;
 const byId=id=>document.getElementById(id);
 const markup=JSON.parse(byId('catalog-rows').textContent);
 const wrapper=document.createElement(list.tagName==='TBODY'?'tbody':'div');
 wrapper.innerHTML=markup.join('');
 const rows=[...wrapper.children];
 const controls=['search','pet','category','food','sort','stock'];
 const initial=new URLSearchParams(location.search);
 controls.forEach(id=>{if(id==='stock')byId(id).checked=initial.get(id)==='yes';else if(initial.has(id))byId(id).value=initial.get(id);});
 function query(){
  const params=new URLSearchParams();
  controls.forEach(id=>{const value=id==='stock'?(byId(id).checked?'yes':''):byId(id).value;if(value&&!(id==='sort'&&value==='default'))params.set(id,value);});
  return params.size?'?'+params.toString():'';
 }
 function pageFile(n){return n===1?'index.html':`page-${n}.html`;}
 function render(page,updateAddress){
  const q=byId('search').value.trim().toLowerCase(),pet=byId('pet').value,cat=byId('category').value,food=byId('food').value,stock=byId('stock').checked;
  const matching=rows.filter(row=>{const d=row.dataset;return (!q||row.textContent.toLowerCase().includes(q))&&(!pet||d.pet===pet)&&(!cat||d.category===cat)&&(!food||(d.category==='Food'&&d.food===food))&&(!stock||d.stock==='yes');});
  const sort=byId('sort').value;
  matching.sort((a,b)=>sort==='price-low'?+a.dataset.price-+b.dataset.price:sort==='price-high'?+b.dataset.price-+a.dataset.price:sort==='name'?a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent):rows.indexOf(a)-rows.indexOf(b));
  const pages=Math.ceil(matching.length/PAGE_SIZE);
  page=Math.min(Math.max(1,page),Math.max(1,pages));
  const start=(page-1)*PAGE_SIZE;
  list.replaceChildren(...matching.slice(start,start+PAGE_SIZE));
  byId('count').textContent=matching.length?`Showing ${start+1}–${Math.min(start+PAGE_SIZE,matching.length)} of ${matching.length} products`:'0 products';
  document.querySelector('.empty').hidden=matching.length!==0;
  const params=query();
  const link=(n,label)=>`<a href="${pageFile(n)}${params.replace(/&/g,'&amp;')}"${n===page?' aria-current="page"':''}>${label}</a>`;
  document.querySelector('.pagination').innerHTML=(page>1?link(page-1,'← Previous'):'')+Array.from({length:pages},(_,i)=>link(i+1,String(i+1))).join('')+(page<pages?link(page+1,'Next →'):'')+'<span>25 products per page</span>';
  if(updateAddress){try{history.replaceState(null,'',pageFile(page)+params);}catch{/* Filtering still works when history is unavailable. */}}
 }
 form.addEventListener('submit',e=>e.preventDefault());
 form.addEventListener('input',()=>render(1,true));
 form.addEventListener('change',()=>render(1,true));
 form.addEventListener('reset',()=>setTimeout(()=>render(1,true),0));
 // Normal links keep each page addressable and retain filters in the URL.
 render(Number(list.dataset.page)||1,false);
})();

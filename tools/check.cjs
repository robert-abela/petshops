const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const decode=s=>s.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
let checks=0;
function ok(value,msg){assert(value,msg);checks++;}
for(const file of ['index.html',...['a','b'].flatMap(s=>['index.html','page-2.html','page-3.html','page-4.html'].map(f=>'store-'+s+'/'+f))]){
 const html=read(file);
 for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const url=decode(match[1]);if(/^(https?:|#)/.test(url))continue;
  ok(fs.existsSync(path.resolve(root,path.dirname(file),url.split('#')[0])),`${file}: missing ${url}`);
 }
}
for(const store of ['a','b']){
 const dir='store-'+store,data=JSON.parse(read(dir+'/catalog.json')),html=['index.html','page-2.html','page-3.html','page-4.html'].map(f=>read(dir+'/'+f)).join('');
 ok(data.length===100,'100 items per store');ok(new Set(data.map(p=>p.id)).size===100,'Unique IDs');
 ok(new Set(data.map(p=>p.name)).size===100,'Unique product names');
 ok((html.match(/class="(?:product-card|inventory-row)"/g)||[]).length===100,'100 static HTML records across four pages');
 ok(data.every(p=>['Food','Toys','Cages & Transport','Grooming','Litter','Supplements','Flea & Tick'].includes(p.category)),'Original categories only');
 for(let page=1;page<=4;page++){
  const pageHtml=read(dir+'/'+(page===1?'index.html':'page-'+page+'.html'));
  const records=pageHtml.match(/<article class="product-card"[\s\S]*?<\/article>|<tr class="inventory-row"[\s\S]*?<\/tr>/g)||[];
  ok(records.length===25,'Exactly 25 static products on page '+page);
  const pageIds=records.map(r=>r.match(/data-id="([^"]+)"/)[1]);
  ok(JSON.stringify(pageIds)===JSON.stringify(data.slice((page-1)*25,page*25).map(p=>p.id)),'Correct page boundaries');
  ok(pageHtml.includes('aria-current="page">'+page+'</a>'),'Current page marked');
  const payload=JSON.parse(pageHtml.match(/<script id="catalog-rows" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  ok(payload.length===100,'Full catalog available for filtering');
 }
 for(const p of data){
  for(const key of ['id','name','description','packSize','image','pet','category'])ok(!!p[key],`${p.id}: ${key}`);
  ok(typeof p.inStock==='boolean'&&p.price>0&&p.currency==='EUR','Valid price and stock');
  ok(decode(html).includes(p.name)&&decode(html).includes(p.description),'Product content in initial HTML');
 }
 for(const pet of ['Dogs','Cats','Rodents']){
  const expected=['Food','Toys','Cages & Transport','Grooming','Litter','Supplements'];
  if(pet!=='Rodents')expected.push('Flea & Tick');
  for(const cat of expected)ok(data.some(p=>p.pet===pet&&p.category===cat),pet+' '+cat);
  for(const food of pet==='Rodents'?['Dry','Treats']:['Dry','Wet','Treats'])ok(data.some(p=>p.pet===pet&&p.subcategory===food),pet+' '+food);
 }
 const rows=data.map(p=>({dataset:{id:p.id,pet:p.pet,category:p.category,food:p.subcategory,price:String(p.price),stock:p.inStock?'yes':'no'},textContent:[p.id,p.name,p.description,p.pet,p.category,p.subcategory,p.packSize].join(' '),hidden:false,querySelector:()=>({textContent:p.name})}));
 const ids={};for(const id of ['search','pet','category','food','sort','stock','count'])ids[id]={value:'',checked:false};ids.sort.value='default';
 const listeners={},form={addEventListener:(event,cb)=>listeners[event]=cb};
 const list={tagName:store==='b'?'TBODY':'DIV',dataset:{page:'4'},children:[],replaceChildren(...children){this.children=children}};
 const empty={hidden:true},pagination={innerHTML:''},addresses=[];
 ids['catalog-rows']={textContent:read(dir+'/page-4.html').match(/<script id="catalog-rows" type="application\/json">([\s\S]*?)<\/script>/)[1]};
 const wrapper={children:[],set innerHTML(markup){this.children=[...markup.matchAll(/data-id="([^"]+)"/g)].map(m=>rows.find(r=>r.dataset.id===m[1]));}};
 vm.runInNewContext(read('assets/catalog.js'),{document:{querySelector:s=>s==='.filters'?form:s==='#products'?list:s==='.pagination'?pagination:empty,getElementById:id=>ids[id],createElement:()=>wrapper},location:{search:''},history:{replaceState:(a,b,url)=>addresses.push(url)},URLSearchParams,setTimeout:cb=>cb()});
 const update=()=>listeners.input();
 ok(list.children.length===25&&list.children[0]===rows[75],'Direct page 4 shows products 76–100');
 ok(pagination.innerHTML.includes('aria-current="page">4</a>'),'Runtime current page');
 ids.pet.value='Rodents';ids.category.value='Food';ids.food.value='Wet';update();ok(list.children.length===0&&!empty.hidden,'Empty results');
 ids.food.value='Dry';update();ok(list.children.length===data.filter(p=>p.pet==='Rodents'&&p.category==='Food'&&p.subcategory==='Dry').length,'Full catalog food filters');
 ids.pet.value='';ids.category.value='';ids.food.value='';ids.search.value=data[0].id.toLowerCase();update();ok(list.children.length===1&&list.children[0]===rows[0],'Search finds product from another static page');
 ids.search.value='';ids.stock.checked=true;ids.sort.value='price-low';update();ok(list.children.length===25&&list.children.every(p=>p.dataset.stock==='yes'),'In-stock results paginated');
 ok(list.children.every((p,i,all)=>!i||+all[i-1].dataset.price<=+p.dataset.price),'Ascending sort');
 ok(pagination.innerHTML.includes('stock=yes&amp;sort=price-low')||pagination.innerHTML.includes('sort=price-low&amp;stock=yes'),'Page links retain filters');
 ids.sort.value='price-high';update();ok(list.children.every((p,i,all)=>!i||+all[i-1].dataset.price>=+p.dataset.price),'Descending sort');
 ids.sort.value='name';update();ok(list.children.every((p,i,all)=>!i||all[i-1].querySelector().textContent.localeCompare(p.querySelector().textContent)<=0),'Name sort');
 ids.stock.checked=false;ids.sort.value='default';listeners.reset();ok(list.children.length===25&&empty.hidden&&list.children[0]===rows[0],'Reset restores first 25 products');
 ok(addresses.at(-1)==='index.html','Reset restores first-page address');
 ok(pagination.innerHTML.includes('page-4.html')&&!pagination.innerHTML.includes('<select'),'Four fixed pages with no size selector');
 list.dataset.page='2';
 vm.runInNewContext(read('assets/catalog.js'),{document:{querySelector:s=>s==='.filters'?form:s==='#products'?list:s==='.pagination'?pagination:empty,getElementById:id=>ids[id],createElement:()=>wrapper},location:{search:'?stock=yes&sort=price-low'},history:{replaceState:()=>{}},URLSearchParams,setTimeout:cb=>cb()});
 const expected=rows.filter(p=>p.dataset.stock==='yes').sort((a,b)=>+a.dataset.price-+b.dataset.price).slice(25,50);
 ok(JSON.stringify(list.children.map(p=>p.dataset.id))===JSON.stringify(expected.map(p=>p.dataset.id)),'Filtered page 2 reload retains global sort and correct boundaries');

}
ok(read('store-a/index.html').includes('href="../index.html">Choose store</a>'),'Store A chooser label');
const home=read('index.html');
for(const text of ['LAS3024 Programming in Python','Home Assignment','Use these fictitious stores to complete Task A'])ok(home.includes(text),'Landing copy: '+text);
for(const text of ['The Petshop Pair','HELLO, PET PEOPLE','Their next favourite','Two little shops. Two different personalities.','Everything for dogs, cats and little companions.'])ok(!home.includes(text),'Removed landing copy: '+text);
const a=JSON.parse(read('store-a/catalog.json')),b=JSON.parse(read('store-b/catalog.json'));
ok(a.some((p,i)=>p.name===b[i].name)&&a.some((p,i)=>p.name!==b[i].name),'Overlapping, distinct catalogs');
for(const name of ['home','store-a','store-b']){
 const css=read('assets/'+name+'.css');
 for(const [open,close] of [['{','}'],['(',')']]){let depth=0;for(const c of css){if(c===open)depth++;if(c===close)depth--;ok(depth>=0,'CSS delimiters');}ok(depth===0,'Balanced CSS');}
}
console.log(`Passed ${checks} assertions: static data, relative links, category coverage, filter/sort/reset logic and CSS delimiters.`);

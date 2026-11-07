const PAGE_SIZE=25;
const pageFile=n=>n===1?'index.html':`page-${n}.html`;
function navigation(page,total){
 const link=(n,label)=>`<a href="${pageFile(n)}"${n===page?' aria-current="page"':''}>${label}</a>`;
 return `<nav class="pagination" aria-label="Catalog pages">${page>1?link(page-1,'← Previous'):''}${Array.from({length:total},(_,i)=>link(i+1,String(i+1))).join('')}${page<total?link(page+1,'Next →'):''}<span>25 products per page</span></nav>`;
}
module.exports=function paginate(file,html,save){
 const rows=html.match(/<article class="product-card"[\s\S]*?<\/article>|<tr class="inventory-row"[\s\S]*?<\/tr>/g);
 if(!rows||rows.length!==100)throw new Error('Expected 100 source records');
 const total=Math.ceil(rows.length/PAGE_SIZE);
 const payload=JSON.stringify(rows).replace(/</g,'\\u003c');
 for(let page=1;page<=total;page++){
  let output=html.replace(rows.join(''),rows.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE).join(''));
  output=output.replace('id="products"',`id="products" data-page="${page}"`);
  output=output.replace('>100 products</span>',`>Showing ${(page-1)*PAGE_SIZE+1}–${page*PAGE_SIZE} of 100 products</span>`);
  output=output.replace('<details class="care-note">',navigation(page,total)+'<details class="care-note">');
  output=output.replace('</body>',`<script id="catalog-rows" type="application/json">${payload}</script></body>`);
  output=output.replace('</title>',` — Page ${page} of ${total}</title>`);
  save(file.replace('index.html',pageFile(page)),output);
 }
};

(() => {
  const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??fallback;}catch{return fallback;}};
  const accountData=read('xox_accounts',[]),listingData=read('xox_listings',[]),current=read('xox_user',null),accounts=Array.isArray(accountData)?accountData:[],listings=Array.isArray(listingData)?listingData:[];
  // Для сопоставления владельца нужны только id, имя и email. Личные поля и
  // старые хеши паролей намеренно не включаются в файл переноса.
  const sanitize=account=>({id:String(account.id||''),name:account.name||'',email:String(account.email||'').toLowerCase()});
  const profiles=accounts.map(sanitize);if(current&&!profiles.some(profile=>profile.email===String(current.email||'').toLowerCase()))profiles.push(sanitize(current));
  const findOwner=item=>profiles.find(profile=>profile.email&&profile.email===String(item.owner?.email||'').toLowerCase())||profiles.find(profile=>profile.id&&profile.id===String(item.owner?.id||''))||profiles.find(profile=>profile.name&&profile.name===item.owner?.name);
  const exported=listings.map(item=>{const owner=findOwner(item),ownerEmail=String(item.owner?.email||owner?.email||'').toLowerCase();return{...item,legacyOwnerEmail:ownerEmail,owner:{id:String(item.owner?.id||owner?.id||''),name:item.owner?.name||owner?.name||'',email:ownerEmail}};});
  const payload={schema:'xox-local-migration',version:1,exportedAt:new Date().toISOString(),source:location.origin,profiles,listings:exported},status=document.querySelector('#exportStatus'),stats=document.querySelector('#exportStats'),button=document.querySelector('#downloadMigration');
  stats.innerHTML=`<div><b>${profiles.length}</b><span>профилей</span></div><div><b>${exported.length}</b><span>объявлений</span></div>`;status.textContent=exported.length?'Локальные объявления найдены и готовы к экспорту.':'В этом браузере старые объявления не найдены.';button.disabled=!exported.length;
  button.addEventListener('click',()=>{const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`xox-migration-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),1000);});
})();

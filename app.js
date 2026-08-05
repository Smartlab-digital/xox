const listings = [
  {id:1,title:'Винтажный проигрыватель',type:'Обмен',kind:'Вещи',price:'на технику',image:'assets/listings/record-player.jpg',credit:'Dragon White Munthe',photoUrl:'https://unsplash.com/photos/5dlDOSyMJQM',city:'Москва',likes:38,views:412,owner:'Антон',rating:'4.9',description:'Рабочий проигрыватель «Вега» с тёплым аналоговым звуком. Бережное хранение, игла заменена год назад. Обменяю на фототехнику, небольшую акустику или интересные пластинки.',tags:['музыка','винтаж','техника'],condition:'Хорошее',published:'Сегодня, 10:42'},
  {id:2,title:'Складной велосипед',type:'Продажа · Обмен',kind:'Вещи',price:'24 000 ₽',image:'assets/listings/bicycle.jpg',credit:'Andreas Haimerl',photoUrl:'https://unsplash.com/photos/_cv8iKu2ONM',city:'Санкт-Петербург',likes:71,views:886,owner:'Мария',rating:'5.0',description:'Лёгкий городской велосипед, удобно хранить дома и брать в электричку. Полное ТО в мае, новые тормозные колодки.',tags:['велосипед','город','спорт'],condition:'Отличное',published:'Вчера, 18:20'},
  {id:3,title:'Сессия портретной съёмки',type:'Услуга',kind:'Услуги',price:'от 3 500 ₽',image:'assets/listings/photography.jpg',credit:'Vitaly Gariev',photoUrl:'https://unsplash.com/photos/KqLXJuAfEJI',city:'Москва',likes:53,views:367,owner:'Лена',rating:'4.8',description:'Часовая прогулочная фотосессия, помощь с образом и 30 фотографий в авторской обработке.',tags:['фото','портрет','творчество'],condition:'1 час',published:'2 дня назад'},
  {id:4,title:'Кресло для чтения',type:'Отдам даром',kind:'Вещи',price:'Бесплатно',image:'assets/listings/armchair.jpg',credit:'Tuaans',photoUrl:'https://unsplash.com/photos/ikyvN2DS0fA',city:'Казань',likes:124,views:1209,owner:'Илья',rating:'4.7',description:'Уютное кресло середины прошлого века. Обивка чистая, деревянные ножки требуют лёгкой реставрации. Только самовывоз.',tags:['мебель','винтаж','даром'],condition:'Есть следы жизни',published:'3 дня назад'},
  {id:5,title:'Курс керамики',type:'Услуга · Обмен',kind:'Услуги',price:'2 часа',image:'assets/listings/pottery.jpg',credit:'Yasin Onuş',photoUrl:'https://unsplash.com/photos/6XQqWYpD7tg',city:'Москва',likes:19,views:214,owner:'Ольга',rating:'5.0',description:'Познакомлю с ручной лепкой и глазуровкой. Все материалы и обжиг включены. Можно обменять на помощь с сайтом.',tags:['керамика','обучение','хобби'],condition:'2 занятия',published:'4 дня назад'},
  {id:6,title:'Настольная лампа',type:'Обмен',kind:'Вещи',price:'на книги',image:'assets/listings/lamp.jpg',credit:'Bimbingan Islam',photoUrl:'https://unsplash.com/photos/ic8Ze1OhEcA',city:'Пермь',likes:32,views:291,owner:'Артём',rating:'4.6',description:'Яркая металлическая лампа в стиле 70-х. Исправна, провод новый. Ищу книги по архитектуре и дизайну.',tags:['свет','дом','дизайн'],condition:'Хорошее',published:'5 дней назад'},
  {id:7,title:'Швейная машинка',type:'Продажа',kind:'Вещи',price:'8 500 ₽',image:'assets/listings/sewing.jpg',credit:'Vitaly Gariev',photoUrl:'https://unsplash.com/photos/ALpGe_m9eXE',city:'Екатеринбург',likes:47,views:633,owner:'Нина',rating:'4.9',description:'Надёжная машинка для дома, шьёт плотные ткани. В комплекте педаль, чехол и набор лапок.',tags:['шитьё','техника','хобби'],condition:'Отличное',published:'Неделю назад'},
  {id:8,title:'Помощь с садом',type:'Услуга',kind:'Услуги',price:'1 000 ₽ / час',image:'assets/listings/garden.jpg',credit:'Jael Rodriguez',photoUrl:'https://unsplash.com/photos/hp6vX7SvrCs',city:'Новосибирск',likes:15,views:178,owner:'Павел',rating:'4.8',description:'Помогу подготовить сад к сезону: обрезка, посадка, уход. Есть свой инструмент и автомобиль.',tags:['сад','помощь','растения'],condition:'По договорённости',published:'Неделю назад'}
];

const safeText = value => String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const safeListingImage = value => typeof value==='string'&&(/^(data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+|assets\/listings\/[A-Za-z0-9._-]+|uploads\/listings\/[A-Za-z0-9._-]+)$/.test(value));
const safeAvatarImage=value=>typeof value==='string'&&/^(data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+|uploads\/avatars\/[A-Za-z0-9._-]+)$/.test(value)?value:'';
const cityCoordinates={Москва:[55.7558,37.6173],'Санкт-Петербург':[59.9343,30.3351],Казань:[55.7961,49.1064],Пермь:[58.0105,56.2502],Екатеринбург:[56.8389,60.6057],Новосибирск:[55.0084,82.9357]};
const listingCoordinates=item=>cityCoordinates[item.city]||null;
const mapEmbedUrl=item=>{const point=listingCoordinates(item);if(!point)return 'https://www.openstreetmap.org/export/embed.html?bbox=19.6%2C41.1%2C180%2C81.9&layer=mapnik';const [lat,lon]=point,delta=.09,bbox=[lon-delta,lat-delta,lon+delta,lat+delta].join(',');return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lon}`;};
const mapOpenUrl=item=>{const point=listingCoordinates(item);if(item.address||!point)return `https://www.openstreetmap.org/search?query=${encodeURIComponent([item.country,item.city,item.address].filter(Boolean).join(', '))}`;const [lat,lon]=point;return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`;};
const readStoredListings = () => { try { const stored=JSON.parse(localStorage.getItem('xox_listings') || '[]');return Array.isArray(stored)?stored:[]; } catch { return []; } };
const normalizeStoredListing = item => {
  const operations=Array.isArray(item.operations)?item.operations:[];
  const cameraLike=/фото|камер|instax|fujifilm/i.test(`${item.title||''} ${item.category||''}`),fallback=cameraLike?'assets/listings/fujifilm-instax-mini-12-pink.webp':'assets/listings/listing-placeholder.svg';
  const storedImages=(Array.isArray(item.images)?item.images:[item.image]).filter(safeListingImage).slice(0,6),images=storedImages.length?storedImages:[fallback],image=images[0],currentUser=window.XOXAuth?.currentUser(),isOwned=Boolean(item.isOwned||currentUser&&(String(item.owner?.id||'')===String(currentUser.id)||item.owner?.email===currentUser.email||item.owner?.name===currentUser.name)),isService=item.kind==='service',detail=isService?(Array.isArray(item.servicePlace)&&item.servicePlace.length?item.servicePlace.join(' · '):'Не указано'):(item.condition||'Не указано');
  const remote=Boolean(item.serverId||item.__remote),rawId=String(item.serverId||item.id);return {id:remote?`db-${rawId}`:rawId,serverId:remote?rawId:'',title:item.title||'Новое предложение',type:operations.join(' · ')||(isService?'Услуга':'Обмен'),kind:isService?'Услуги':'Вещи',price:item.price?`${Number(item.price).toLocaleString('ru-RU')} ${item.currency||'RUB'}`:(operations.includes('Даром')?'Бесплатно':'Обмен'),image,images,credit:storedImages.length||cameraLike?'Фото владельца':'Фото не загружено',photoUrl:'#',country:item.country||item.owner?.country||'Россия',city:item.city||'Город не указан',address:item.address||item.owner?.address||'',likes:Number(item.likes)||0,views:Number(item.views)||0,owner:item.owner?.name||item.sellerName||'Участник XOX',ownerAvatar:safeAvatarImage(item.owner?.avatar),rating:'Новый',description:item.description||'Описание появится позже.',tags:String(item.keywords||'').split(',').map(tag=>tag.trim()).filter(Boolean),condition:detail,detailLabel:isService?'Место оказания':'Состояние',published:item.updatedAt?'Обновлено только что':'Только что',createdAt:item.updatedAt||item.createdAt||'',status:item.status||'active',isOwned,isFavorite:Boolean(item.isFavorite)};
};
const listingFreshness=item=>Date.parse(item.createdAt)||Number(item.id)||0;
let userListings=readStoredListings().map(normalizeStoredListing).sort((a,b)=>listingFreshness(b)-listingFreshness(a));
let allListings=[...userListings,...listings];
window.XOXCatalog=allListings;
let serverFavoriteIds=new Set();
const readFavoriteStore=()=>{try{const value=JSON.parse(localStorage.getItem('xox_favorites')||'{}');return value&&typeof value==='object'?value:{};}catch{return{};}};
const favoriteUserKey=()=>{const user=window.XOXAuth?.currentUser();return user?String(user.id||user.email):'';};
const favoriteEntries=()=>{const key=favoriteUserKey(),entries=key?readFavoriteStore()[key]:[];return Array.isArray(entries)?entries:[];};
const favoriteIds=()=>new Set([...favoriteEntries().map(item=>String(item.id)),...serverFavoriteIds]);
const isFavorite=id=>favoriteIds().has(String(id));
const favoriteSnapshot=item=>({id:String(item.id),title:item.title,kind:item.kind,type:item.type,price:item.price,city:item.city,image:typeof item.image==='string'&&item.image.startsWith('assets/')?item.image:''});
const filterListings=(items,kind)=>kind==='Все'?items:kind==='Избранное'?items.filter(item=>isFavorite(item.id)):items.filter(item=>item.kind===kind||item.type.includes(kind));

function card(x) {
  const favorite=isFavorite(x.id);return `<a class="listing" href="product.html?id=${encodeURIComponent(x.id)}"><div class="listing-image"><img src="${x.image}" alt="${safeText(x.title)}" loading="lazy"><button class="heart${favorite?' active':''}" type="button" data-favorite-id="${safeText(x.id)}" aria-label="${favorite?'Убрать из избранного':'Добавить в избранное'}" aria-pressed="${favorite}">${favorite?'♥':'♡'}</button></div><span class="tag">${safeText(x.type)}</span><h3>${safeText(x.title)}</h3><div class="listing-meta"><span>${safeText(x.city)} · ♡ ${x.likes}</span><b>${safeText(x.price)}</b></div></a>`;
}

const grid = document.querySelector('#listingGrid');
function render(items) {
  if (!grid) return;
  grid.innerHTML = items.length ? items.map(card).join('') : '<div class="empty-state"><b>Ничего не нашли</b><span>Попробуйте изменить запрос или фильтры</span></div>';
}
const isCatalogPage=Boolean(document.querySelector('.catalog-page'));
let displayedListings=allListings;
render(isCatalogPage?displayedListings:displayedListings.slice(0,4));

document.querySelectorAll('.filters button').forEach(button => button.addEventListener('click', () => {
  document.querySelector('.filters .active')?.classList.remove('active');
  button.classList.add('active');
  const kind = button.dataset.filter || button.textContent.trim();
  const filtered=filterListings(displayedListings,kind);
  render(isCatalogPage?filtered:filtered.slice(0,4));
}));

const search = document.querySelector('#search');
const suggest = document.querySelector('#suggestions');
if (search && suggest) {
  search.addEventListener('input', () => {
    const q = search.value.toLowerCase();
    const hits = allListings.filter(x => `${x.title} ${x.tags.join(' ')}`.toLowerCase().includes(q)).slice(0,4);
    suggest.innerHTML = hits.map(x => `<div data-id="${safeText(x.id)}">${safeText(x.title)} <small>— ${safeText(x.city)}</small></div>`).join('') || '<div>Попробуйте другой запрос</div>';
    suggest.classList.toggle('show', Boolean(q));
  });
  suggest.addEventListener('click', e => { const id = e.target.closest('[data-id]')?.dataset.id; if (id) location.href = `product.html?id=${encodeURIComponent(id)}`; });
}

document.querySelector('#searchButton')?.addEventListener('click', () => {
  const q = search.value.trim();
  location.href = `catalog.html${q ? `?q=${encodeURIComponent(q)}` : ''}`;
});

document.querySelectorAll('.popular button').forEach(button => button.addEventListener('click', () => { location.href = `catalog.html?q=${encodeURIComponent(button.textContent)}`; }));

const updateCatalogCounts=()=>{const countTargets={thingsCount:allListings.filter(item=>item.kind==='Вещи').length,servicesCount:allListings.filter(item=>item.kind==='Услуги').length,exchangesCount:allListings.filter(item=>item.type.includes('Обмен')).length,nearbyCount:allListings.filter(item=>item.city&&item.city!=='Город не указан').length};Object.entries(countTargets).forEach(([id,count])=>{const target=document.querySelector(`#${id}`);if(target)target.textContent=count.toLocaleString('ru-RU');});};
updateCatalogCounts();
const updateFavoriteCount=()=>{const target=document.querySelector('#favoritesCount');if(target)target.textContent=favoriteIds().size.toLocaleString('ru-RU');};
updateFavoriteCount();
const nearbyModal=document.querySelector('#nearbyMapModal');
let nearbyListings=[];
let refreshNearbyMap=()=>{};
if(nearbyModal){
  const frame=nearbyModal.querySelector('#nearbyMapFrame'),openLink=nearbyModal.querySelector('#nearbyMapOpen'),list=nearbyModal.querySelector('#nearbyMapList');
  const showNearbyLocation=item=>{frame.src=mapEmbedUrl(item);openLink.href=mapOpenUrl(item);list.querySelector('.active')?.classList.remove('active');list.querySelector(`[data-map-id="${CSS.escape(String(item.id))}"]`)?.classList.add('active');};
  refreshNearbyMap=()=>{nearbyListings=allListings.filter(item=>item.city&&item.city!=='Город не указан');list.innerHTML=nearbyListings.map(item=>`<button type="button" data-map-id="${safeText(item.id)}"><span>${safeText(item.kind==='Услуги'?'✦':'⌘')}</span><b>${safeText(item.title)}</b><small>${safeText(item.address?`${item.city}, ${item.address}`:item.city)} · ${safeText(item.owner)}</small></button>`).join('');};
  refreshNearbyMap();
  list.addEventListener('click',event=>{const button=event.target.closest('[data-map-id]');if(!button)return;const item=nearbyListings.find(listing=>String(listing.id)===button.dataset.mapId);if(item)showNearbyLocation(item);});
  document.querySelector('#openNearbyMap')?.addEventListener('click',()=>{if(nearbyListings.length)showNearbyLocation(nearbyListings[0]);nearbyModal.showModal();});
}

const toast = document.querySelector('#toast');
function notice(text) { if (!toast) return; toast.textContent=text; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }
document.addEventListener('click',async event=>{const button=event.target.closest('[data-favorite-id]');if(!button)return;event.preventDefault();event.stopPropagation();const user=window.XOXAuth?.currentUser();if(!user){window.XOXAuth?.open();return;}const item=allListings.find(listing=>String(listing.id)===button.dataset.favoriteId);if(!item)return;const exists=isFavorite(item.id),next=!exists;if(item.serverId){try{await window.XOXAPI.setFavorite(item.serverId,next);if(next)serverFavoriteIds.add(String(item.id));else serverFavoriteIds.delete(String(item.id));}catch(error){notice(error.message);return;}}else{const store=readFavoriteStore(),key=favoriteUserKey(),entries=Array.isArray(store[key])?store[key]:[];store[key]=exists?entries.filter(entry=>String(entry.id)!==String(item.id)):[favoriteSnapshot(item),...entries];localStorage.setItem('xox_favorites',JSON.stringify(store));}document.querySelectorAll(`[data-favorite-id="${CSS.escape(String(item.id))}"]`).forEach(heart=>{heart.classList.toggle('active',next);heart.textContent=next?'♥':'♡';heart.setAttribute('aria-pressed',String(next));heart.setAttribute('aria-label',next?'Убрать из избранного':'Добавить в избранное');});updateFavoriteCount();const active=document.querySelector('.filters .active')?.dataset.filter||document.querySelector('.filters .active')?.textContent.trim();if(active==='Избранное'){if(isCatalogPage)renderCatalog();else render(filterListings(displayedListings,'Избранное').slice(0,4));}window.dispatchEvent(new CustomEvent('xox:favorites-change'));notice(next?'Добавлено в избранное':'Удалено из избранного');});
document.querySelectorAll('[data-modal="listing"]').forEach(x => x.addEventListener('click', () => { location.href = 'add-listing.html'; }));
document.querySelector('#openChain')?.addEventListener('click', () => document.querySelector('#chainModal')?.showModal());
document.querySelectorAll('dialog .close').forEach(x => x.addEventListener('click', () => x.closest('dialog').close()));
document.querySelectorAll('dialog:not(#authModal):not(#offerModal) form').forEach(x => x.addEventListener('submit', e => { e.preventDefault(); x.closest('dialog').close(); notice('Готово! Заявка сохранена.'); }));

const valueSection = document.querySelector('.value-converter');
if (valueSection) {
  const examples = [
    {rate:'≈ 3 000 ₽',fromIcon:'✦',fromTitle:'Стрижка и укладка',fromMeta:'Профессиональная услуга',fromAmount:'3 часа',toIcon:'✂',toTitle:'Ножницы для мастера',toMeta:'Новая профессиональная вещь',toAmount:'3 000 ₽'},
    {rate:'≈ 4 500 ₽',fromIcon:'◉',fromTitle:'Портретная фотосессия',fromMeta:'Съёмка и обработка фотографий',fromAmount:'1 съёмка',toIcon:'◒',toTitle:'Кресло для чтения',toMeta:'Вещь с новой историей',toAmount:'Обмен'},
    {rate:'≈ 8 000 ₽',fromIcon:'A',fromTitle:'Уроки английского',fromMeta:'Индивидуальные занятия онлайн',fromAmount:'4 занятия',toIcon:'◇',toTitle:'Городской велосипед',toMeta:'Для поездок каждый день',toAmount:'Обмен'}
  ];
  const flow = valueSection.querySelector('#valueFlow');
  const dots = [...valueSection.querySelectorAll('[data-value-example]')];
  let currentExample = 0;
  const fields = ['valueRate','valueFromIcon','valueFromTitle','valueFromMeta','valueFromAmount','valueToIcon','valueToTitle','valueToMeta','valueToAmount'];
  function showValueExample(index) {
    currentExample = (index + examples.length) % examples.length;
    flow.classList.add('is-changing');
    setTimeout(() => {
      const item = examples[currentExample];
      fields.forEach(id => { document.querySelector(`#${id}`).textContent = item[id.replace('value','').replace(/^./, x => x.toLowerCase())]; });
      dots.forEach((dot,i) => dot.classList.toggle('active',i===currentExample));
      flow.classList.remove('is-changing');
    }, 160);
  }
  valueSection.querySelector('#valueSwap').addEventListener('click', () => showValueExample(currentExample + 1));
  dots.forEach(dot => dot.addEventListener('click', () => showValueExample(Number(dot.dataset.valueExample))));
  valueSection.querySelectorAll('[data-value-card]').forEach(card => {
    card.addEventListener('pointermove', event => { const box=card.getBoundingClientRect();card.style.setProperty('--rx',`${(event.clientY-box.top)/box.height*-5+2.5}deg`);card.style.setProperty('--ry',`${(event.clientX-box.left)/box.width*5-2.5}deg`); });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg'); });
  });
  const revealValue = entries => entries.forEach(entry => { if(entry.isIntersecting){entry.target.classList.add('is-visible');valueObserver.disconnect();} });
  const valueObserver = new IntersectionObserver(revealValue,{threshold:.28});
  valueObserver.observe(valueSection);
}

const catalogSearch = document.querySelector('#catalogSearch');
const cityFilter = document.querySelector('#cityFilter');
const sortFilter = document.querySelector('#sortFilter');
function renderCatalog() {
  let items = [...allListings];
  const q = catalogSearch?.value.toLowerCase().trim() || '';
  const active = document.querySelector('.catalog-tabs .active')?.dataset.filter || 'Все';
  if (q) items = items.filter(x => `${x.title} ${x.tags.join(' ')}`.toLowerCase().includes(q));
  if (active !== 'Все') items = filterListings(items,active);
  if (cityFilter?.value) items = items.filter(x => x.city === cityFilter.value);
  if (sortFilter?.value === 'likes') items.sort((a,b) => b.likes-a.likes);
  if (sortFilter?.value === 'price') items.sort((a,b) => parseFloat(a.price.replace(/\s/g,'')) - parseFloat(b.price.replace(/\s/g,'')));
  render(items);
  const count = document.querySelector('#catalogCount');
  if (count) count.textContent = items.length === 1 ? '1 предложение' : `${items.length} предложений`;
}
if (catalogSearch) {
  const catalogParams=new URLSearchParams(location.search),requestedFilter=catalogParams.get('filter');
  catalogSearch.value = catalogParams.get('q') || '';
  if(requestedFilter){const tab=[...document.querySelectorAll('.catalog-tabs button')].find(button=>button.dataset.filter===requestedFilter);if(tab){document.querySelector('.catalog-tabs .active')?.classList.remove('active');tab.classList.add('active');}}
  catalogSearch.addEventListener('input', renderCatalog); cityFilter?.addEventListener('change', renderCatalog); sortFilter?.addEventListener('change', renderCatalog);
  document.querySelectorAll('.catalog-tabs button').forEach(button => button.addEventListener('click', renderCatalog));
  renderCatalog();
}
window.addEventListener('xox:auth-change',()=>{loadServerCatalog();});
window.addEventListener('xox:favorites-change',()=>{document.querySelectorAll('[data-favorite-id]').forEach(heart=>{const favorite=isFavorite(heart.dataset.favoriteId);heart.classList.toggle('active',favorite);heart.textContent=favorite?'♥':'♡';heart.setAttribute('aria-pressed',String(favorite));heart.setAttribute('aria-label',favorite?'Убрать из избранного':'Добавить в избранное');});updateFavoriteCount();const active=document.querySelector('.filters .active')?.dataset.filter||document.querySelector('.filters .active')?.textContent.trim();if(active==='Избранное'){if(isCatalogPage)renderCatalog();else render(filterListings(displayedListings,'Избранное').slice(0,4));}});

const productRoot = document.querySelector('#productRoot');
function renderProductPage() {
  if (!productRoot) return;
  const requestedId=new URLSearchParams(location.search).get('id');
  const item = allListings.find(x => String(x.id) === requestedId) || allListings[0];
  const productImages=Array.isArray(item.images)&&item.images.length?item.images:[item.image];
  const productMapEmbed=mapEmbedUrl(item),productMapOpen=mapOpenUrl(item),productLocation=item.address?`${item.city}, ${item.address}`:item.city;
  document.title = `${item.title} — XOX`;
  productRoot.innerHTML = `<nav class="breadcrumbs"><a href="index.html">Главная</a><span>→</span><a href="catalog.html">Каталог</a><span>→</span><span>${safeText(item.title)}</span></nav><div class="product-layout"><section class="product-gallery"><div class="product-main-art"><img id="productMainImage" src="${productImages[0]}" alt="${safeText(item.title)}"><button class="product-heart">♡ ${item.likes}</button><div class="photo-count">▧ ${item.credit==='Фото не загружено'?'нет фото':`${productImages.length} фото`}</div></div>${productImages.length>1?`<div class="product-thumbnails">${productImages.map((src,index)=>`<button class="${index===0?'active':''}" type="button"><img src="${src}" alt="Фотография ${index+1}"></button>`).join('')}</div>`:''}<div class="product-mini-note"><span>Проверенное объявление <b>✓</b></span><span>${safeText(item.credit)}</span></div></section><section class="product-info"><span class="tag">${safeText(item.type)}</span><h1>${safeText(item.title)}</h1><div class="product-location">⌖ ${safeText(item.city)} · ${safeText(item.published)} · ${item.views} просмотров</div><div class="product-price">${safeText(item.price)}</div><div class="product-actions">${item.isOwned?`<a class="primary-action edit-own-listing" href="edit-listing.html?id=${encodeURIComponent(item.id)}">Редактировать <span>✎</span></a>`:`<button class="primary-action" data-offer>Предложить обмен <span>↔</span></button><button class="secondary-action" data-contact>Написать продавцу</button>`}</div><div class="safe-note">${item.isOwned?'✓ Это ваше объявление — изменения доступны только вам':'🛡 Договаривайтесь и подтверждайте обмен внутри XOX'}</div></section></div><div class="product-below"><article class="description-card"><h2>О предложении</h2><p>${safeText(item.description)}</p><dl><div><dt>${safeText(item.detailLabel||'Состояние')}</dt><dd>${safeText(item.condition)}</dd></div><div><dt>Категория</dt><dd>${safeText(item.kind)}</dd></div><div><dt>Метки</dt><dd>${item.tags.map(t=>`<a href="catalog.html?q=${encodeURIComponent(t)}">#${safeText(t)}</a>`).join(' ')||'—'}</dd></div></dl></article><div class="product-sidebar"><aside class="seller-card"><div class="seller-avatar">${item.ownerAvatar?`<img src="${item.ownerAvatar}" alt="Аватар ${safeText(item.owner)}">`:safeText(item.owner[0])}</div><div><small>Владелец</small><h3>${safeText(item.owner)}</h3><span>★ ${safeText(item.rating)} · отвечает быстро</span></div><a href="catalog.html">Все предложения →</a></aside><aside class="product-map-card"><iframe src="${productMapEmbed}" title="Карта: ${safeText(productLocation)}" loading="lazy"></iframe><div><span>⌖ ${safeText(productLocation)}</span><a href="${productMapOpen}" target="_blank" rel="noopener">Открыть карту ↗</a></div></aside></div></div><section class="similar"><div class="section-head"><h2>Похожие предложения</h2><a href="catalog.html">Весь каталог →</a></div><div class="listing-grid">${allListings.filter(x=>String(x.id)!==String(item.id)).slice(0,4).map(card).join('')}</div></section>`;
  productRoot.querySelector('[data-offer]')?.addEventListener('click', () => {const user=window.XOXAuth?.currentUser();if(!user)return window.XOXAuth?.open();const modal=document.querySelector('#offerModal'),select=document.querySelector('#offerListingSelect'),message=document.querySelector('#offerMessage'),addLink=document.querySelector('#offerAddListing'),submit=document.querySelector('.offer-submit'),myListings=userListings.filter(listing=>listing.isOwned&&listing.status!=='archive'&&listing.serverId);select.innerHTML=myListings.length?`<option value="">Выберите из своих предложений</option>${myListings.map(listing=>`<option value="${safeText(listing.serverId)}">${safeText(listing.title)} · ${safeText(listing.kind)}</option>`).join('')}`:'<option value="">Нет активных предложений</option>';select.disabled=!myListings.length;submit.disabled=!myListings.length;addLink.hidden=Boolean(myListings.length);message.textContent=myListings.length?'':'Сначала добавьте вещь или услугу, которую хотите предложить.';modal.showModal();});
  productRoot.querySelector('[data-contact]')?.addEventListener('click', () => notice('Чат с продавцом откроется после входа.'));
  productRoot.querySelectorAll('.product-thumbnails button').forEach(button=>button.addEventListener('click',()=>{productRoot.querySelector('#productMainImage').src=button.querySelector('img').src;productRoot.querySelector('.product-thumbnails .active')?.classList.remove('active');button.classList.add('active');}));
  const offerForm=document.querySelector('#offerForm');if(offerForm)offerForm.onsubmit=async event=>{event.preventDefault();const select=document.querySelector('#offerListingSelect'),message=document.querySelector('#offerMessage');if(!select.value){message.textContent='Выберите своё предложение из списка.';return;}if(!item.serverId){message.textContent='Обмен доступен для объявлений участников XOX.';return;}const offered=select.options[select.selectedIndex].textContent;try{await window.XOXAPI.offerExchange({fromListingId:select.value,toListingId:item.serverId,message:event.currentTarget.elements.message.value});document.querySelector('#offerModal').close();event.currentTarget.reset();notice(`Предложение «${offered}» отправлено владельцу.`);}catch(error){message.textContent=error.message;}};
}
renderProductPage();

let catalogLoading=false;
async function loadServerCatalog(){
  if(catalogLoading||!window.XOXAPI)return;
  catalogLoading=true;
  try{
    await window.XOXAPI.ready;
    const remote=await window.XOXAPI.listings('public');
    const normalized=remote.map(item=>normalizeStoredListing({...item,__remote:true}));
    userListings=normalized.filter(item=>item.isOwned).sort((a,b)=>listingFreshness(b)-listingFreshness(a));
    allListings=[...normalized,...listings];
    displayedListings=allListings;
    serverFavoriteIds=new Set(normalized.filter(item=>item.isFavorite).map(item=>String(item.id)));
    window.XOXCatalog=allListings;
    updateCatalogCounts();
    updateFavoriteCount();
    refreshNearbyMap();
    if(isCatalogPage)renderCatalog();else render(displayedListings.slice(0,4));
    renderProductPage();
  }catch(error){
    console.warn('Не удалось загрузить общий каталог:',error.message);
  }finally{
    catalogLoading=false;
  }
}
loadServerCatalog();

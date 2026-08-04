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
const safeListingImage = value => typeof value==='string'&&(/^(data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+|assets\/listings\/[A-Za-z0-9._-]+)$/.test(value));
const readStoredListings = () => { try { const stored=JSON.parse(localStorage.getItem('xox_listings') || '[]');return Array.isArray(stored)?stored:[]; } catch { return []; } };
const normalizeStoredListing = item => {
  const operations=Array.isArray(item.operations)?item.operations:[];
  const cameraLike=/фото|камер|instax|fujifilm/i.test(`${item.title||''} ${item.category||''}`),fallback=cameraLike?'assets/listings/fujifilm-instax-mini-12-pink.webp':'assets/listings/listing-placeholder.svg';
  const image=safeListingImage(item.image)?item.image:fallback,currentUser=window.XOXAuth?.currentUser(),isOwned=Boolean(currentUser&&(String(item.owner?.id||'')===String(currentUser.id)||item.owner?.email===currentUser.email||item.owner?.name===currentUser.name));
  return {id:String(item.id),title:item.title||'Новое предложение',type:operations.join(' · ')||(item.kind==='service'?'Услуга':'Обмен'),kind:item.kind==='service'?'Услуги':'Вещи',price:item.price?`${Number(item.price).toLocaleString('ru-RU')} ${item.currency||'RUB'}`:(operations.includes('Даром')?'Бесплатно':'Обмен'),image,credit:item.image||cameraLike?'Фото владельца':'Фото не загружено',photoUrl:'#',city:item.city||'Город не указан',likes:Number(item.likes)||0,views:Number(item.views)||0,owner:item.owner?.name||item.sellerName||'Участник XOX',rating:'Новый',description:item.description||'Описание появится позже.',tags:String(item.keywords||'').split(',').map(tag=>tag.trim()).filter(Boolean),condition:item.condition||'Не указано',published:item.updatedAt?'Обновлено только что':'Только что',isOwned};
};
const userListings=readStoredListings().map(normalizeStoredListing).reverse();
const allListings=[...userListings,...listings];

function card(x) {
  return `<a class="listing" href="product.html?id=${encodeURIComponent(x.id)}"><div class="listing-image"><img src="${x.image}" alt="${safeText(x.title)}" loading="lazy"><span class="heart" aria-hidden="true">♡</span></div><span class="tag">${safeText(x.type)}</span><h3>${safeText(x.title)}</h3><div class="listing-meta"><span>${safeText(x.city)} · ♡ ${x.likes}</span><b>${safeText(x.price)}</b></div></a>`;
}

const grid = document.querySelector('#listingGrid');
function render(items) {
  if (!grid) return;
  grid.innerHTML = items.length ? items.map(card).join('') : '<div class="empty-state"><b>Ничего не нашли</b><span>Попробуйте изменить запрос или фильтры</span></div>';
}
const displayedListings=document.querySelector('.catalog-page')?allListings:listings;
render(displayedListings);

document.querySelectorAll('.filters button').forEach(button => button.addEventListener('click', () => {
  document.querySelector('.filters .active')?.classList.remove('active');
  button.classList.add('active');
  const kind = button.dataset.filter || button.textContent.trim();
  if (kind === 'Все') return render(displayedListings);
  render(displayedListings.filter(x => x.kind === kind || x.type.includes(kind)));
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

const toast = document.querySelector('#toast');
function notice(text) { if (!toast) return; toast.textContent=text; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }
document.querySelectorAll('[data-modal="listing"]').forEach(x => x.addEventListener('click', () => { location.href = 'add-listing.html'; }));
document.querySelector('#openChain')?.addEventListener('click', () => document.querySelector('#chainModal')?.showModal());
document.querySelectorAll('dialog .close').forEach(x => x.addEventListener('click', () => x.closest('dialog').close()));
document.querySelectorAll('dialog:not(#authModal) form').forEach(x => x.addEventListener('submit', e => { e.preventDefault(); x.closest('dialog').close(); notice('Готово! Заявка сохранена.'); }));

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
  if (active !== 'Все') items = items.filter(x => x.kind === active || x.type.includes(active));
  if (cityFilter?.value) items = items.filter(x => x.city === cityFilter.value);
  if (sortFilter?.value === 'likes') items.sort((a,b) => b.likes-a.likes);
  if (sortFilter?.value === 'price') items.sort((a,b) => parseFloat(a.price.replace(/\s/g,'')) - parseFloat(b.price.replace(/\s/g,'')));
  render(items);
  const count = document.querySelector('#catalogCount');
  if (count) count.textContent = items.length === 1 ? '1 предложение' : `${items.length} предложений`;
}
if (catalogSearch) {
  catalogSearch.value = new URLSearchParams(location.search).get('q') || '';
  catalogSearch.addEventListener('input', renderCatalog); cityFilter?.addEventListener('change', renderCatalog); sortFilter?.addEventListener('change', renderCatalog);
  document.querySelectorAll('.catalog-tabs button').forEach(button => button.addEventListener('click', renderCatalog));
  renderCatalog();
}

const productRoot = document.querySelector('#productRoot');
if (productRoot) {
  const requestedId=new URLSearchParams(location.search).get('id');
  const item = allListings.find(x => String(x.id) === requestedId) || allListings[0];
  document.title = `${item.title} — XOX`;
  productRoot.innerHTML = `<nav class="breadcrumbs"><a href="index.html">Главная</a><span>→</span><a href="catalog.html">Каталог</a><span>→</span><span>${safeText(item.title)}</span></nav><div class="product-layout"><section class="product-gallery"><div class="product-main-art"><img src="${item.image}" alt="${safeText(item.title)}"><button class="product-heart">♡ ${item.likes}</button><div class="photo-count">▧ ${item.credit==='Фото не загружено'?'нет фото':'1 фото'}</div></div><div class="product-mini-note"><span>Проверенное объявление <b>✓</b></span><span>${safeText(item.credit)}</span></div></section><section class="product-info"><span class="tag">${safeText(item.type)}</span><h1>${safeText(item.title)}</h1><div class="product-location">⌖ ${safeText(item.city)} · ${safeText(item.published)} · ${item.views} просмотров</div><div class="product-price">${safeText(item.price)}</div><div class="product-actions">${item.isOwned?`<a class="primary-action edit-own-listing" href="edit-listing.html?id=${encodeURIComponent(item.id)}">Редактировать <span>✎</span></a>`:`<button class="primary-action" data-offer>Предложить обмен <span>↔</span></button><button class="secondary-action" data-contact>Написать продавцу</button>`}</div><div class="safe-note">${item.isOwned?'✓ Это ваше объявление — изменения доступны только вам':'🛡 Договаривайтесь и подтверждайте обмен внутри XOX'}</div></section></div><div class="product-below"><article class="description-card"><h2>О предложении</h2><p>${safeText(item.description)}</p><dl><div><dt>Состояние</dt><dd>${safeText(item.condition)}</dd></div><div><dt>Категория</dt><dd>${safeText(item.kind)}</dd></div><div><dt>Метки</dt><dd>${item.tags.map(t=>`<a href="catalog.html?q=${encodeURIComponent(t)}">#${safeText(t)}</a>`).join(' ')||'—'}</dd></div></dl></article><aside class="seller-card"><div class="seller-avatar">${safeText(item.owner[0])}</div><div><small>Владелец</small><h3>${safeText(item.owner)}</h3><span>★ ${safeText(item.rating)} · отвечает быстро</span></div><a href="#">Все предложения →</a></aside></div><section class="similar"><div class="section-head"><h2>Похожие предложения</h2><a href="catalog.html">Весь каталог →</a></div><div class="listing-grid">${allListings.filter(x=>String(x.id)!==String(item.id)).slice(0,4).map(card).join('')}</div></section>`;
  productRoot.querySelector('[data-offer]')?.addEventListener('click', () => document.querySelector('#offerModal').showModal());
  productRoot.querySelector('[data-contact]')?.addEventListener('click', () => notice('Чат с продавцом откроется после входа.'));
  window.addEventListener('xox:auth-change',()=>location.reload(),{once:true});
}

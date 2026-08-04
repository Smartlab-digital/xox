const listings=[
 {title:'Винтажный проигрыватель',type:'Обмен',price:'на технику',art:'♫',bg:'#e6c6ae',city:'Москва',likes:'38'},
 {title:'Складной велосипед',type:'Продажа · обмен',price:'24 000 ₽',art:'🚲',bg:'#c7dcb1',city:'Санкт-Петербург',likes:'71'},
 {title:'Сессия портретной съёмки',type:'Услуга',price:'от 3 500 ₽',art:'◉',bg:'#d9c7ec',city:'Москва',likes:'53'},
 {title:'Кресло для чтения',type:'Отдам даром',price:'Бесплатно',art:'⌑',bg:'#e8bc8c',city:'Казань',likes:'124'},
 {title:'Курс керамики',type:'Услуга · обмен',price:'2 часа',art:'◒',bg:'#a8d7d3',city:'Москва',likes:'19'},
 {title:'Настольная лампа',type:'Обмен',price:'на книги',art:'◉',bg:'#f3d95e',city:'Пермь',likes:'32'},
 {title:'Швейная машинка',type:'Продажа',price:'8 500 ₽',art:'⚙',bg:'#c2d0ea',city:'Екатеринбург',likes:'47'},
 {title:'Помощь с садом',type:'Услуга',price:'1 000 ₽ / час',art:'✿',bg:'#cbe3b0',city:'Новосибирск',likes:'15'}
];
const grid=document.querySelector('#listingGrid');
function render(items){grid.innerHTML=items.map(x=>`<article class="listing"><div class="listing-image" style="background:${x.bg}">${x.art}<i>♡</i></div><span class="tag">${x.type}</span><h3>${x.title}</h3><div class="listing-meta"><span>${x.city} · ♡ ${x.likes}</span><b>${x.price}</b></div></article>`).join('')}
render(listings);
document.querySelectorAll('.filters button').forEach(b=>b.onclick=()=>{document.querySelector('.filters .active').classList.remove('active');b.classList.add('active');const kind=b.textContent;render(kind==='Все'?listings:listings.filter(x=>x.type.includes(kind==='Вещи'?'Обмен':kind==='Услуги'?'Услуга':kind==='Отдам даром'?'Отдам':kind)))});
const search=document.querySelector('#search'),suggest=document.querySelector('#suggestions');
search.oninput=()=>{let q=search.value.toLowerCase();let hits=listings.filter(x=>x.title.toLowerCase().includes(q)).slice(0,4);suggest.innerHTML=hits.map(x=>`<div>${x.title} <small>— ${x.city}</small></div>`).join('')||'<div>Попробуйте другой запрос</div>';suggest.classList.toggle('show',!!q)};
suggest.onclick=e=>{search.value=e.target.textContent.split(' —')[0];suggest.classList.remove('show');document.querySelector('#catalog').scrollIntoView()};
document.querySelector('#searchButton').onclick=()=>{render(listings.filter(x=>x.title.toLowerCase().includes(search.value.toLowerCase())));document.querySelector('#catalog').scrollIntoView()};
const toast=document.querySelector('#toast');function notice(t){toast.textContent=t;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3000)}
document.querySelectorAll('[data-modal]').forEach(x=>x.onclick=()=>document.querySelector('#listingModal').showModal());document.querySelector('#openChain').onclick=()=>document.querySelector('#chainModal').showModal();
document.querySelectorAll('dialog .close').forEach(x=>x.onclick=()=>x.closest('dialog').close());document.querySelectorAll('dialog form').forEach(x=>x.onsubmit=e=>{e.preventDefault();x.closest('dialog').close();notice('Готово! В полноценной версии продолжим оформление.');});


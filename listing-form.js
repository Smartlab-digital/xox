const form = document.querySelector('#listingWizard');
const steps = [...document.querySelectorAll('.form-step')];
const nextButton = document.querySelector('#nextStep');
const backButton = document.querySelector('#backStep');
const progressBar = document.querySelector('#progressBar');
const stepLabel = document.querySelector('#stepLabel');
const errorBox = document.querySelector('#formErrors');
let currentStep = 1;
let registrationRequired = false;
let listingPhotos = [];
const listingFields = ['kind','title','country','city','category','condition','price','currency','unit','description','keywords','wanted','status','sellerType','sellerName','phone','email','website'];

const savedDraft = JSON.parse(localStorage.getItem('xox_listing_draft') || '{}');
Object.entries(savedDraft).forEach(([name,value]) => {
  if(name==='operations' && Array.isArray(value)) return form.querySelectorAll('input[name="operations"]').forEach(field=>field.checked=value.includes(field.value));
  if(name==='servicePlace' && Array.isArray(value)) return form.querySelectorAll('input[name="servicePlace"]').forEach(field=>field.checked=value.includes(field.value));
  const field=form.elements[name]; if(field && typeof value==='string') field.value=value;
});

function isAuthorized() { return Boolean(localStorage.getItem('xox_user')); }
function updateAuthStatus() { const user=JSON.parse(localStorage.getItem('xox_user') || 'null'); document.querySelector('#authStatus').textContent=user ? `● ${user.name}` : 'Войти'; }
updateAuthStatus();
function prefillProfileData() { const user=window.XOXAuth?.currentUser();if(!user)return;const values={country:user.country,city:user.city,sellerName:user.name,phone:user.phone,email:user.email};Object.entries(values).forEach(([name,value])=>{const field=form.elements[name];if(field&&value&&!field.value)field.value=value;}); }
prefillProfileData();

function stepFields(step) { return [...steps[step-1].querySelectorAll('input,select,textarea')].filter(x => !x.closest('.hidden')); }
function validateStep() {
  errorBox.textContent='';
  const invalid=stepFields(currentStep).filter(field => !field.checkValidity());
  if(currentStep===1 && form.elements.kind.value==='service' && !form.querySelector('input[name="servicePlace"]:checked')) { errorBox.textContent='Выберите хотя бы одно место оказания услуги.'; return false; }
  if(currentStep===2 && !form.querySelector('input[name="operations"]:checked')) { errorBox.textContent='Выберите хотя бы одну операцию.'; return false; }
  if(invalid.length) { invalid[0].reportValidity(); errorBox.textContent='Проверьте обязательные поля.'; return false; }
  return true;
}

function showStep(number) {
  currentStep=number; steps.forEach(x=>x.classList.toggle('active',Number(x.dataset.step)===number));
  const total=registrationRequired?5:4; progressBar.style.width=`${number/total*100}%`; stepLabel.textContent=`Шаг ${number} из ${total}`;
  backButton.style.visibility=number===1?'hidden':'visible';
  nextButton.textContent=number===5?'Зарегистрироваться и опубликовать':number===4?'Опубликовать':'Продолжить →';
  window.scrollTo({top:0,behavior:'smooth'});
}

function saveDraft() {
  localStorage.setItem('xox_listing_draft',JSON.stringify(serializeListing()));
}

function serializeListing() {
  const formData=new FormData(form); const data={}; listingFields.forEach(key=>{const value=formData.get(key);if(typeof value==='string')data[key]=value;}); data.operations=formData.getAll('operations'); data.servicePlace=formData.getAll('servicePlace'); return data;
}

function escapeHTML(value='') { return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char])); }

function buildPreview() {
  const data=new FormData(form); const kind=data.get('kind')==='service'?'Услуга':'Вещь'; const operations=data.getAll('operations');
  document.querySelector('#listingPreview').innerHTML=`<div class="preview-image" id="previewImageLarge">${listingPhotos[0]?`<img src="${listingPhotos[0]}" alt="Предпросмотр">`:'⌘'}</div><div><span>${escapeHTML(kind)} · ${escapeHTML(operations.join(' · '))}</span><h3>${escapeHTML(data.get('title'))}</h3><b>${data.get('price')?`${Number(data.get('price')).toLocaleString('ru-RU')} ${escapeHTML(data.get('currency'))}`:'Цена не указана'}</b><p>⌖ ${escapeHTML(data.get('city'))} · ${escapeHTML(data.get('category'))}</p><small>${escapeHTML(data.get('description'))}</small></div>`;
}

function publishListing() {
  const data=serializeListing(); if(listingPhotos.length){data.images=[...listingPhotos];data.image=listingPhotos[0];} data.id=Date.now(); data.createdAt=new Date().toISOString(); data.views=0; data.likes=0; data.owner=window.XOXAuth?.currentUser()||JSON.parse(localStorage.getItem('xox_user')); const existing=JSON.parse(localStorage.getItem('xox_listings')||'[]'); existing.push(data); localStorage.setItem('xox_listings',JSON.stringify(existing)); localStorage.removeItem('xox_listing_draft'); form.hidden=true; document.querySelector('#publishSuccess').classList.add('show');
}

nextButton.addEventListener('click',async()=>{
  if(!validateStep()) return; saveDraft();
  if(currentStep<3) return showStep(currentStep+1);
  if(currentStep===3){buildPreview();return showStep(4);}
  if(currentStep===4){if(isAuthorized()) return publishListing(); registrationRequired=true; const data=new FormData(form); form.elements.regCountry.value=data.get('country');form.elements.regCity.value=data.get('city');form.elements.fullName.value=data.get('sellerName');form.elements.regPhone.value=data.get('phone');form.elements.regEmail.value=data.get('email');form.elements.regWebsite.value=data.get('website');return showStep(5);}
  if(currentStep===5){const data=new FormData(form);try{if(window.XOXAuth){await window.XOXAuth.registerAccount({name:data.get('fullName'),email:data.get('regEmail'),phone:data.get('regPhone'),country:data.get('regCountry'),city:data.get('regCity'),password:data.get('password')});}else{localStorage.setItem('xox_user',JSON.stringify({id:Date.now(),name:data.get('fullName'),email:data.get('regEmail'),phone:data.get('regPhone'),country:data.get('regCountry'),city:data.get('regCity')}));}updateAuthStatus();publishListing();}catch(error){errorBox.textContent=error.message;}}
});
backButton.addEventListener('click',()=>showStep(Math.max(1,currentStep-1)));
form.addEventListener('input',saveDraft);
function updateListingType(){const service=form.elements.kind.value==='service';document.querySelector('.service-unit').classList.toggle('hidden',!service);document.querySelector('.service-place').classList.toggle('hidden',!service);document.querySelector('.item-condition').classList.toggle('hidden',service);document.querySelector('#descriptionInput').placeholder=service?'Расскажите о своей услуге, её особенностях, месте проведения или процессе оказания услуги.':'Расскажите о состоянии, особенностях и истории вещи';}
form.querySelectorAll('input[name="kind"]').forEach(input=>input.addEventListener('change',updateListingType));
function optimizePhoto(file) { return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const image=new Image();image.onerror=reject;image.onload=()=>{const max=720,scale=Math.min(1,max/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.66));};image.src=reader.result;};reader.readAsDataURL(file);}); }
function renderPhotoPreview(){const preview=document.querySelector('#photoPreview');preview.innerHTML=listingPhotos.length?`<div class="photo-preview-grid">${listingPhotos.map((src,index)=>`<img src="${src}" alt="Фотография ${index+1}">`).join('')}</div><b>${listingPhotos.length} из 6</b><small>Нажмите, чтобы добавить ещё</small>`:'＋ <b>Добавить фотографии</b><small>До 6 файлов JPG, PNG или WebP</small>';}
document.querySelector('#photoInput').addEventListener('change',async event=>{const files=[...event.target.files].slice(0,6-listingPhotos.length);if(!files.length)return;if(files.some(file=>file.size>10*1024*1024)){errorBox.textContent='Каждая фотография должна быть меньше 10 МБ.';event.target.value='';return;}try{for(const file of files)listingPhotos.push(await optimizePhoto(file));renderPhotoPreview();errorBox.textContent=listingPhotos.length===6?'Добавлено максимальное количество фотографий.':'';}catch{errorBox.textContent='Не удалось обработать одну из фотографий.';}event.target.value='';});
updateListingType();
showStep(1);

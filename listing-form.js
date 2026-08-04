const form = document.querySelector('#listingWizard');
const steps = [...document.querySelectorAll('.form-step')];
const nextButton = document.querySelector('#nextStep');
const backButton = document.querySelector('#backStep');
const progressBar = document.querySelector('#progressBar');
const stepLabel = document.querySelector('#stepLabel');
const errorBox = document.querySelector('#formErrors');
let currentStep = 1;
let registrationRequired = false;
const listingFields = ['kind','title','country','city','category','condition','price','currency','unit','description','keywords','wanted','status','sellerType','sellerName','phone','email','website'];

const savedDraft = JSON.parse(localStorage.getItem('xox_listing_draft') || '{}');
Object.entries(savedDraft).forEach(([name,value]) => {
  if(name==='operations' && Array.isArray(value)) return form.querySelectorAll('input[name="operations"]').forEach(field=>field.checked=value.includes(field.value));
  const field=form.elements[name]; if(field && typeof value==='string') field.value=value;
});

function isAuthorized() { return Boolean(localStorage.getItem('xox_user')); }
function updateAuthStatus() { const user=JSON.parse(localStorage.getItem('xox_user') || 'null'); document.querySelector('#authStatus').textContent=user ? `● ${user.name}` : 'Войти'; }
updateAuthStatus();

function stepFields(step) { return [...steps[step-1].querySelectorAll('input,select,textarea')].filter(x => !x.closest('.hidden')); }
function validateStep() {
  errorBox.textContent='';
  const invalid=stepFields(currentStep).filter(field => !field.checkValidity());
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
  const formData=new FormData(form); const data={}; listingFields.forEach(key=>{const value=formData.get(key);if(typeof value==='string')data[key]=value;}); data.operations=formData.getAll('operations'); return data;
}

function escapeHTML(value='') { return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char])); }

function buildPreview() {
  const data=new FormData(form); const kind=data.get('kind')==='service'?'Услуга':'Вещь'; const operations=data.getAll('operations');
  document.querySelector('#listingPreview').innerHTML=`<div class="preview-image" id="previewImageLarge">${document.querySelector('#photoPreview img')?.outerHTML||'⌘'}</div><div><span>${escapeHTML(kind)} · ${escapeHTML(operations.join(' · '))}</span><h3>${escapeHTML(data.get('title'))}</h3><b>${data.get('price')?`${Number(data.get('price')).toLocaleString('ru-RU')} ${escapeHTML(data.get('currency'))}`:'Цена не указана'}</b><p>⌖ ${escapeHTML(data.get('city'))} · ${escapeHTML(data.get('category'))}</p><small>${escapeHTML(data.get('description'))}</small></div>`;
}

function publishListing() {
  const data=serializeListing(); data.id=Date.now(); data.createdAt=new Date().toISOString(); data.views=0; data.likes=0; data.owner=JSON.parse(localStorage.getItem('xox_user')); const existing=JSON.parse(localStorage.getItem('xox_listings')||'[]'); existing.push(data); localStorage.setItem('xox_listings',JSON.stringify(existing)); localStorage.removeItem('xox_listing_draft'); form.hidden=true; document.querySelector('#publishSuccess').classList.add('show');
}

nextButton.addEventListener('click',()=>{
  if(!validateStep()) return; saveDraft();
  if(currentStep<3) return showStep(currentStep+1);
  if(currentStep===3){buildPreview();return showStep(4);}
  if(currentStep===4){if(isAuthorized()) return publishListing(); registrationRequired=true; const data=new FormData(form); form.elements.regCountry.value=data.get('country');form.elements.regCity.value=data.get('city');form.elements.fullName.value=data.get('sellerName');form.elements.regPhone.value=data.get('phone');form.elements.regEmail.value=data.get('email');form.elements.regWebsite.value=data.get('website');return showStep(5);}
  if(currentStep===5){const data=new FormData(form);localStorage.setItem('xox_user',JSON.stringify({id:Date.now(),name:data.get('fullName'),email:data.get('regEmail'),city:data.get('regCity')}));updateAuthStatus();publishListing();}
});
backButton.addEventListener('click',()=>showStep(Math.max(1,currentStep-1)));
form.addEventListener('input',saveDraft);
form.querySelectorAll('input[name="kind"]').forEach(x=>x.addEventListener('change',()=>document.querySelector('.service-unit').classList.toggle('hidden',x.value!=='service'||!x.checked)));
document.querySelector('#photoInput').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>document.querySelector('#photoPreview').innerHTML=`<img src="${reader.result}" alt="Предпросмотр"><b>${file.name}</b>`;reader.readAsDataURL(file);});
showStep(1);

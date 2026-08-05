const editRoot = document.querySelector('#editListingRoot');
const escapeEdit = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const safeEditImage = value => typeof value === 'string' && /^(data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+|uploads\/listings\/[A-Za-z0-9._-]+|assets\/listings\/[A-Za-z0-9._-]+)$/.test(value);
const listingId = (new URLSearchParams(location.search).get('id') || '').replace(/^db-/, '');

function optimizeEditPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const max = 1280, scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', .76));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function emptyState(title, text, action = '<a href="catalog.html">Вернуться в каталог →</a>') {
  editRoot.innerHTML = `<div class="edit-empty"><h1>${escapeEdit(title)}</h1><p>${escapeEdit(text)}</p>${action}</div>`;
}

async function initEditor() {
  await window.XOXAPI.ready;
  const user = window.XOXAuth.currentUser();
  if (!user) {
    emptyState('Сначала войдите', 'Редактировать объявление может только его владелец.', '<button id="editLogin">Войти</button>');
    document.querySelector('#editLogin').addEventListener('click', () => window.XOXAuth.open());
    return;
  }
  let listing;
  try {
    listing = await window.XOXAPI.listing(listingId);
  } catch (error) {
    emptyState('Объявление не найдено', error.message);
    return;
  }
  if (!listing.isOwned) {
    emptyState('Редактирование недоступно', 'Изменять объявление может только его владелец.');
    return;
  }

  const operations = Array.isArray(listing.operations) ? listing.operations : [];
  const servicePlaces = Array.isArray(listing.servicePlace) ? listing.servicePlace : [];
  const isService = listing.kind === 'service';
  const fallbackImage = /фото|камер|instax|fujifilm/i.test(`${listing.title || ''} ${listing.category || ''}`) ? 'assets/listings/fujifilm-instax-mini-12-pink.webp' : 'assets/listings/listing-placeholder.svg';
  let editedPhotos = (Array.isArray(listing.images) ? listing.images : [listing.image]).filter(safeEditImage).slice(0, 6);

  editRoot.innerHTML = `<div class="edit-layout"><aside class="edit-aside"><div class="eyebrow"><i></i> ваше предложение</div><h1>Обновите<br><em>${escapeEdit(listing.title)}</em></h1><p>Изменения появятся в каталоге и карточке сразу после сохранения.</p></aside><section class="edit-card"><form id="editListingForm"><div class="edit-photo"><div id="editPhotoGallery" class="edit-photo-gallery"></div><div><label class="edit-upload">Добавить фотографии<input id="editPhotoInput" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><button type="button" id="removeEditPhoto">Удалить все фото</button><small>До 6 файлов, каждый до 10 МБ</small></div></div><div class="form-grid"><label class="wide">Название*<input name="title" required value="${escapeEdit(listing.title)}"></label><label>Цена<input name="price" type="number" min="0" value="${escapeEdit(listing.price)}"></label><label>Валюта<select name="currency"><option ${listing.currency === 'RUB' ? 'selected' : ''}>RUB</option><option ${listing.currency === 'USD' ? 'selected' : ''}>USD</option><option ${listing.currency === 'EUR' ? 'selected' : ''}>EUR</option></select></label><label>Город*<input name="city" required value="${escapeEdit(listing.city)}"></label><label>Адрес для карты<input name="address" value="${escapeEdit(listing.address)}" placeholder="Улица и дом"></label><label class="wide">Описание*<textarea name="description" rows="7" required>${escapeEdit(listing.description)}</textarea></label><label class="wide">Метки<input name="keywords" value="${escapeEdit(listing.keywords)}" placeholder="камера, фото, техника"><small>Укажите через запятую</small></label>${isService ? `<div class="wide service-place-edit"><span class="field-title">Место оказания услуги*</span><div class="place-grid">${['Удалённо','С выездом','Без выезда'].map(value => `<label><input type="checkbox" name="servicePlace" value="${value}" ${servicePlaces.includes(value) ? 'checked' : ''}><b>${value}</b></label>`).join('')}</div></div>` : `<label>Состояние<select name="condition">${['Отличное','Хорошее','Есть следы использования','Требует ремонта'].map(value => `<option ${listing.condition === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>`}</div><div class="edit-operations"><span>Доступные операции</span>${['Обмен','Продажа','Аренда','Даром','Самовывоз'].map(value => `<label><input type="checkbox" name="operations" value="${value}" ${operations.includes(value) ? 'checked' : ''}><b>${value}</b></label>`).join('')}</div><div id="editMessage" class="auth-message"></div><div class="edit-actions"><a href="product.html?id=${encodeURIComponent(`db-${listing.id}`)}">Отмена</a><button type="submit">Сохранить изменения →</button></div></form></section></div>`;

  const editForm = document.querySelector('#editListingForm');
  const gallery = document.querySelector('#editPhotoGallery');
  const message = document.querySelector('#editMessage');
  const submit = editForm.querySelector('[type="submit"]');

  function renderEditPhotos() {
    gallery.innerHTML = editedPhotos.length ? editedPhotos.map((src, index) => `<figure><img src="${src}" alt="Фотография ${index + 1}"><button type="button" data-remove-photo="${index}" aria-label="Удалить фотографию ${index + 1}">×</button></figure>`).join('') : `<img class="edit-photo-empty" src="${fallbackImage}" alt="Фотография не загружена">`;
    gallery.querySelectorAll('[data-remove-photo]').forEach(button => button.addEventListener('click', () => {
      editedPhotos.splice(Number(button.dataset.removePhoto), 1);
      renderEditPhotos();
    }));
  }
  renderEditPhotos();

  document.querySelector('#editPhotoInput').addEventListener('change', async event => {
    const files = [...event.target.files].slice(0, 6 - editedPhotos.length);
    if (!files.length) return;
    if (files.some(file => file.size > 10 * 1024 * 1024)) {
      message.textContent = 'Каждая фотография должна быть меньше 10 МБ.';
      return;
    }
    try {
      for (const file of files) editedPhotos.push(await optimizeEditPhoto(file));
      renderEditPhotos();
      message.textContent = editedPhotos.length === 6 ? 'Добавлено максимальное количество фотографий.' : '';
    } catch {
      message.textContent = 'Не удалось обработать одну из фотографий.';
    }
    event.target.value = '';
  });
  document.querySelector('#removeEditPhoto').addEventListener('click', () => { editedPhotos = []; renderEditPhotos(); });

  editForm.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(editForm);
    const selectedOperations = data.getAll('operations');
    const places = data.getAll('servicePlace');
    if (!selectedOperations.length) { message.textContent = 'Выберите хотя бы одну операцию.'; return; }
    if (isService && !places.length) { message.textContent = 'Выберите хотя бы одно место оказания услуги.'; return; }
    const updated = {
      ...listing,
      title: data.get('title').trim(), price: data.get('price'), currency: data.get('currency'),
      city: data.get('city').trim(), address: data.get('address').trim(),
      description: data.get('description').trim(), keywords: data.get('keywords').trim(),
      condition: isService ? '' : data.get('condition'), servicePlace: places,
      operations: selectedOperations, images: editedPhotos
    };
    submit.disabled = true;
    message.textContent = 'Сохраняем изменения…';
    try {
      const saved = await window.XOXAPI.updateListing(listing.id, updated);
      location.href = `product.html?id=${encodeURIComponent(`db-${saved.id}`)}&updated=1`;
    } catch (error) {
      message.textContent = error.message;
      submit.disabled = false;
    }
  });
}

initEditor();

(() => {
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const safeImage = value => typeof value === 'string' && (/^(data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+|uploads\/(avatars|listings)\/[A-Za-z0-9._-]+|assets\/listings\/[A-Za-z0-9._-]+)$/.test(value)) ? value : '';
  let currentUserState = null;
  let profileListMode = 'own';

  const emitChange = () => window.dispatchEvent(new CustomEvent('xox:auth-change', {detail: currentUserState}));
  const fileToAvatar = file => new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (file.size > 8 * 1024 * 1024) return reject(new Error('Аватар должен быть меньше 8 МБ.'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать изображение.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Не удалось обработать изображение.'));
      image.onload = () => {
        const size = 256, canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const context = canvas.getContext('2d');
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale, height = image.height * scale;
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL('image/jpeg', .78));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  document.body.insertAdjacentHTML('beforeend', `<dialog id="authModal" class="auth-modal">
    <button type="button" class="auth-close" data-auth-close aria-label="Закрыть">×</button>
    <div class="auth-mark">XOX</div><h2>Добро пожаловать</h2><p class="auth-lead">Войдите, чтобы добавлять вещи, сохранять обмены и общаться с участниками.</p>
    <div class="auth-tabs"><button type="button" class="active" data-auth-mode="login">Войти</button><button type="button" data-auth-mode="register">Регистрация</button></div>
    <form id="authLogin" class="auth-form"><label>Email<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label><label>Пароль<input name="password" type="password" autocomplete="current-password" required></label><div class="auth-captcha"><div><small>Проверка, что вы человек</small><b data-captcha-question>Загрузка…</b></div><button type="button" data-captcha-refresh aria-label="Обновить CAPTCHA">↻</button></div><label>Ответ CAPTCHA<input name="captcha" inputmode="numeric" required autocomplete="off"></label><div class="auth-message" role="status"></div><button type="submit" class="auth-submit">Войти →</button></form>
    <form id="authRegister" class="auth-form" hidden><label>Имя*<input name="name" required autocomplete="name"></label><div class="auth-grid"><label>Страна*<select name="country" required autocomplete="country-name"><option value="">Выберите</option><option>Россия</option><option>Беларусь</option><option>Казахстан</option></select></label><label>Город*<input name="city" required autocomplete="address-level2"></label></div><label>Email*<input name="email" type="email" required autocomplete="email"></label><label>Телефон<input name="phone" type="tel" autocomplete="tel"></label><label>Адрес для карты<input name="address" autocomplete="street-address" placeholder="Необязательно"></label><label class="auth-avatar-upload">Аватар<input name="avatar" type="file" accept="image/jpeg,image/png,image/webp"><span>＋ Загрузить фотографию</span></label><div class="auth-grid"><label>Пароль*<input name="password" type="password" minlength="8" required autocomplete="new-password"></label><label>Повторите пароль*<input name="confirm" type="password" minlength="8" required autocomplete="new-password"></label></div><div class="auth-captcha"><div><small>Проверка, что вы человек</small><b data-captcha-question>Загрузка…</b></div><button type="button" data-captcha-refresh aria-label="Обновить CAPTCHA">↻</button></div><label>Ответ CAPTCHA<input name="captcha" inputmode="numeric" required autocomplete="off"></label><div class="auth-message" role="status"></div><button type="submit" class="auth-submit">Создать аккаунт →</button></form>
    <div id="authProfile" class="auth-profile" hidden><div class="auth-profile-head"><div class="auth-avatar" data-auth-avatar><img data-auth-avatar-image alt="Аватар"><span data-auth-avatar-letter>Х</span></div><div><small>Личный кабинет</small><h3 data-auth-name></h3><p data-auth-email></p></div></div><div class="auth-profile-actions"><a href="add-listing.html">＋ Добавить</a><button type="button" data-profile-edit>Редактировать данные</button><button type="button" data-auth-logout>Выйти</button></div><form id="authProfileEdit" class="auth-profile-edit" hidden><div class="auth-grid"><label>Имя*<input name="name" required></label><label>Email*<input name="email" type="email" required></label><label>Страна<input name="country"></label><label>Город<input name="city"></label><label>Телефон<input name="phone" type="tel"></label><label>Адрес для карты<input name="address"></label><label>Сайт<input name="website" type="url" placeholder="https://"></label><label>Пол<select name="gender"><option value="">Не указывать</option><option>Мужской</option><option>Женский</option></select></label><label>Возраст<input name="age" type="number" min="14" max="120"></label></div><label>О себе<textarea name="bio" rows="3"></textarea></label><label class="auth-avatar-upload">Новый аватар<input name="avatar" type="file" accept="image/jpeg,image/png,image/webp"><span>Выбрать фотографию</span></label><div class="auth-message" role="status"></div><div class="auth-edit-actions"><button type="button" data-profile-cancel>Отмена</button><button type="submit">Сохранить →</button></div></form><section class="auth-my-listings"><div class="auth-listing-tabs"><button class="active" type="button" data-profile-list="own">Мои объявления</button><button type="button" data-profile-list="favorites">Избранное <span data-profile-favorites-count>0</span></button></div><div data-auth-listings><div class="auth-listings-empty">Загрузка…</div></div></section></div>
  </dialog>`);

  const modal = document.querySelector('#authModal');
  const loginForm = document.querySelector('#authLogin');
  const registerForm = document.querySelector('#authRegister');
  const profile = document.querySelector('#authProfile');
  const profileEdit = document.querySelector('#authProfileEdit');

  const updateButtons = () => {
    document.querySelectorAll('.login,#authStatus').forEach(button => {
      button.textContent = currentUserState ? `● ${currentUserState.name}` : 'Войти';
    });
  };

  const refreshCaptcha = async form => {
    const question = form.querySelector('[data-captcha-question]');
    question.textContent = 'Загрузка…';
    form.elements.captcha.value = '';
    try {
      const result = await window.XOXAPI.captcha();
      question.textContent = result.question;
    } catch (error) {
      question.textContent = 'Недоступно';
      form.querySelector('.auth-message').textContent = error.message;
    }
  };

  const normalizeProfileListing = item => {
    const service = item.kind === 'service';
    const operations = Array.isArray(item.operations) ? item.operations : [];
    const images = Array.isArray(item.images) ? item.images : [item.image];
    const image = images.map(safeImage).find(Boolean) || 'assets/listings/listing-placeholder.svg';
    const price = item.price ? `${Number(item.price).toLocaleString('ru-RU')} ${escapeHTML(item.currency || 'RUB')}` : (operations.includes('Даром') ? 'Бесплатно' : '');
    return {...item, image, typeLabel: service ? 'Услуга' : 'Вещь', operationsLabel: operations.join(' · ') || 'Активно', priceLabel: price};
  };

  const profileListingRow = (raw, mode) => {
    const item = normalizeProfileListing(raw);
    return `<article class="auth-listing-row"><a class="auth-listing-main" href="product.html?id=${encodeURIComponent(`db-${item.id}`)}"><img src="${item.image}" alt="${escapeHTML(item.title)}"><span><small>${item.typeLabel} · ${escapeHTML(item.operationsLabel)}</small><b>${escapeHTML(item.title)}</b>${item.priceLabel ? `<strong>${item.priceLabel}</strong>` : ''}</span></a>${mode === 'own' ? `<a class="auth-listing-edit" href="edit-listing.html?id=${encodeURIComponent(`db-${item.id}`)}" aria-label="Редактировать ${escapeHTML(item.title)}" title="Редактировать">✎</a>` : `<button class="auth-favorite-remove" type="button" data-profile-favorite-remove="${escapeHTML(item.id)}" aria-label="Убрать из избранного" title="Убрать из избранного">♥</button>`}</article>`;
  };

  const renderProfile = async () => {
    if (!currentUserState) return;
    profile.querySelector('[data-auth-name]').textContent = currentUserState.name;
    profile.querySelector('[data-auth-email]').textContent = currentUserState.email;
    const image = profile.querySelector('[data-auth-avatar-image]');
    const letter = profile.querySelector('[data-auth-avatar-letter]');
    if (safeImage(currentUserState.avatar)) {
      image.src = currentUserState.avatar; image.hidden = false; letter.hidden = true;
    } else {
      image.removeAttribute('src'); image.hidden = true; letter.hidden = false;
      letter.textContent = currentUserState.name.charAt(0).toUpperCase();
    }
    profile.querySelectorAll('[data-profile-list]').forEach(button => button.classList.toggle('active', button.dataset.profileList === profileListMode));
    const target = profile.querySelector('[data-auth-listings]');
    target.innerHTML = '<div class="auth-listings-empty">Загрузка…</div>';
    try {
      const [items, favorites] = await Promise.all([
        window.XOXAPI.listings(profileListMode === 'own' ? 'mine' : 'favorites'),
        window.XOXAPI.listings('favorites')
      ]);
      profile.querySelector('[data-profile-favorites-count]').textContent = favorites.length;
      target.innerHTML = items.length ? items.map(item => profileListingRow(item, profileListMode)).join('') : `<div class="auth-listings-empty">${profileListMode === 'own' ? 'Вы ещё ничего не добавили.' : 'В избранном пока ничего нет.'}</div>`;
    } catch (error) {
      target.innerHTML = `<div class="auth-listings-empty">${escapeHTML(error.message)}</div>`;
    }
  };

  const setMode = mode => {
    const isProfile = mode === 'profile' && currentUserState;
    loginForm.hidden = isProfile || mode !== 'login';
    registerForm.hidden = isProfile || mode !== 'register';
    profile.hidden = !isProfile;
    modal.querySelector('.auth-tabs').hidden = Boolean(isProfile);
    modal.querySelectorAll('[data-auth-mode]').forEach(button => button.classList.toggle('active', button.dataset.authMode === mode));
    profileEdit.hidden = true;
    if (isProfile) {
      profileListMode = 'own';
      renderProfile();
    } else {
      refreshCaptcha(mode === 'register' ? registerForm : loginForm);
    }
  };

  const open = () => {
    setMode(currentUserState ? 'profile' : 'login');
    modal.showModal();
  };

  document.querySelectorAll('.login,#authStatus').forEach(button => button.addEventListener('click', open));
  modal.querySelector('[data-auth-close]').addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
  modal.querySelectorAll('[data-auth-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.authMode)));
  modal.querySelectorAll('[data-captcha-refresh]').forEach(button => button.addEventListener('click', () => refreshCaptcha(button.closest('form'))));

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const message = loginForm.querySelector('.auth-message');
    message.textContent = 'Проверяем данные…';
    try {
      currentUserState = await window.XOXAPI.login({
        email: loginForm.elements.email.value.trim(),
        password: loginForm.elements.password.value,
        captcha: loginForm.elements.captcha.value.trim()
      });
      updateButtons(); emitChange(); modal.close(); loginForm.reset();
    } catch (error) {
      message.textContent = error.message;
      refreshCaptcha(loginForm);
    }
  });

  const registerAccount = async data => {
    currentUserState = await window.XOXAPI.register(data);
    updateButtons(); emitChange();
    return currentUserState;
  };

  registerForm.addEventListener('submit', async event => {
    event.preventDefault();
    const message = registerForm.querySelector('.auth-message');
    if (registerForm.elements.password.value !== registerForm.elements.confirm.value) {
      message.textContent = 'Пароли не совпадают.';
      return;
    }
    message.textContent = 'Создаём аккаунт…';
    try {
      const avatar = await fileToAvatar(registerForm.elements.avatar.files[0]);
      await registerAccount({
        name: registerForm.elements.name.value,
        email: registerForm.elements.email.value,
        phone: registerForm.elements.phone.value,
        country: registerForm.elements.country.value,
        city: registerForm.elements.city.value,
        address: registerForm.elements.address.value,
        avatar,
        password: registerForm.elements.password.value,
        captcha: registerForm.elements.captcha.value.trim()
      });
      modal.close(); registerForm.reset();
    } catch (error) {
      message.textContent = error.message;
      refreshCaptcha(registerForm);
    }
  });

  profile.querySelector('[data-profile-edit]').addEventListener('click', () => {
    ['name','email','country','city','phone','address','website','gender','age','bio'].forEach(name => {
      profileEdit.elements[name].value = currentUserState[name] || '';
    });
    profileEdit.hidden = false;
    profileEdit.scrollIntoView({behavior:'smooth', block:'nearest'});
  });
  profile.querySelectorAll('[data-profile-list]').forEach(button => button.addEventListener('click', () => {
    profileListMode = button.dataset.profileList;
    renderProfile();
  }));
  profile.querySelector('[data-auth-listings]').addEventListener('click', async event => {
    const button = event.target.closest('[data-profile-favorite-remove]');
    if (!button) return;
    try {
      await window.XOXAPI.setFavorite(button.dataset.profileFavoriteRemove, false);
      window.dispatchEvent(new CustomEvent('xox:favorites-change'));
      renderProfile();
    } catch (error) {
      button.title = error.message;
    }
  });
  profile.querySelector('[data-profile-cancel]').addEventListener('click', () => { profileEdit.hidden = true; profileEdit.reset(); });
  profileEdit.addEventListener('submit', async event => {
    event.preventDefault();
    const message = profileEdit.querySelector('.auth-message');
    message.textContent = 'Сохраняем…';
    try {
      const selected = profileEdit.elements.avatar.files[0];
      const avatar = selected ? await fileToAvatar(selected) : currentUserState.avatar || '';
      const data = {};
      ['name','email','country','city','phone','address','website','gender','age','bio'].forEach(name => data[name] = profileEdit.elements[name].value);
      data.avatar = avatar;
      currentUserState = await window.XOXAPI.updateProfile(data);
      message.textContent = 'Данные сохранены.';
      updateButtons(); emitChange();
      setTimeout(() => { profileEdit.hidden = true; renderProfile(); }, 500);
    } catch (error) {
      message.textContent = error.message;
    }
  });
  profile.querySelector('[data-auth-logout]').addEventListener('click', async () => {
    try { await window.XOXAPI.logout(); } catch (error) { console.warn(error); }
    currentUserState = null;
    updateButtons(); emitChange(); modal.close();
  });

  window.XOXAPI.ready.then(user => {
    currentUserState = user;
    updateButtons();
    emitChange();
  });

  window.XOXAuth = {currentUser: () => currentUserState, open, registerAccount, fileToAvatar, refreshCaptcha};
})();

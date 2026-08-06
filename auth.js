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
    <form id="authLogin" class="auth-form"><label>Email<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label><label>Пароль<input name="password" type="password" autocomplete="current-password" required></label><button type="button" class="auth-text-button" data-auth-mode="recover">Забыли пароль?</button><div class="auth-captcha"><div><small>Проверка, что вы человек</small><b data-captcha-question>Загрузка…</b></div><button type="button" data-captcha-refresh aria-label="Обновить CAPTCHA">↻</button></div><label>Ответ CAPTCHA<input name="captcha" inputmode="numeric" required autocomplete="off"></label><div class="auth-message" role="status"></div><button type="submit" class="auth-submit">Войти →</button></form>
    <form id="authRegister" class="auth-form auth-register-minimal" hidden><h3 class="auth-form-title">Быстрая регистрация</h3><p class="auth-form-copy">Начните с email. Имя, город и контакты можно добавить позже в личном кабинете.</p><div class="auth-socials" aria-label="Регистрация через социальную сеть"><button type="button" class="auth-social auth-social-max" data-social-provider="max" disabled title="Загрузка настроек…"><b>MAX</b><span>через MAX</span></button><button type="button" class="auth-social auth-social-ok" data-social-provider="ok" disabled title="Загрузка настроек…"><b>OK</b><span>Одноклассники</span></button><button type="button" class="auth-social auth-social-vk" data-social-provider="vk" disabled title="Загрузка настроек…"><b>VK</b><span>через VK</span></button></div><div class="auth-divider"><span>или по почте</span></div><label>Email<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label><div class="auth-captcha"><div><small>Проверка, что вы человек</small><b data-captcha-question>Загрузка…</b></div><button type="button" data-captcha-refresh aria-label="Обновить CAPTCHA">↻</button></div><label>Ответ CAPTCHA<input name="captcha" inputmode="numeric" required autocomplete="off"></label><div class="auth-message" role="status"></div><button type="submit" class="auth-submit">Получить письмо →</button></form>
    <form id="authRecover" class="auth-form" hidden><h3 class="auth-form-title">Восстановление пароля</h3><p class="auth-form-copy">Укажите подтверждённый email — мы отправим ссылку для создания нового пароля.</p><label>Email<input name="email" type="email" autocomplete="email" required></label><div class="auth-captcha"><div><small>Проверка, что вы человек</small><b data-captcha-question>Загрузка…</b></div><button type="button" data-captcha-refresh aria-label="Обновить CAPTCHA">↻</button></div><label>Ответ CAPTCHA<input name="captcha" inputmode="numeric" required autocomplete="off"></label><div class="auth-message" role="status"></div><button type="submit" class="auth-submit">Отправить ссылку →</button><button type="button" class="auth-text-button" data-auth-mode="login">Вернуться ко входу</button></form>
    <form id="authPending" class="auth-form auth-pending" hidden><div class="auth-mail-icon">✉</div><h3 class="auth-form-title">Проверьте почту</h3><p class="auth-form-copy">Мы отправили ссылку активации на <b data-pending-email></b>. Откройте её — после подтверждения вы сразу придумаете пароль.</p><input name="email" type="hidden"><div class="auth-captcha"><div><small>Для повторной отправки</small><b data-captcha-question>Загрузка…</b></div><button type="button" data-captcha-refresh aria-label="Обновить CAPTCHA">↻</button></div><label>Ответ CAPTCHA<input name="captcha" inputmode="numeric" required autocomplete="off"></label><div class="auth-message" role="status"></div><button type="submit" class="auth-submit">Отправить письмо повторно</button><button type="button" class="auth-text-button" data-auth-mode="login">Перейти ко входу</button></form>
    <div id="authProfile" class="auth-profile" hidden><div class="auth-profile-head"><div class="auth-avatar" data-auth-avatar><img data-auth-avatar-image alt="Аватар"><span data-auth-avatar-letter>Х</span></div><div><small>Личный кабинет</small><h3 data-auth-name></h3><p data-auth-email></p></div></div><div class="auth-profile-actions"><a href="add-listing.html">＋ Добавить</a><button type="button" data-profile-edit>Редактировать данные</button><button type="button" data-auth-logout>Выйти</button></div><form id="authProfileEdit" class="auth-profile-edit" hidden><div class="auth-grid"><label>Имя*<input name="name" required></label><label>Email<input name="email" type="email" disabled title="Для смены email обратитесь в поддержку"></label><label>Страна<input name="country"></label><label>Город<input name="city"></label><label>Телефон<input name="phone" type="tel"></label><label>Адрес для карты<input name="address"></label><label>Сайт<input name="website" type="url" placeholder="https://"></label><label>Пол<select name="gender"><option value="">Не указывать</option><option>Мужской</option><option>Женский</option></select></label><label>Возраст<input name="age" type="number" min="14" max="120"></label></div><label>О себе<textarea name="bio" rows="3"></textarea></label><label class="auth-avatar-upload">Новый аватар<input name="avatar" type="file" accept="image/jpeg,image/png,image/webp"><span>Выбрать фотографию</span></label><div class="auth-message" role="status"></div><div class="auth-edit-actions"><button type="button" data-profile-cancel>Отмена</button><button type="submit">Сохранить →</button></div></form><section class="auth-my-listings"><div class="auth-listing-tabs"><button class="active" type="button" data-profile-list="own">Мои объявления</button><button type="button" data-profile-list="favorites">Избранное <span data-profile-favorites-count>0</span></button></div><div data-auth-listings><div class="auth-listings-empty">Загрузка…</div></div></section></div>
  </dialog>`);

  const modal = document.querySelector('#authModal');
  const loginForm = document.querySelector('#authLogin');
  const registerForm = document.querySelector('#authRegister');
  const recoverForm = document.querySelector('#authRecover');
  const pendingForm = document.querySelector('#authPending');
  const profile = document.querySelector('#authProfile');
  const profileEdit = document.querySelector('#authProfileEdit');
  let pendingEmail = '';

  const updateButtons = () => {
    document.querySelectorAll('.login,#authStatus').forEach(button => {
      button.textContent = currentUserState ? `● ${currentUserState.name}` : 'Войти';
    });
    document.querySelectorAll('[data-auth-primary]').forEach(button => {
      button.textContent = currentUserState ? '＋ Разместить' : 'Регистрация';
      button.setAttribute('aria-label', currentUserState ? 'Разместить объявление' : 'Зарегистрироваться');
    });
  };

  const refreshCaptcha = async form => {
    const question = form.querySelector('[data-captcha-question]');
    question.textContent = 'Загрузка…';
    form.dataset.captchaToken = '';
    form.elements.captcha.value = '';
    try {
      const result = await window.XOXAPI.captcha();
      question.textContent = result.question;
      form.dataset.captchaToken = result.token || '';
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
    recoverForm.hidden = isProfile || mode !== 'recover';
    pendingForm.hidden = isProfile || mode !== 'pending';
    profile.hidden = !isProfile;
    modal.querySelector('.auth-tabs').hidden = Boolean(isProfile) || !['login','register'].includes(mode);
    modal.querySelectorAll('[data-auth-mode]').forEach(button => button.classList.toggle('active', button.dataset.authMode === mode));
    profileEdit.hidden = true;
    if (isProfile) {
      profileListMode = 'own';
      renderProfile();
    } else if (mode === 'pending') {
      pendingForm.elements.email.value = pendingEmail;
      pendingForm.querySelector('[data-pending-email]').textContent = pendingEmail;
      refreshCaptcha(pendingForm);
    } else {
      if (mode === 'recover') recoverForm.querySelector('.auth-submit').disabled = false;
      refreshCaptcha(mode === 'register' ? registerForm : mode === 'recover' ? recoverForm : loginForm);
    }
  };

  const open = () => {
    setMode(currentUserState ? 'profile' : 'login');
    modal.showModal();
  };

  const openRegistration = () => {
    if (currentUserState) {
      location.href = 'add-listing.html';
      return;
    }
    setMode('register');
    modal.showModal();
  };

  const openVerification = email => {
    pendingEmail = String(email || pendingEmail);
    setMode('pending');
    if (!modal.open) modal.showModal();
  };

  document.querySelectorAll('.login,#authStatus').forEach(button => button.addEventListener('click', open));
  document.querySelectorAll('[data-auth-primary]').forEach(button => button.addEventListener('click', openRegistration));
  modal.querySelector('[data-auth-close]').addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
  modal.querySelectorAll('[data-auth-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.authMode)));
  modal.querySelectorAll('[data-captcha-refresh]').forEach(button => button.addEventListener('click', () => refreshCaptcha(button.closest('form'))));
  modal.querySelectorAll('[data-social-provider]').forEach(button => button.addEventListener('click', () => {
    const message = registerForm.querySelector('.auth-message');
    if (button.dataset.startUrl) {
      location.href = button.dataset.startUrl;
      return;
    }
    message.textContent = button.title || 'Социальный вход ещё не настроен.';
  }));

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const message = loginForm.querySelector('.auth-message');
    message.textContent = 'Проверяем данные…';
    try {
      currentUserState = await window.XOXAPI.login({
        email: loginForm.elements.email.value.trim(),
        password: loginForm.elements.password.value,
        captcha: loginForm.elements.captcha.value.trim(),
        captchaToken: loginForm.dataset.captchaToken || ''
      });
      updateButtons(); emitChange(); modal.close(); loginForm.reset();
    } catch (error) {
      message.textContent = error.message;
      if (error.code === 'email_unverified') {
        pendingEmail = loginForm.elements.email.value.trim();
        setMode('pending');
        return;
      }
      refreshCaptcha(loginForm);
    }
  });

  const registerAccount = async data => {
    const result = await window.XOXAPI.register(data);
    pendingEmail = result.email || data.email;
    return result;
  };

  registerForm.addEventListener('submit', async event => {
    event.preventDefault();
    const message = registerForm.querySelector('.auth-message');
    message.textContent = 'Отправляем письмо…';
    try {
      const result = await registerAccount({
        email: registerForm.elements.email.value,
        captcha: registerForm.elements.captcha.value.trim(),
        captchaToken: registerForm.dataset.captchaToken || ''
      });
      registerForm.reset();
      pendingEmail = result.email;
      setMode('pending');
    } catch (error) {
      message.textContent = error.message;
      refreshCaptcha(registerForm);
    }
  });

  recoverForm.addEventListener('submit', async event => {
    event.preventDefault();
    const message = recoverForm.querySelector('.auth-message');
    message.textContent = 'Отправляем письмо…';
    try {
      const result = await window.XOXAPI.requestPasswordReset({email: recoverForm.elements.email.value.trim(), captcha: recoverForm.elements.captcha.value.trim(), captchaToken: recoverForm.dataset.captchaToken || ''});
      message.textContent = result.message;
      recoverForm.querySelector('.auth-submit').disabled = true;
    } catch (error) {
      message.textContent = error.message;
      refreshCaptcha(recoverForm);
    }
  });

  pendingForm.addEventListener('submit', async event => {
    event.preventDefault();
    const message = pendingForm.querySelector('.auth-message');
    message.textContent = 'Отправляем письмо…';
    try {
      const result = await window.XOXAPI.requestVerification({email: pendingForm.elements.email.value, captcha: pendingForm.elements.captcha.value.trim(), captchaToken: pendingForm.dataset.captchaToken || ''});
      message.textContent = result.message;
    } catch (error) {
      message.textContent = error.message;
    }
    refreshCaptcha(pendingForm);
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
    window.XOXAPI.authProviders().then(result => {
      (result.providers || []).forEach(provider => {
        const button = registerForm.querySelector(`[data-social-provider="${provider.id}"]`);
        if (!button) return;
        button.disabled = !provider.enabled;
        button.title = provider.enabled ? `Продолжить через ${provider.label}` : provider.message;
        button.dataset.startUrl = provider.enabled ? provider.startUrl : '';
      });
    }).catch(() => {});
  });

  window.XOXAuth = {currentUser: () => currentUserState, open, openRegistration, openVerification, registerAccount, fileToAvatar, refreshCaptcha};
})();

(() => {
  const readJSON = (key,fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  const currentUser = () => { const user=readJSON('xox_user',null);if(!user)return null;const account=readJSON('xox_accounts',[]).find(item=>item.email===user.email);return account?{...user,phone:user.phone||account.phone||'',country:user.country||account.country||'',city:user.city||account.city||'',address:user.address||account.address||''}:user; };
  const emitChange = () => window.dispatchEvent(new CustomEvent('xox:auth-change',{detail:currentUser()}));
  const hashPassword = async password => {
    const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password));
    return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  };
  const registerAccount = async ({name,email,phone='',country='',city='',address='',password}) => {
    const accounts=readJSON('xox_accounts',[]); const normalized=email.trim().toLowerCase();
    if(accounts.some(account=>account.email===normalized)) throw new Error('Аккаунт с таким email уже существует.');
    const account={id:Date.now(),name:name.trim(),email:normalized,phone:phone.trim(),country:country.trim(),city:city.trim(),address:address.trim(),passwordHash:await hashPassword(password)};
    accounts.push(account); localStorage.setItem('xox_accounts',JSON.stringify(accounts));
    const user={id:account.id,name:account.name,email:account.email,phone:account.phone,country:account.country,city:account.city,address:account.address}; localStorage.setItem('xox_user',JSON.stringify(user)); emitChange(); return user;
  };

  document.body.insertAdjacentHTML('beforeend',`<dialog id="authModal" class="auth-modal">
    <button type="button" class="auth-close" data-auth-close aria-label="Закрыть">×</button>
    <div class="auth-mark">XOX</div><h2>Добро пожаловать</h2><p class="auth-lead">Войдите, чтобы добавлять вещи, сохранять обмены и общаться с участниками.</p>
    <div class="auth-tabs"><button type="button" class="active" data-auth-mode="login">Войти</button><button type="button" data-auth-mode="register">Регистрация</button></div>
    <form id="authLogin" class="auth-form">
      <label>Email<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label>
      <label>Пароль<input name="password" type="password" autocomplete="current-password" required></label>
      <div class="auth-captcha"><div><small>Проверка, что вы человек</small><b data-captcha-question></b></div><button type="button" data-captcha-refresh aria-label="Обновить CAPTCHA">↻</button></div>
      <label>Ответ CAPTCHA<input name="captcha" inputmode="numeric" required autocomplete="off"></label>
      <div class="auth-message" role="status"></div><button type="submit" class="auth-submit">Войти →</button>
    </form>
    <form id="authRegister" class="auth-form" hidden>
      <label>Имя*<input name="name" required autocomplete="name"></label><div class="auth-grid"><label>Страна*<select name="country" required autocomplete="country-name"><option value="">Выберите</option><option>Россия</option><option>Беларусь</option><option>Казахстан</option></select></label><label>Город*<input name="city" required autocomplete="address-level2"></label></div>
      <label>Email*<input name="email" type="email" required autocomplete="email"></label><label>Телефон<input name="phone" type="tel" autocomplete="tel"></label><label>Адрес для карты<input name="address" autocomplete="street-address" placeholder="Необязательно"></label>
      <div class="auth-grid"><label>Пароль*<input name="password" type="password" minlength="6" required autocomplete="new-password"></label><label>Повторите пароль*<input name="confirm" type="password" minlength="6" required autocomplete="new-password"></label></div>
      <div class="auth-captcha"><div><small>Проверка, что вы человек</small><b data-captcha-question></b></div><button type="button" data-captcha-refresh aria-label="Обновить CAPTCHA">↻</button></div>
      <label>Ответ CAPTCHA<input name="captcha" inputmode="numeric" required autocomplete="off"></label>
      <div class="auth-message" role="status"></div><button type="submit" class="auth-submit">Создать аккаунт →</button>
    </form>
    <div id="authProfile" class="auth-profile" hidden><div class="auth-avatar" data-auth-avatar>Х</div><small>Вы вошли как</small><h3 data-auth-name></h3><p data-auth-email></p><div><a href="add-listing.html">＋ Добавить вещь</a><button type="button" data-auth-logout>Выйти</button></div></div>
  </dialog>`);

  const modal=document.querySelector('#authModal'),loginForm=document.querySelector('#authLogin'),registerForm=document.querySelector('#authRegister'),profile=document.querySelector('#authProfile');
  const captcha = form => { const a=Math.floor(Math.random()*8)+2,b=Math.floor(Math.random()*8)+2;form.dataset.captcha=String(a+b);form.querySelector('[data-captcha-question]').textContent=`${a} + ${b} = ?`;form.elements.captcha.value=''; };
  const updateButtons = () => { const user=currentUser();document.querySelectorAll('.login,#authStatus').forEach(button=>button.textContent=user?`● ${user.name}`:'Войти'); };
  const setMode = mode => { const user=currentUser(),isProfile=mode==='profile'&&user;loginForm.hidden=isProfile||mode!=='login';registerForm.hidden=isProfile||mode!=='register';profile.hidden=!isProfile;document.querySelector('.auth-tabs').hidden=Boolean(isProfile);document.querySelectorAll('[data-auth-mode]').forEach(button=>button.classList.toggle('active',button.dataset.authMode===mode));if(isProfile){profile.querySelector('[data-auth-name]').textContent=user.name;profile.querySelector('[data-auth-email]').textContent=user.email;profile.querySelector('[data-auth-avatar]').textContent=user.name.charAt(0).toUpperCase();}else captcha(mode==='register'?registerForm:loginForm); };
  const openAuth = () => { setMode(currentUser()?'profile':'login');modal.showModal(); };
  document.querySelectorAll('.login,#authStatus').forEach(button=>button.addEventListener('click',openAuth));
  modal.querySelector('[data-auth-close]').addEventListener('click',()=>modal.close());
  modal.addEventListener('click',event=>{if(event.target===modal)modal.close();});
  modal.querySelectorAll('[data-auth-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.authMode)));
  modal.querySelectorAll('[data-captcha-refresh]').forEach(button=>button.addEventListener('click',()=>captcha(button.closest('form'))));
  loginForm.addEventListener('submit',async event=>{event.preventDefault();const message=loginForm.querySelector('.auth-message');message.textContent='';if(loginForm.elements.captcha.value.trim()!==loginForm.dataset.captcha){message.textContent='Неверный ответ CAPTCHA.';return captcha(loginForm);}const email=loginForm.elements.email.value.trim().toLowerCase(),account=readJSON('xox_accounts',[]).find(item=>item.email===email);if(!account||account.passwordHash!==await hashPassword(loginForm.elements.password.value)){message.textContent='Неверный email или пароль.';return captcha(loginForm);}localStorage.setItem('xox_user',JSON.stringify({id:account.id,name:account.name,email:account.email,phone:account.phone||'',country:account.country||'',city:account.city,address:account.address||''}));updateButtons();emitChange();modal.close();loginForm.reset();});
  registerForm.addEventListener('submit',async event=>{event.preventDefault();const message=registerForm.querySelector('.auth-message');message.textContent='';if(registerForm.elements.captcha.value.trim()!==registerForm.dataset.captcha){message.textContent='Неверный ответ CAPTCHA.';return captcha(registerForm);}if(registerForm.elements.password.value!==registerForm.elements.confirm.value){message.textContent='Пароли не совпадают.';return;}try{await registerAccount({name:registerForm.elements.name.value,email:registerForm.elements.email.value,phone:registerForm.elements.phone.value,country:registerForm.elements.country.value,city:registerForm.elements.city.value,address:registerForm.elements.address.value,password:registerForm.elements.password.value});updateButtons();modal.close();registerForm.reset();}catch(error){message.textContent=error.message;captcha(registerForm);}});
  modal.querySelector('[data-auth-logout]').addEventListener('click',()=>{localStorage.removeItem('xox_user');updateButtons();emitChange();modal.close();});
  updateButtons();
  window.XOXAuth={currentUser,registerAccount,open:openAuth};
})();

(() => {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  const action = params.get('action');
  const token = params.get('token') || '';
  const title = document.querySelector('#accountActionTitle');
  const message = document.querySelector('#accountActionMessage');
  const icon = document.querySelector('#accountActionIcon');
  const form = document.querySelector('#resetPasswordForm');
  const loginButton = document.querySelector('#openLoginAfterAction');
  const backLink = document.querySelector('#backAfterAction');
  let formPurpose = 'reset';
  let nextDestination = '';

  history.replaceState({}, '', 'account-action.html');

  const showError = text => {
    icon.textContent = '×';
    icon.classList.add('error');
    title.textContent = 'Ссылка не сработала';
    message.textContent = text;
    form.hidden = true;
    backLink.hidden = false;
  };

  const showSuccess = (text, buttonText = 'Войти в XOX →', destination = '') => {
    icon.textContent = '✓';
    icon.classList.add('success');
    title.textContent = 'Готово';
    message.textContent = text;
    form.hidden = true;
    loginButton.textContent = buttonText;
    nextDestination = destination;
    loginButton.hidden = false;
  };

  loginButton.addEventListener('click', () => {
    if (nextDestination) location.href = nextDestination;
    else window.XOXAuth.open();
  });

  window.XOXAPI.ready.then(async () => {
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      showError('В ссылке отсутствует корректный токен. Запросите новое письмо.');
      return;
    }
    if (action === 'verify') {
      title.textContent = 'Подтверждаем email…';
      try {
        const result = await window.XOXAPI.verifyEmail(token);
        if (result.requiresPassword) {
          formPurpose = 'complete';
          icon.textContent = '✓';
          icon.classList.add('success');
          title.textContent = 'Придумайте пароль';
          message.textContent = 'Email подтверждён. Остался один шаг — пароль не короче 8 символов.';
          form.hidden = false;
          form.querySelector('.auth-submit').textContent = 'Завершить регистрацию →';
        } else {
          showSuccess('Email подтверждён, вы уже вошли в XOX.', 'Перейти на главную →', 'index.html');
        }
      } catch (error) {
        showError(error.message);
      }
      return;
    }
    if (action === 'reset') {
      icon.textContent = '↺';
      title.textContent = 'Создайте новый пароль';
      message.textContent = 'Пароль должен содержать не менее 8 символов.';
      form.hidden = false;
      return;
    }
    showError('Неизвестное действие. Вернитесь на сайт и запросите новую ссылку.');
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const status = form.querySelector('.auth-message');
    if (form.elements.password.value !== form.elements.confirm.value) {
      status.textContent = 'Пароли не совпадают.';
      return;
    }
    status.textContent = 'Сохраняем новый пароль…';
    try {
      const result = formPurpose === 'complete'
        ? await window.XOXAPI.completeRegistration(form.elements.password.value)
        : await window.XOXAPI.resetPassword(token, form.elements.password.value);
      form.reset();
      if (formPurpose === 'complete') {
        showSuccess(result.message, '＋ Разместить объявление', 'add-listing.html');
      } else {
        showSuccess(result.message);
      }
    } catch (error) {
      status.textContent = error.message;
    }
  });
})();

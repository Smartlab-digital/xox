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

  history.replaceState({}, '', 'account-action.html');

  const showError = text => {
    icon.textContent = '×';
    icon.classList.add('error');
    title.textContent = 'Ссылка не сработала';
    message.textContent = text;
    form.hidden = true;
    backLink.hidden = false;
  };

  const showSuccess = text => {
    icon.textContent = '✓';
    icon.classList.add('success');
    title.textContent = 'Готово';
    message.textContent = text;
    form.hidden = true;
    loginButton.hidden = false;
  };

  loginButton.addEventListener('click', () => window.XOXAuth.open());

  window.XOXAPI.ready.then(async () => {
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      showError('В ссылке отсутствует корректный токен. Запросите новое письмо.');
      return;
    }
    if (action === 'verify') {
      title.textContent = 'Подтверждаем email…';
      try {
        const result = await window.XOXAPI.verifyEmail(token);
        showSuccess(result.message);
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
      const result = await window.XOXAPI.resetPassword(token, form.elements.password.value);
      form.reset();
      showSuccess(result.message);
    } catch (error) {
      status.textContent = error.message;
    }
  });
})();

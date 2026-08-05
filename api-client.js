(() => {
  let csrf = '';
  let user = null;

  if (location.hostname === 'www.xox.ru') {
    location.replace(`http://xox.ru${location.pathname}${location.search}${location.hash}`);
    window.XOXAPI = {ready: new Promise(() => {}), currentUser: () => null};
    return;
  }

  if (location.hostname === 'smartlab-digital.github.io') {
    const path = location.pathname.replace(/^\/xox\/?/, '');
    if (path !== 'migration-export.html') {
      location.replace(`http://xox.ru/${path}${location.search}${location.hash}`);
      window.XOXAPI = {ready: new Promise(() => {}), currentUser: () => null};
      return;
    }
  }

  const fetchAPI = async (url, options, retries) => {
    try {
      const response = await fetch(url, options);
      if (retries > 0 && [502, 503, 504].includes(response.status)) {
        await new Promise(resolve => setTimeout(resolve, 450));
        return fetchAPI(url, options, retries - 1);
      }
      return response;
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 450));
        return fetchAPI(url, options, retries - 1);
      }
      const networkError = new Error('Сервер XOX временно недоступен. Проверьте соединение и повторите запрос.');
      networkError.code = 'network_error';
      throw networkError;
    }
  };

  const request = async (action, options = {}) => {
    const query = new URLSearchParams(options.query || {});
    query.set('action', action);
    const headers = {Accept: 'application/json', ...(options.headers || {})};
    if (options.data !== undefined) headers['Content-Type'] = 'application/json';
    if (csrf && options.method && options.method !== 'GET') headers['X-XOX-CSRF'] = csrf;
    const requestOptions = {
      method: options.method || 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers,
      body: options.data === undefined ? undefined : JSON.stringify(options.data)
    };
    const response = await fetchAPI(`api.php?${query}`, requestOptions, action === 'captcha' || action === 'me' ? 2 : 0);
    let payload;
    let parsed = true;
    try { payload = await response.json(); } catch { parsed = false; payload = {error: 'Сервер вернул некорректный ответ.'}; }
    if (payload.csrf) csrf = payload.csrf;
    if (!response.ok) {
      const error = new Error(payload.error || 'Не удалось выполнить запрос.');
      error.code = payload.code || 'request_failed';
      error.status = response.status;
      throw error;
    }
    if (!parsed) {
      const error = new Error(payload.error);
      error.code = 'invalid_response';
      throw error;
    }
    return payload;
  };

  const bootstrap = request('me').then(payload => {
    user = payload.user || null;
    window.dispatchEvent(new CustomEvent('xox:api-ready', {detail: user}));
    return user;
  }).catch(error => {
    console.warn('XOX API is unavailable:', error.message);
    window.dispatchEvent(new CustomEvent('xox:api-ready', {detail: null}));
    return null;
  });

  window.XOXAPI = {
    ready: bootstrap,
    currentUser: () => user,
    captcha: () => request('captcha'),
    login: async data => { const result = await request('login', {method: 'POST', data}); user = result.user; return user; },
    register: data => request('register', {method: 'POST', data}),
    requestVerification: data => request('request-verification', {method: 'POST', data}),
    verifyEmail: token => request('verify-email', {method: 'POST', data: {token}}),
    requestPasswordReset: data => request('request-password-reset', {method: 'POST', data}),
    resetPassword: (token, password) => request('reset-password', {method: 'POST', data: {token, password}}),
    logout: async () => { await request('logout', {method: 'POST', data: {}}); user = null; },
    updateProfile: async data => { const result = await request('profile', {method: 'PUT', data}); user = result.user; return user; },
    listings: async (scope = 'public') => (await request('listings', {query: {scope}})).listings,
    listing: async id => (await request('listings', {query: {id}})).listing,
    createListing: async data => (await request('listings', {method: 'POST', data})).listing,
    updateListing: async (id, data) => (await request('listings', {method: 'PUT', query: {id}, data})).listing,
    setFavorite: async (listingId, favorite) => request('favorite', {method: favorite ? 'POST' : 'DELETE', data: {listingId}}),
    offerExchange: async data => request('exchange', {method: 'POST', data})
  };
})();

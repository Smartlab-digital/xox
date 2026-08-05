(() => {
  let csrf = '';
  let user = null;

  const request = async (action, options = {}) => {
    const query = new URLSearchParams(options.query || {});
    query.set('action', action);
    const headers = {Accept: 'application/json', ...(options.headers || {})};
    if (options.data !== undefined) headers['Content-Type'] = 'application/json';
    if (csrf && options.method && options.method !== 'GET') headers['X-XOX-CSRF'] = csrf;
    const response = await fetch(`api.php?${query}`, {
      method: options.method || 'GET',
      credentials: 'same-origin',
      headers,
      body: options.data === undefined ? undefined : JSON.stringify(options.data)
    });
    let payload;
    try { payload = await response.json(); } catch { payload = {error: 'Сервер вернул некорректный ответ.'}; }
    if (payload.csrf) csrf = payload.csrf;
    if (!response.ok) {
      const error = new Error(payload.error || 'Не удалось выполнить запрос.');
      error.code = payload.code || 'request_failed';
      error.status = response.status;
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
    register: async data => { const result = await request('register', {method: 'POST', data}); user = result.user; return user; },
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

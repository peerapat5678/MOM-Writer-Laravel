// Backoffice token storage + axios interceptors (attach access token, auto-refresh on 401).

const apiBase = (import.meta.env.VITE_BACKOFFICE_API_BASE || '/api').replace(/\/+$/g, '');

const ACCESS_KEY = 'backoffice_token';
const REFRESH_KEY = 'backoffice_refresh_token';
const USER_KEY = 'backoffice_user';

export function getAccessToken() {
    return localStorage.getItem(ACCESS_KEY) || '';
}

export function getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY) || '';
}

export function getUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    } catch {
        return {};
    }
}

export function isAuthenticated() {
    return Boolean(getAccessToken());
}

export function setSession({ access_token, refresh_token, user }) {
    if (access_token !== undefined) {
        localStorage.setItem(ACCESS_KEY, access_token || '');
    }
    if (refresh_token !== undefined) {
        localStorage.setItem(REFRESH_KEY, refresh_token || '');
    }
    if (user !== undefined) {
        localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
    }
}

export function clearSession() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
}

/**
 * Register request/response interceptors on window.axios.
 * @param {import('vue-router').Router} router used to bounce to login on hard auth failure.
 */
export function installAuth(router) {
    const axios = window.axios;

    axios.interceptors.request.use((config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    let refreshing = null;

    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const original = error.config;
            const status = error.response?.status;
            const url = original?.url || '';

            const isAuthEndpoint = url.includes('/backoffice/login')
                || url.includes('/backoffice/refresh')
                || url.includes('/backoffice/forgot-password');

            if (status !== 401 || original?._retry || isAuthEndpoint) {
                return Promise.reject(error);
            }

            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                clearSession();
                router.push({ name: 'backoffice.login' });
                return Promise.reject(error);
            }

            // Ensure only one refresh request is in flight at a time.
            if (!refreshing) {
                refreshing = axios
                    .post(`${apiBase}/backoffice/refresh`, { refresh_token: refreshToken })
                    .then((res) => {
                        const data = res.data?.data || {};
                        setSession({
                            access_token: data.access_token,
                            refresh_token: data.refresh_token,
                            user: data.user,
                        });
                        return data.access_token;
                    })
                    .finally(() => {
                        refreshing = null;
                    });
            }

            try {
                const newAccessToken = await refreshing;
                original._retry = true;
                original.headers.Authorization = `Bearer ${newAccessToken}`;
                return axios(original);
            } catch (refreshError) {
                clearSession();
                router.push({ name: 'backoffice.login' });
                return Promise.reject(refreshError);
            }
        }
    );
}

import { HttpInterceptorFn } from '@angular/common/http';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  // CSRF token'ı cookie'den al ve header'a ekle
  if (req.method !== 'GET' && req.url.includes('/api/')) {
    const csrfToken = getCsrfToken();
    
    if (csrfToken) {
      req = req.clone({
        setHeaders: {
          'X-CSRF-Token': csrfToken
        }
      });
    }
  }

  return next(req);
};

function getCsrfToken(): string | null {
  // Cookie'den CSRF token'ı al
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN' || name === 'csrf-token') {
      return decodeURIComponent(value);
    }
  }
  return null;
}
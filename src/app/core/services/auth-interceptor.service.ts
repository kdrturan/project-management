import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  let authReq = req;
  
  // Sadece API istekleri için cookie dahil et
  if (req.url.includes('/api/')) {
    authReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      withCredentials: true
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('HTTP Error in interceptor:', error.status, req.url);
      
      // 401 hatası ve logout endpoint'i değilse logout yap
      if (error.status === 401 && !req.url.includes('/api/auth/logout')) {
        console.log('401 Unauthorized - initiating logout');
        // Backend logout isteği yapmadan hızlı logout
        authService.quickLogout();
        return throwError(() => error);
      }
      
      // 403 Forbidden
      if (error.status === 403) {
        console.log('403 Forbidden - redirecting to projects');
        router.navigate(['/projects']);
        return throwError(() => error);
      }

      return throwError(() => error);
    })
  );
};

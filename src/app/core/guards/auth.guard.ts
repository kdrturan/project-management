import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, timeout, finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  private isCheckingAuth = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {    
    // Login sayfasına gidiyorsa direkt izin ver
    if (state.url === '/login') {
      return true;
    }
    
    // Zaten kontrol yapılıyorsa bekle ve tekrar dene
    if (this.isCheckingAuth) {
      return this.waitForAuthCheck();
    }
    
    // Önce local authentication durumunu kontrol et
    if (this.authService.isLoggedIn()) {
      return true;
    }

    this.isCheckingAuth = true;
    
    return this.authService.checkSession().pipe(
      timeout(8000), // 8 saniye timeout
      map(user => {
        console.log('Auth check result:', user ? 'authenticated' : 'not authenticated');
        if (user) {
          return true;
        } else {
          this.router.navigate(['/login'], { 
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
      }),
      catchError(error => {
        console.log('Auth guard error:', error);
        this.router.navigate(['/login'], { 
          queryParams: { returnUrl: state.url }
        });
        return of(false);
      }),
      finalize(() => {
        // Her durumda flag'i resetle
        this.isCheckingAuth = false;
      })
    );
  }

  // Auth check bitene kadar bekle
  private waitForAuthCheck(): Observable<boolean> {
    return new Observable(observer => {
      const checkInterval = setInterval(() => {
        if (!this.isCheckingAuth) {
          clearInterval(checkInterval);
          // Tekrar kontrol et
          const isLoggedIn = this.authService.isLoggedIn();
          console.log('Wait completed, user logged in:', isLoggedIn);
          observer.next(isLoggedIn);
          observer.complete();
        }
      }, 100); // 100ms'de bir kontrol et
      
      // 10 saniye sonra timeout
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('Wait timeout, redirecting to login');
        this.router.navigate(['/login']);
        observer.next(false);
        observer.complete();
      }, 10000);
    });
  }
}

import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { catchError, map, Observable, of } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    // Önce authentication kontrolü
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    // Admin kontrolü
    return this.authService.checkSession().pipe(
      map(user => {
        if (user && user.role === 'admin') {
          return true;
        } else {
          // Admin değilse projects'e yönlendir
          this.router.navigate(['/projects']);
          return false;
        }
      }),
      catchError(() => {
        // Hata durumunda login'e yönlendir
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
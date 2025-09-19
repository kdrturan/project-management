import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { catchError, map, Observable, of } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

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

    // Route'tan gerekli rolleri al
    const requiredRoles = route.data?.['roles'] as Array<string>;
    // Eğer role kontrolü gerekmiyorsa (roles tanımlanmamışsa) geç
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Session kontrolü ile role doğrulama
    return this.authService.checkSession().pipe(
      map(user => {
        if (!user) {
          console.log('❌ No user found in session');
          this.router.navigate(['/login']);
          return false;
        }

        const userRole = user.role;
        if (requiredRoles.includes(userRole)) {
          return true;
        } else {
          console.log('❌ Access denied for role:', userRole);
          // Kullanıcıyı role'üne uygun sayfaya yönlendir
          const defaultRoute = this.getDefaultRouteForRole(userRole);
          this.router.navigate([defaultRoute]);
          return false;
        }
      }),
      catchError(error => {
        console.log('❌ RoleGuard error:', error);
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }

  private getDefaultRouteForRole(role: string): string {
    switch (role) {
      case 'Developer':
        return '/user-tasks';
      case 'TechnicalManager':
        return '/team-management';
      case 'Admin':
        return '/projects';
      case 'ProjectManager':
        return '/projects';
      default:
        return '/login';
    }
  }
}
import { Observable } from "rxjs";
import { AuthService } from "../services/auth.service";
import { CanActivate, Router } from "@angular/router";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> | boolean {
    console.log('LoginGuard checking...');
    
    // Sadece local durumu kontrol et - backend çağrısı yapma
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/projects']);
      return false;
    }
      return true;
  }
}


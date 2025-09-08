// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../../modules/teamManagement/models/user';

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:7041/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isAuthenticated = false;

  constructor(private http: HttpClient, private router: Router) {
    // Sayfa yüklendiğinde session kontrolü yap
    this.checkSession();
  }

  // Login - Cookie tabanlı
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials, {
        withCredentials: true, // Cookie'leri gönder/al
      })
      .pipe(
        map((response) => {
          if (response.success && response.user) {
            this.setUserSession(response.user);
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  // Demo login (development için)
  demoLogin(
    userType: 'admin' | 'user',
    rememberMe: boolean = false
  ): Observable<LoginResponse> {
    const demoUsers = {
      admin: {
        id: 1,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        role: 'admin',
        position: 'System Administrator',
        departmentId: 1,
        isActive: true,
      },
      user: {
        id: 6,
        firstName: 'Test',
        lastName: 'User',
        email: 'user@example.com',
        role: 'user',
        position: 'Developer',
        departmentId: 2,
        isActive: true,
      },
    };

    const demoResponse: LoginResponse = {
      success: true,
      message: 'Demo giriş başarılı',
      user: demoUsers[userType],
    };

    return new Observable((observer) => {
      setTimeout(() => {
        // Demo için cookie simülasyonu - sessionStorage kullan
        this.setDemoSession(demoResponse.user!, rememberMe);
        observer.next(demoResponse);
        observer.complete();
      }, 1000);
    });
  }

  // Session kontrolü
  checkSession(): Observable<User | null> {
    return this.http
      .get<{ success: boolean; user?: User }>(`${this.apiUrl}/auth/me`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.success && response.user) {
            this.setUserSession(response.user);
            return response.user;
          } else {
            this.clearSession();
            return null;
          }
        }),
        catchError((error) => {
          // Session yoksa veya geçersizse
          this.clearSession();

          // Demo session kontrolü
          if (this.checkDemoSession()) {
            const demoUser = this.getDemoUser();
            if (demoUser) {
              this.setUserSession(demoUser);
              return [demoUser];
            }
          }

          return [null];
        })
      );
  }

  // Logout
logout(): Observable<any> {
  console.log('🚪 Logout initiated');
  
  // Backend'e logout isteği gönder ÖNCE
  return this.http.post(`${this.apiUrl}/auth/logout`, {}, {
    withCredentials: true
  }).pipe(
    map((response) => {
      console.log('🚪 Backend logout response:', response);
      this.clearSession(); // Backend başarılı olduktan sonra temizle
      return response;
    }),
    catchError((error) => {
      console.log('🚪 Backend logout failed:', error);
      // Backend hatası olsa bile local'ı temizle
      this.clearSession();
      return of({ success: true });
    }),
    finalize(() => {
      console.log('🚪 Logout completed, navigating to login');
      this.navigateToLogin();
    })
  );
}

// 2. clearSession metodunu güncelleyin

  forceLogout(): void {
    console.log('🚪 Force logout - clearing all data');
    
    // Session state'i temizle
    this.currentUserSubject.next(null);
    this.isAuthenticated = false;
    
    // Tüm storage'ı temizle
    localStorage.clear();
    sessionStorage.clear();
    
    // Cookie'leri temizle (tarayıcının izin verdiği kadar)
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('🚪 All data cleared');
  }

    private navigateToLogin(): void {
    console.log('🚪 Navigating to login page');
    
    // Router'ı kullanarak yönlendir
    this.router.navigate(['/login']).then(
      (success) => {
        console.log('🚪 Navigation success:', success);
        if (!success) {
          // Router navigation başarısızsa window.location kullan
          console.log('🚪 Router failed, using window.location');
          window.location.href = '/login';
        }
      },
      (error) => {
        console.error('🚪 Navigation error:', error);
        // Hata durumunda window.location kullan
        window.location.href = '/login';
      }
    );
  }
  // User session yönetimi
  private setUserSession(user: User): void {
    this.currentUserSubject.next(user);
    this.isAuthenticated = true;

    // Local storage'a sadece non-sensitive bilgileri kaydet
    localStorage.setItem('currentUserId', user.id.toString());
    localStorage.setItem('userRole', user.role);
  }


quickLogout(): void {
  console.log('Quick logout - no HTTP request');
  this.clearSession();
  this.router.navigate(['/login']);
}


private clearSession(): void {
  console.log('🚪 Clearing session data');
  
  this.currentUserSubject.next(null);
  this.isAuthenticated = false;

  // Specific storage temizleme
  localStorage.removeItem('currentUserId');
  localStorage.removeItem('userRole');
  localStorage.removeItem('demoUser');
  localStorage.removeItem('demoLoginTime');
  sessionStorage.removeItem('demoUser');
  sessionStorage.removeItem('demoLoginTime');
  
  console.log('🚪 Session data cleared');
}

demoLogout(): void {
  console.log('🚪 Demo logout initiated');
  this.clearSession();
  this.navigateToLogin();
}

  // Demo session yönetimi (development için)
  private setDemoSession(user: User, rememberMe: boolean): void {
    this.setUserSession(user);

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('demoUser', JSON.stringify(user));
    storage.setItem('demoLoginTime', new Date().toISOString());
  }

  private checkDemoSession(): boolean {
    const sessionUser = sessionStorage.getItem('demoUser');
    const localUser = localStorage.getItem('demoUser');

    if (sessionUser || localUser) {
      const loginTime =
        sessionStorage.getItem('demoLoginTime') ||
        localStorage.getItem('demoLoginTime');
      if (loginTime) {
        const timeDiff = new Date().getTime() - new Date(loginTime).getTime();
        const hoursDiff = timeDiff / (1000 * 3600);
        return hoursDiff < 24; // 24 saat geçerlilik
      }
    }
    return false;
  }

  private getDemoUser(): User | null {
    const sessionUser = sessionStorage.getItem('demoUser');
    const localUser = localStorage.getItem('demoUser');
    const userStr = sessionUser || localUser;

    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Public methods
isLoggedIn(): boolean {
  const isAuth = this.isAuthenticated;
  const hasDemo = this.checkDemoSession();
  const hasUser = !!this.currentUserSubject.value;
  
  const result = isAuth || hasDemo || hasUser;
  
  console.log('🔐 isLoggedIn check:', {
    isAuthenticated: isAuth,
    hasDemoSession: hasDemo,
    hasCurrentUser: hasUser,
    finalResult: result
  });
  
  return result;
}

  getCurrentUser(): User | null {
    const currentUser = this.currentUserSubject.value;
    if (currentUser) {
      return currentUser;
    }

    // Demo user kontrolü
    if (this.checkDemoSession()) {
      return this.getDemoUser();
    }

    return null;
  }

  getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    return user ? user.id : null;
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  isUser(): boolean {
    return this.getUserRole() === 'user';
  }

  // Password reset (cookie tabanlı)
  forgotPassword(email: string): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/auth/forgot-password`,
        { email },
        {
          withCredentials: true,
        }
      )
      .pipe(catchError(this.handleError));
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/auth/reset-password`,
        {
          token,
          newPassword,
        },
        {
          withCredentials: true,
        }
      )
      .pipe(catchError(this.handleError));
  }

  // Error handling
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Bir hata oluştu';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Geçersiz istek';
          break;
        case 401:
          errorMessage = 'E-posta veya şifre hatalı';
          break;
        case 403:
          errorMessage = 'Bu işlem için yetkiniz yok';
          break;
        case 404:
          errorMessage = 'Kullanıcı bulunamadı';
          break;
        case 500:
          errorMessage = 'Sunucu hatası';
          break;
        default:
          errorMessage = error.error?.message || 'Bilinmeyen hata';
      }
    }

    return throwError(() => ({ status: error.status, message: errorMessage }));
  }
}

// src/app/core/components/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface LoginData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  
  loginData: LoginData = {
    email: '',
    password: ''
  };
  
  showPassword = false;
  rememberMe = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showDemoCredentials = true; // Production'da false yapın
  returnUrl = '/projects';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Return URL'i al
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/projects';
    
    // Session kontrolü yap
    this.authService.checkSession().subscribe({
      next: (user) => {
        if (user) {
          // Zaten giriş yapmış, yönlendir
          this.router.navigate([this.returnUrl]);
        }
      },
      error: () => {
        // Session yok, login sayfasında kal
      }
    });
    
    // Remember me için email kontrolü
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.loginData.email = savedEmail;
      this.rememberMe = true;
    }
  }

  async onSubmit() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    try {
      // Login request'i remember me ile birlikte gönder
      const loginRequest = {
        ...this.loginData,
        rememberMe: this.rememberMe
      };
      
      const response = await this.authService.login(loginRequest).toPromise();
      
      if (response && response.success) {
        this.handleSuccessfulLogin();
      } else {
        this.errorMessage = response?.message || 'Giriş başarısız!';
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Backend yoksa demo login dene
      if (error.status === 0 || error.status === 404) {
        try {
          await this.tryDemoLogin();
        } catch (demoError) {
          this.errorMessage = 'Sunucuya bağlanılamıyor ve demo giriş de başarısız!';
        }
      } else {
        this.handleLoginError(error);
      }
    } finally {
      this.isLoading = false;
    }
  }

  private async tryDemoLogin() {
    const isAdminDemo = this.loginData.email === 'admin@example.com' && this.loginData.password === 'admin123';
    const isUserDemo = this.loginData.email === 'user@example.com' && this.loginData.password === 'user123';
    
    if (isAdminDemo || isUserDemo) {
      const userType = isAdminDemo ? 'admin' : 'user';
      const response = await this.authService.demoLogin(userType, this.rememberMe).toPromise();
      
      if (response && response.success) {
        this.handleSuccessfulLogin();
      }
    } else {
      throw new Error('Demo credentials geçersiz');
    }
  }

  private handleSuccessfulLogin() {
    this.successMessage = 'Giriş başarılı! Yönlendiriliyorsunuz...';
    
    // Remember me işlemi - sadece email'i sakla
    if (this.rememberMe) {
      localStorage.setItem('rememberedEmail', this.loginData.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
    
    // Return URL'e yönlendir
    setTimeout(() => {
      this.router.navigate([this.returnUrl]);
    }, 1000);
  }

  private handleLoginError(error: any) {
    if (error.status === 401) {
      this.errorMessage = 'E-posta veya şifre hatalı!';
    } else if (error.status === 404) {
      this.errorMessage = 'Kullanıcı bulunamadı!';
    } else if (error.status === 429) {
      this.errorMessage = 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.';
    } else {
      this.errorMessage = error.message || 'Bir hata oluştu!';
    }
  }

  // Logout function (session temizlemek için)
  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.successMessage = 'Başarıyla çıkış yapıldı.';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Hata olsa bile frontend'te temizle
        this.router.navigate(['/login']);
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onForgotPassword(event: Event) {
    event.preventDefault();
    
    if (!this.loginData.email) {
      this.errorMessage = 'Lütfen önce e-posta adresinizi girin.';
      return;
    }
    
    this.isLoading = true;
    this.authService.forgotPassword(this.loginData.email).subscribe({
      next: (response) => {
        this.successMessage = 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.';
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Şifre sıfırlama işlemi başarısız.';
        this.isLoading = false;
      }
    });
  }

  onRegister(event: Event) {
    event.preventDefault();
    // Register sayfasına yönlendir
    this.router.navigate(['/register']);
  }

  fillDemoCredentials(type: 'admin' | 'user') {
    if (type === 'admin') {
      this.loginData.email = 'admin@example.com';
      this.loginData.password = 'admin123';
    } else {
      this.loginData.email = 'user@example.com';
      this.loginData.password = 'user123';
    }
  }

  onInputChange() {
    if (this.errorMessage || this.successMessage) {
      this.errorMessage = '';
      this.successMessage = '';
    }
  }
}
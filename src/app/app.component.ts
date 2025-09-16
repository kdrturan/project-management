import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './core/components/sidebar/sidebar.component';
import { AuthService } from './core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Uygulama başlatıldığında session kontrolü yap
    this.authService.checkSession().subscribe({
      next: (user) => {
        // Gerekirse kullanıcı bilgilerini işleyin
      },
      error: (error) => {
        console.error('Session kontrolü başarısız:', error);
      }
    });
  }

  title = 'project-management';

  public get LoginStatus(): boolean {
    return this.authService.isLoggedIn();
  }
}

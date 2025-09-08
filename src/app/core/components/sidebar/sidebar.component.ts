// sidebar.component.ts - Doğru logout implementasyonu

import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  
  isSidebarOpen = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  // Backend'e istek gönderen logout
  onLogout(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Logout button clicked');
    
    const confirmed = confirm('Çıkış yapmak istediğinizden emin misiniz?');
    
    if (confirmed) {
      console.log('User confirmed logout');
      
      // AuthService.logout() çağır - bu backend'e istek gönderir
      this.authService.logout().subscribe({
        next: (response) => {
          console.log('Logout successful:', response);
          // AuthService zaten navigateToLogin() çağıracak
        },
        error: (error) => {
          console.error('Logout failed:', error);
          // Hata durumunda manuel navigation
          this.manualLogout();
        }
      });
    }
  }

  // Manuel logout - backend olmadan
  onLogoutManual(event: Event) {
    event.preventDefault();
    
    if (confirm('Manuel çıkış yapmak istediğinizden emin misiniz?')) {
      console.log('Manual logout initiated');
      this.manualLogout();
    }
  }

  // Demo/Manual logout
  private manualLogout() {
    // AuthService'teki demoLogout çağır
    this.authService.demoLogout();
  }

  // Test logout - direct approach
  onLogoutTest(event: Event) {
    event.preventDefault();
    
    console.log('Test logout');
    
    // Direct storage clear
    localStorage.clear();
    sessionStorage.clear();
    
    // Navigate
    this.router.navigate(['/login']).then((success) => {
      if (!success) {
        window.location.href = '/login';
      }
    });
  }

  // Diğer metodlar aynı kalır
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebar && overlay) {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    }
  }

  onNavClick() {
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }
  }

  closeSidebar() {
    this.isSidebarOpen = false;
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebar && overlay) {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.onNavClick();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
  }
}
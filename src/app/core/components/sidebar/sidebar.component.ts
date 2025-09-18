// sidebar.component.ts - Role-based navigation
import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit, OnDestroy {
  isSidebarOpen = false;
  userRole: string = '';
  currentUser: any = null;
  private subscription: Subscription = new Subscription();

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    // Kullanıcı role'ünü al ve değişiklikleri dinle
    this.loadUserRole();
    // Kullanıcı değişikliklerini dinle
    this.subscription.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        this.userRole = user?.role || '';
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private loadUserRole() {
    this.currentUser = this.authService.getCurrentUser();
    this.userRole = this.authService.getUserRole() || '';
  }

  // Role kontrolü metodları
  isProjectManager(): boolean {
    return this.userRole === 'ProjectManager' || this.userRole === 'Admin';
  }

  isTechnicalManager(): boolean {
    return this.userRole === 'TechnicalManager' || this.userRole === 'Admin';
  }

  isAdmin(): boolean {
    return this.userRole === 'Admin';
  }

  isDeveloper(): boolean {
    return this.userRole === 'Developer' || this.userRole === 'Admin';
  }

  // Menü görünürlük kontrolleri
  shouldShowMainMenu(): boolean {
    return this.isProjectManager();
  }

  shouldShowManagementMenu(): boolean {
    return this.isTechnicalManager();
  }

  shouldShowTasksMenu(): boolean {
    return this.isDeveloper();
  }

  shouldShowToolsMenu(): boolean {
    // Araçlar menüsü herkese görünür
    return true;
  }

  // Navigation permission kontrolleri
  canAccessProjects(): boolean {
    return this.isProjectManager();
  }

  canAccessTeamManagement(): boolean {
    return this.isTechnicalManager();
  }

  canAccessReports(): boolean {
    return this.isTechnicalManager();
  }

  canAccessUserManagement(): boolean {
    return this.isAdmin();
  }

  // Logout metodu
  onLogout(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    const confirmed = confirm('Çıkış yapmak istediğinizden emin misiniz?');

    if (confirmed) {

      // AuthService logout metodunu çağır
      this.authService.logout().subscribe({
        next: (response) => {        },
        error: (error) => {
          console.error('Logout failed:', error);
          // Hata durumunda manuel logout
          this.manualLogout();
        },
      });
    }
  }

  private manualLogout() {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  // Sidebar toggle
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebar && overlay) {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    }
  }

  // Navigation click handler
  onNavClick() {
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }
  }

  // Sidebar'ı kapat
  closeSidebar() {
    this.isSidebarOpen = false;
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebar && overlay) {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }
  }

  // Navigation helpers
  navigateTo(route: string) {
    this.router.navigate([route]);
    this.onNavClick();
  }

  // Window resize handler
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
  }
}

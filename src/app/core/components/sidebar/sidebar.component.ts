// sidebar.component.ts

import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  
  isSidebarOpen = false;

  constructor(private router: Router) { }

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
    // Mobile'da sidebar'ı kapat
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

  // Özel navigation metodları (ihtiyaç durumunda)
  navigateTo(route: string) {
    this.router.navigate([route]);
    this.onNavClick(); // Mobile'da sidebar'ı kapat
  }

  // Programatik navigation örnekleri
  goToDashboard() {
    this.navigateTo('/dashboard');
  }

  goToProjects() {
    this.navigateTo('/projects');
  }

  goToTeamManagement() {
    this.navigateTo('/team-management');
  }

  goToTasks() {
    this.navigateTo('/tasks');
  }

  // Window resize handler
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth > 768) {
      this.closeSidebar();
    }
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Project } from '../../models/project';
import { ProjectService } from '../../services/project-service.service';
import { AuthService } from '../../../../core/services/auth.service';

interface Stats {
  totalProjects: number;
  activeTasks: number;
  completed: number;
  overdue: number;
}

@Component({
  selector: 'app-project-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-dashboard.component.html',
  styleUrl: './project-dashboard.component.css'
})
export class ProjectDashboardComponent implements OnInit {
  
  stats: Stats = {
    totalProjects: 0,
    activeTasks: 0,
    completed: 0,
    overdue: 0
  };

  projects: Project[] = [];
  filteredProjects: Project[] = [];
  activeFilter: string = 'all';
  isLoading = true;
  error: string | null = null;

  // Mock data - backend çalışmıyorsa fallback olarak kullanılacak
  private mockProjects: Project[] = [
    {
      id: 1,
      name: 'E-Ticaret Web Sitesi',
      description: 'Modern e-ticaret platformu geliştirme projesi. Kullanıcı dostu arayüz ve güvenli ödeme sistemi.',
      status: 'Aktif',
      priority: 'Yüksek',
      progressPercentage: 75,
      plannedStartDate: new Date('2024-01-15'),
      plannedEndDate: new Date('2024-03-15'),
      primaryDepartmentId: 1,
      projectManagerId: 101
    },
    {
      id: 2,
      name: 'Mobile Uygulama',
      description: 'iOS ve Android platformları için native mobile uygulama geliştirme projesi.',
      status: 'Planlama',
      priority: 'Orta',
      progressPercentage: 25,
      plannedStartDate: new Date('2024-02-01'),
      plannedEndDate: new Date('2024-04-30'),
      primaryDepartmentId: 2,
      projectManagerId: 102
    },
    {
      id: 3,
      name: 'Kurumsal Web Sitesi',
      description: 'Şirketin yeni kurumsal web sitesi tasarım ve geliştirme projesi tamamlandı.',
      status: 'Tamamlandı',
      priority: 'Düşük',
      progressPercentage: 100,
      plannedStartDate: new Date('2023-12-01'),
      plannedEndDate: new Date('2024-01-10'),
      actualStartDate: new Date('2023-12-01'),
      actualEndDate: new Date('2024-01-10'),
      primaryDepartmentId: 3,
      projectManagerId: 103
    },
    {
      id: 4,
      name: 'CRM Sistemi',
      description: 'Müşteri ilişkileri yönetimi sistemi geliştirme projesi. Deadline geçmiş durumda.',
      status: 'Gecikmiş',
      priority: 'Kritik',
      progressPercentage: 60,
      plannedStartDate: new Date('2024-01-01'),
      plannedEndDate: new Date('2024-02-05'),
      actualStartDate: new Date('2024-01-05'),
      primaryDepartmentId: 1,
      projectManagerId: 104
    },
    {
      id: 5,
      name: 'Dashboard Analytics',
      description: 'Veri analizi ve raporlama dashboard geliştirme projesi.',
      status: 'Aktif',
      priority: 'Orta',
      progressPercentage: 45,
      plannedStartDate: new Date('2024-02-01'),
      plannedEndDate: new Date('2024-03-20'),
      primaryDepartmentId: 2,
      projectManagerId: 105
    },
    {
      id: 6,
      name: 'API Geliştirme',
      description: 'REST API ve mikroservis mimarisi geliştirme projesi.',
      status: 'Planlama',
      priority: 'Yüksek',
      progressPercentage: 10,
      plannedStartDate: new Date('2024-03-01'),
      plannedEndDate: new Date('2024-05-15'),
      primaryDepartmentId: 3,
      projectManagerId: 106
    }
  ];

  constructor(private router: Router, private projectService: ProjectService, private authService:AuthService) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.isLoading = true;
    this.error = null;

    let userId = this.authService.getCurrentUserId() || 0;
    this.projectService.getProjectsByOwner(userId).subscribe({
      next: (response) => {        
        let backendProjects: Project[] = [];
        
        backendProjects = this.processBackendProjects(response.data);
        this.projects = [...backendProjects];
        this.applyCurrentFilter();
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Backend\'den projeler yüklenirken hata:', error);
        this.error = 'Projeler yüklenirken bir hata oluştu. Mock veriler kullanılıyor.';
        
        // Hata durumunda sadece mock data kullan
        this.projects = [...this.mockProjects];
        this.applyCurrentFilter();
        this.calculateStats();
        
        this.isLoading = false;
      }
    });
  }

  private processBackendProjects(backendData: any[]): Project[] {
    return backendData.map(project => ({
      ...project,
      plannedStartDate: project.plannedStartDate ? new Date(project.plannedStartDate) : undefined,
      plannedEndDate: project.plannedEndDate ? new Date(project.plannedEndDate) : undefined,
      actualStartDate: project.actualStartDate ? new Date(project.actualStartDate) : undefined,
      actualEndDate: project.actualEndDate ? new Date(project.actualEndDate) : undefined
    }));
  }

  // Mevcut filtreyi uygula
  private applyCurrentFilter() {
    this.filterProjects(this.activeFilter);
  }

  // İstatistikleri hesapla
  private calculateStats() {
    this.stats = {
      totalProjects: this.projects.length,
      activeTasks: this.projects.filter(p => p.status === 'Aktif').length,
      completed: this.projects.filter(p => p.status === 'Tamamlandı').length,
      overdue: this.projects.filter(p => p.status === 'Gecikmiş').length
    };
  }

  // Verileri yenile
  refreshProjects() {
    this.loadProjects();
  }

  createNewProject() {
    this.router.navigate(['/projects/add']);
  }

  filterProjects(filter: string) {
    this.activeFilter = filter;
    
    if (filter === 'all') {
      this.filteredProjects = [...this.projects];
    } else {
      // Status'a göre filtreleme
      const statusMap: { [key: string]: string } = {
        'Aktif': 'Aktif',
        'Tamamlandı': 'Tamamlandı',
        'Gecikmiş': 'Gecikmiş',
        'Planlama': 'Planlama'
      };
      
      this.filteredProjects = this.projects.filter(project => 
        project.status === statusMap[filter]
      );
    }
  }

  openProject(project: Project) {
    this.router.navigate(['/projects/detail/', project.id]);
  }

  getStatusClass(status?: string): string {
    if (!status) return '';
    
    const statusClassMap: { [key: string]: string } = {
      'Aktif': 'status-active',
      'Planlama': 'status-planning',
      'Tamamlandı': 'status-completed',
      'Gecikmiş': 'status-overdue'
    };
    
    return statusClassMap[status] || '';
  }

  formatDate(date?: Date): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR');
  }

  getFilterMessage(filter: string): string {
    const messages: { [key: string]: string } = {
      'Aktif': 'Şu anda aktif olan proje bulunmuyor.',
      'Tamamlandı': 'Tamamlanmış proje bulunmuyor.',
      'Gecikmiş': 'Geciken proje bulunmuyor.',
      'Planlama': 'Planlama aşamasında proje bulunmuyor.'
    };
    return messages[filter] || 'Proje bulunamadı.';
  }

}
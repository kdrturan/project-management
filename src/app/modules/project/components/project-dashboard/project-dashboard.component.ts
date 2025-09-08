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

    console.log('Backend\'den projeler yükleniyor...');
    let userId = this.authService.getCurrentUserId() || 0;
    this.projectService.getProjectsByOwner(userId).subscribe({
      next: (response) => {
        console.log('Backend API Response:', response);
        
        let backendProjects: Project[] = [];
        
        // Backend response formatını kontrol et
        if (response && Array.isArray(response)) {
          // Eğer response direkt array ise
          backendProjects = this.processBackendProjects(response);
        } else if (response && response.data && Array.isArray(response.data)) {
          // Eğer response.data array ise
          backendProjects = this.processBackendProjects(response.data);
        } else {
          console.warn('Beklenmeyen API response formatı:', response);
        }

        // Backend ve mock verileri birleştir
        this.combineProjectsData(backendProjects);
        
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

  // Backend'den gelen projeleri işle (tarih formatları vs.)
  private processBackendProjects(backendData: any[]): Project[] {
    return backendData.map(project => ({
      ...project,
      plannedStartDate: project.plannedStartDate ? new Date(project.plannedStartDate) : undefined,
      plannedEndDate: project.plannedEndDate ? new Date(project.plannedEndDate) : undefined,
      actualStartDate: project.actualStartDate ? new Date(project.actualStartDate) : undefined,
      actualEndDate: project.actualEndDate ? new Date(project.actualEndDate) : undefined
    }));
  }

  // Backend ve mock verileri birleştir
  private combineProjectsData(backendProjects: Project[]) {
    console.log(`Backend\'den ${backendProjects.length} proje alındı`);
    
    // Backend verileri ile başla
    this.projects = [...backendProjects];
    
    // Eğer backend'den veri gelmemişse mock verileri ekle
    if (backendProjects.length === 0) {
      console.log('Backend\'den veri gelmedi, mock veriler kullanılıyor');
      this.projects = [...this.mockProjects];
    } else {
      // Backend verileri varsa, mock verileri de ekle (farklı ID'lerde)
      const maxBackendId = Math.max(...backendProjects.map(p => p.id));
      const mockProjectsWithNewIds = this.mockProjects.map(mockProject => ({
        ...mockProject,
        id: maxBackendId + mockProject.id, // ID çakışmasını önle
        name: `[Mock] ${mockProject.name}` // Mock olduğunu belirt
      }));
      
      this.projects = [...backendProjects, ...mockProjectsWithNewIds];
      console.log(`Toplam ${this.projects.length} proje yüklendi (${backendProjects.length} backend + ${mockProjectsWithNewIds.length} mock)`);
    }

    this.applyCurrentFilter();
    this.calculateStats();
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
        'active': 'Aktif',
        'completed': 'Tamamlandı',
        'overdue': 'Gecikmiş',
        'planning': 'Planlama'
      };
      
      this.filteredProjects = this.projects.filter(project => 
        project.status === statusMap[filter]
      );
    }
  }

  openProject(project: Project) {
    this.router.navigate(['/projects', project.id]);
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
      'active': 'Şu anda aktif olan proje bulunmuyor.',
      'completed': 'Tamamlanmış proje bulunmuyor.',
      'overdue': 'Geciken proje bulunmuyor.',
      'planning': 'Planlama aşamasında proje bulunmuyor.'
    };
    return messages[filter] || 'Proje bulunamadı.';
  }

  // Mock team data - gerçek projede backend'den gelecek
  getProjectTeam(projectId: number): string[] {
    const teamData: { [key: number]: string[] } = {
      1: ['AY', 'MK', 'SB', '+2'],
      2: ['EK', 'TY', '+1'],
      3: ['DB', 'FG'],
      4: ['NK', 'PL', 'QM'],
      5: ['RT', 'SW'],
      6: ['UV', 'XY', 'ZA']
    };
    return teamData[projectId] || ['?'];
  }
}
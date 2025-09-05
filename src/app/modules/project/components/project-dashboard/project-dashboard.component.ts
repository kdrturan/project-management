import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Project } from '../../models/project';



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
    totalProjects: 12,
    activeTasks: 48,
    completed: 8,
    overdue: 2
  };

  projects: Project[] = [
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

  filteredProjects: Project[] = [];
  activeFilter: string = 'all';

  constructor(private router: Router) {}

  ngOnInit() {
    this.filteredProjects = [...this.projects];
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
      'overdue': 'Geciken proje bulunmuyor. 🎉',
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
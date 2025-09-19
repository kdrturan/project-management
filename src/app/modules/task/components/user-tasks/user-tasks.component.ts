// src/app/modules/task/components/user-tasks/user-tasks.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../task/services/task.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserTask } from '../../../teamManagement/models/userTask';
import { User } from '../../../teamManagement/models/user';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-tasks.component.html',
  styleUrls: ['./user-tasks.component.css']
})
export class UserTaskComponent implements OnInit {
  
  myTasks: UserTask[] = [];
  currentUser: User | null = null;
  
  // Filtreler
  statusFilter = 'all';
  priorityFilter = 'all';
  
  // İstatistikler
  stats = {
    total: 0,
    todo: 0,
    inProgress: 0,
    inReview: 0,
    blocked: 0,
    done: 0
  };

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private route: Router
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.loadMyTasks();
  }

  loadCurrentUser() {
    // AuthService'den güncel kullanıcı bilgisini al
    this.authService.currentUser$.subscribe({
      next: (user) => {
        this.currentUser = user;
      }
    });

    // Eğer currentUser yoksa session kontrolü yap
    if (!this.currentUser) {
      this.authService.checkSession().subscribe({
        next: (user) => {
          this.currentUser = user || null;
        },
        error: (error) => {
          console.error('Kullanıcı bilgisi yüklenirken hata:', error);
          // Session geçersizse login'e yönlendir
          this.authService.logout();
        }
      });
    }
  }

  loadMyTasks() {
    // AuthService'den kullanıcı ID'sini al
    const userId = this.authService.getCurrentUserId();
    
    if (userId) {
      this.taskService.getTasksByUserId(userId).subscribe({
        next: (response) => {
          if (response && response.data && Array.isArray(response.data)) {
            this.myTasks = response.data.map(task => ({
              ...task,
              plannedStartDate: task.plannedStartDate ? new Date(task.plannedStartDate) : undefined,
              plannedEndDate: task.plannedEndDate ? new Date(task.plannedEndDate) : undefined,
              actualStartDate: task.actualStartDate ? new Date(task.actualStartDate) : undefined,
              actualEndDate: task.actualEndDate ? new Date(task.actualEndDate) : undefined,
              createdAt: new Date(task.createdAt),
              updatedAt: new Date(task.updatedAt)
            }));
            
            this.calculateStats();
          }
        },
        error: (error) => {
          console.error('Görevler yüklenirken hata:', error);
          
          // 401 hatası varsa AuthService zaten logout yapacak
          if (error.status !== 401) {
            this.myTasks = [];
            // User-friendly error message göster
            this.showErrorMessage('Görevler yüklenirken bir hata oluştu.');
          }
        }
      });
    } else {
      console.error('User ID bulunamadı');
      this.myTasks = [];
    }
  }

  calculateStats() {
    this.stats.total = this.myTasks.length;
    this.stats.todo = this.myTasks.filter(t => t.status === 'Yapılacak').length;
    this.stats.inProgress = this.myTasks.filter(t => t.status === 'Devam Eden').length;
    this.stats.inReview = this.myTasks.filter(t => t.status === 'İnceleme/Test').length;
    this.stats.blocked = this.myTasks.filter(t => t.status === 'Engelli').length;
    this.stats.done = this.myTasks.filter(t => t.status === 'Tamamlanan').length;
  }

  updateTaskStatus(task: UserTask, newStatus: string) {
    // Task service üzerinden backend'e durum güncellemesi gönder
    this.taskService.updateTaskStatus({
      taskId: task.id,
      status: newStatus
    }).subscribe({
      next: (response) => {
        // Frontend'te de güncelle
        const taskIndex = this.myTasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
          this.myTasks[taskIndex] = {
            ...this.myTasks[taskIndex],
            status: newStatus,
            updatedAt: new Date(),
            actualStartDate: newStatus === 'In Progress' && !task.actualStartDate ? new Date() : task.actualStartDate,
            actualEndDate: newStatus === 'Done' ? new Date() : undefined
          };
          
          this.calculateStats();
          console.log(`Görev durumu "${newStatus}" olarak güncellendi.`);
          this.showSuccessMessage('Görev durumu başarıyla güncellendi.');
        }
      },
      error: (error) => {
        console.error('Durum güncellenirken hata:', error);
        
        if (error.status === 401) {
          // AuthService logout yapacak
          return;
        } else if (error.status === 403) {
          this.showErrorMessage('Bu işlem için yetkiniz yok!');
        } else {
          this.showErrorMessage('Durum güncellenirken hata oluştu!');
        }
      }
    });
  }


openTaskFiles(taskId: number) {
  this.route.navigate(['/file-management/task', taskId]);
}




  getFilteredTasks(): UserTask[] {
    return this.myTasks.filter(task => {
      const statusMatch = this.statusFilter === 'all' || task.status === this.statusFilter;
      const priorityMatch = this.priorityFilter === 'all' || task.priority === this.priorityFilter;
      return statusMatch && priorityMatch;
    });
  }

  formatDate(date?: Date): string {
    return date ? new Date(date).toLocaleDateString('tr-TR') : '-';
  }

  getPriorityColor(priority: string): string {
    const colors = {
      'Düşük': '#4CAF50',
      'Orta': '#ff9800',
      'Yüksek': '#f44336',
      'Kritik': '#9c27b0'
    };
    return colors[priority as keyof typeof colors] || '#666';
  }

  getStatusColor(status: string): string {
    const colors = {
      'Yapılacak': '#666',
      'Devam Eden': '#2196F3',
      'İnceleme/Test': '#ff9800',
      'Engelli': '#f44336',
      'Tamamlanan': '#4CAF50'
    };
    return colors[status as keyof typeof colors] || '#666';
  }

  isOverdue(task: UserTask): boolean {
    if (!task.plannedEndDate) return false;
    return new Date(task.plannedEndDate) < new Date() && task.status !== 'Done';
  }

  getProgressPercentage(task: UserTask): number {
    if (!task.estimatedEffort) return 0;
    return Math.round(((task.actualEffort || 0) / task.estimatedEffort) * 100);
  }

  // Helper methods for user feedback
  private showSuccessMessage(message: string) {
    console.log('Success:', message);
  }

  private showErrorMessage(message: string) {
    console.error('Error:', message);
  }

  refreshTasks() {
    this.loadMyTasks();
  }

  // Logout function
  logout() {
    this.authService.logout().subscribe({
      next: () => {
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }
}
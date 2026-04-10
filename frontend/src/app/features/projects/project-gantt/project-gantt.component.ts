import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProjectTaskService, GanttChartDTO, GanttTask, ProjectService, ProjectDTO, ProjectSummaryDTO } from '../services/project.service';
import * as XLSX from 'xlsx';

interface DisplayTask extends GanttTask {
  projectName?: string;
  isProjectHeader?: boolean;
}

@Component({
  selector: 'app-project-gantt',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule,
    MatTooltipModule, MatProgressBarModule, MatSelectModule, MatSnackBarModule, MatMenuModule, FormsModule
  ],
  template: `
    <div class="gantt-container">
      <div class="gantt-header">
        <div class="header-left">
          <button mat-icon-button matTooltip="Go Back" *ngIf="projectId" [routerLink]="'/projects/' + projectId">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h2>{{ projectId ? 'Gantt Chart - ' + (project?.name || '') : 'Projects Gantt Chart' }}</h2>
        </div>
        <div class="header-right">
          <mat-form-field appearance="outline" class="zoom-select" *ngIf="allTasks.length">
            <mat-label>Zoom</mat-label>
            <mat-select [(ngModel)]="zoomLevel" (ngModelChange)="buildTimeline()">
              <mat-option value="day">Day</mat-option>
              <mat-option value="week">Week</mat-option>
              <mat-option value="month">Month</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button matTooltip="Export" color="primary" [matMenuTriggerFor]="exportMenu" *ngIf="allTasks.length">
            <mat-icon>download</mat-icon>
            Export
          </button>
          <mat-menu #exportMenu="matMenu">
            <button mat-menu-item (click)="exportToExcel()">
              <mat-icon>table_chart</mat-icon>
              <span>Export to Excel</span>
            </button>
            <button mat-menu-item (click)="exportToPng()">
              <mat-icon>image</mat-icon>
              <span>Export to PNG</span>
            </button>
            <button mat-menu-item (click)="exportToCsv()">
              <mat-icon>description</mat-icon>
              <span>Export to CSV</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <mat-card class="gantt-card">
        <div class="gantt-loading" *ngIf="loading">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <p>Loading Gantt chart...</p>
        </div>

        <div class="gantt-chart" #ganttChart *ngIf="!loading && allTasks.length > 0">
          <div class="gantt-table">
            <div class="gantt-table-header">
              <div class="col-name">Task Name</div>
              <div class="col-dates">Start</div>
              <div class="col-dates">End</div>
              <div class="col-progress">Progress</div>
              <div class="col-assignee">Assignee</div>
            </div>
            <div class="gantt-table-row" *ngFor="let task of allTasks"
                 [class.milestone-row]="task.isMilestone"
                 [class.critical-row]="task.isCriticalPath"
                 [class.project-header-row]="task.isProjectHeader">
              <div class="col-name" *ngIf="task.isProjectHeader">
                <mat-icon class="project-icon">folder</mat-icon>
                <strong>{{ task.projectName }}</strong>
              </div>
              <div class="col-name" *ngIf="!task.isProjectHeader" [style.padding-left]="projectId ? '0' : '16px'">
                <mat-icon class="task-icon" *ngIf="!task.isMilestone">task_alt</mat-icon>
                <mat-icon class="milestone-icon" *ngIf="task.isMilestone">flag</mat-icon>
                {{ task.name }}
              </div>
              <div class="col-dates">{{ task.isProjectHeader ? '' : (task.startDate | date:'MMM d') }}</div>
              <div class="col-dates">{{ task.isProjectHeader ? '' : (task.endDate | date:'MMM d') }}</div>
              <div class="col-progress">
                <ng-container *ngIf="!task.isProjectHeader">
                  <mat-progress-bar mode="determinate" [value]="task.completionPercentage"></mat-progress-bar>
                  <span class="progress-text">{{ task.completionPercentage }}%</span>
                </ng-container>
              </div>
              <div class="col-assignee">{{ task.isProjectHeader ? '' : (task.assigneeName || '-') }}</div>
            </div>
          </div>

          <div class="gantt-timeline">
            <div class="timeline-header">
              <div class="time-unit" *ngFor="let date of timelineDates">
                {{ date | date:(zoomLevel === 'day' ? 'MMM d' : zoomLevel === 'week' ? 'MMM d' : 'MMM yyyy') }}
              </div>
            </div>
            <div class="timeline-row" *ngFor="let task of allTasks"
                 [class.project-header-timeline]="task.isProjectHeader">
              <div class="bar-container" *ngIf="!task.isProjectHeader">
                <div class="gantt-bar"
                     [style.left.%]="getBarLeft(task)"
                     [style.width.%]="getBarWidth(task)"
                     [class.milestone-bar]="task.isMilestone"
                     [class.critical-bar]="task.isCriticalPath"
                     [class.completed-bar]="task.status === 'DONE' || task.status === 'COMPLETED'"
                     [matTooltip]="task.name + ' (' + task.completionPercentage + '%)'">
                  <div class="bar-fill" [style.width.%]="task.completionPercentage"></div>
                </div>
              </div>
              <div class="bar-container project-bar-container" *ngIf="task.isProjectHeader">
                <div class="project-bar"
                     [style.left.%]="getBarLeft(task)"
                     [style.width.%]="getBarWidth(task)"
                     [matTooltip]="task.projectName || ''">
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && allTasks.length === 0" class="empty-state">
          <mat-icon>bar_chart</mat-icon>
          <p>No tasks to display in the Gantt chart.</p>
          <button mat-raised-button matTooltip="Go to Project Detail" color="primary" *ngIf="projectId" [routerLink]="'/projects/' + projectId">
            Go to Project Detail
          </button>
          <button mat-raised-button matTooltip="Go to Projects" color="primary" *ngIf="!projectId" routerLink="/projects">
            Go to Projects
          </button>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .gantt-container { padding: 24px; }
    .gantt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .header-left { display: flex; align-items: center; gap: 8px; }
    .header-left h2 { margin: 0; }
    .zoom-select { width: 120px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .header-right button mat-icon { margin-right: 4px; }
    .gantt-card { overflow: auto; }
    .gantt-loading { text-align: center; padding: 40px 20px; color: #666; }
    .gantt-loading mat-progress-bar { max-width: 400px; margin: 0 auto 16px; }
    .gantt-chart { display: flex; min-width: 1200px; }
    .gantt-table { width: 500px; flex-shrink: 0; border-right: 2px solid #e0e0e0; }
    .gantt-table-header { display: flex; padding: 12px 8px; background: #f5f5f5; font-weight: 600; font-size: 13px; border-bottom: 1px solid #e0e0e0; }
    .gantt-table-row { display: flex; padding: 10px 8px; border-bottom: 1px solid #f0f0f0; align-items: center; font-size: 13px; }
    .gantt-table-row:hover { background: #fafafa; }
    .project-header-row { background: #e3f2fd; font-weight: 600; }
    .project-header-row:hover { background: #bbdefb; }
    .col-name { flex: 2; display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .col-dates { flex: 1; text-align: center; }
    .col-progress { flex: 1.2; display: flex; align-items: center; gap: 4px; }
    .col-progress mat-progress-bar { flex: 1; }
    .progress-text { font-size: 11px; min-width: 32px; }
    .col-assignee { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .task-icon { font-size: 16px; width: 16px; height: 16px; color: #1976d2; }
    .milestone-icon { font-size: 16px; width: 16px; height: 16px; color: #e91e63; }
    .project-icon { font-size: 18px; width: 18px; height: 18px; color: #1565c0; }
    .milestone-row { background: #fff3e0; }
    .critical-row { border-left: 3px solid #f44336; }
    .gantt-timeline { flex: 1; overflow-x: auto; }
    .timeline-header { display: flex; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; }
    .time-unit { min-width: 80px; padding: 12px 4px; text-align: center; font-size: 11px; font-weight: 600; border-right: 1px solid #e8e8e8; }
    .timeline-row { height: 41px; position: relative; border-bottom: 1px solid #f0f0f0; }
    .project-header-timeline { background: #e3f2fd; }
    .bar-container { height: 100%; position: relative; }
    .gantt-bar { position: absolute; top: 8px; height: 24px; background: #bbdefb; border-radius: 4px; min-width: 4px; overflow: hidden; cursor: pointer; transition: opacity 0.2s; }
    .gantt-bar:hover { opacity: 0.85; }
    .bar-fill { height: 100%; background: #1976d2; border-radius: 4px; }
    .project-bar { position: absolute; top: 16px; height: 8px; background: #1565c0; border-radius: 4px; min-width: 4px; opacity: 0.6; }
    .milestone-bar { width: 12px !important; height: 12px; top: 14px; background: #e91e63; border-radius: 50%; transform: rotate(45deg); }
    .critical-bar { background: #ffcdd2; }
    .critical-bar .bar-fill { background: #f44336; }
    .completed-bar { background: #c8e6c9; }
    .completed-bar .bar-fill { background: #4caf50; }
    .empty-state { text-align: center; padding: 60px 20px; color: #999; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; margin-bottom: 16px; }
  `]
})
export class ProjectGanttComponent implements OnInit {
  @ViewChild('ganttChart') ganttChartRef!: ElementRef;

  project: ProjectDTO | null = null;
  projectId: string | null = null;
  allTasks: DisplayTask[] = [];
  loading = true;
  zoomLevel = 'week';
  timelineDates: Date[] = [];
  private projectStartMs = 0;
  private projectEndMs = 0;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private taskService: ProjectTaskService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id');
    if (this.projectId) {
      this.loadSingleProject(this.projectId);
    } else {
      this.loadAllProjects();
    }
  }

  private loadSingleProject(id: string) {
    this.projectService.getProjectById(id).subscribe(res => {
      if (res.success) {
        this.project = res.data;
        this.taskService.getGanttChart(id).subscribe(ganttRes => {
          if (ganttRes.success) {
            this.allTasks = ganttRes.data.tasks.map(t => ({ ...t } as DisplayTask));
            this.buildTimeline();
          }
          this.loading = false;
        });
      } else {
        this.loading = false;
      }
    });
  }

  private loadAllProjects() {
    this.projectService.getAllProjects().subscribe({
      next: res => {
        if (res.success && res.data.length > 0) {
          const projects = res.data;
          const ganttRequests = projects.map(p =>
            this.taskService.getGanttChart(p.id).pipe(
              catchError(() => of({ success: false, data: { tasks: [] } } as any))
            )
          );

          forkJoin(ganttRequests).subscribe({
            next: (results: any[]) => {
              this.allTasks = [];
              results.forEach((ganttRes: any, i: number) => {
                const proj = projects[i];
                const tasks = ganttRes?.success && ganttRes?.data?.tasks ? ganttRes.data.tasks : [];
                if (tasks.length > 0) {
                  const headerTask: DisplayTask = {
                    id: proj.id,
                    parentId: '',
                    name: proj.name,
                    type: 'project',
                    status: proj.status,
                    startDate: proj.startDate,
                    endDate: proj.endDate,
                    completionPercentage: proj.completionPercentage || 0,
                    dependencies: [],
                    assigneeName: '',
                    isCriticalPath: false,
                    isMilestone: false,
                    projectName: proj.name,
                    isProjectHeader: true
                  };
                  this.allTasks.push(headerTask);

                  tasks.forEach((t: any) => {
                    this.allTasks.push({ ...t, projectName: proj.name } as DisplayTask);
                  });
                }
              });

              // If no tasks found from any project, show projects as timeline bars using their dates
              if (this.allTasks.length === 0) {
                projects.forEach(proj => {
                  if (proj.startDate && proj.endDate) {
                    this.allTasks.push({
                      id: proj.id, parentId: '', name: proj.name, type: 'project',
                      status: proj.status, startDate: proj.startDate, endDate: proj.endDate,
                      completionPercentage: proj.completionPercentage || 0,
                      dependencies: [], assigneeName: proj.managerName || '',
                      isCriticalPath: false, isMilestone: false,
                      projectName: proj.name, isProjectHeader: false
                    });
                  }
                });
              }

              this.buildTimeline();
              this.loading = false;
            },
            error: () => {
              this.loading = false;
              this.snackBar.open('Failed to load Gantt data', 'Close', { duration: 3000 });
            }
          });
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load projects', 'Close', { duration: 3000 });
      }
    });
  }

  buildTimeline() {
    if (!this.allTasks.length) return;

    const tasksWithDates = this.allTasks.filter(t => t.startDate || t.endDate);
    if (!tasksWithDates.length) return;

    let minDate = new Date(tasksWithDates[0].startDate || tasksWithDates[0].endDate);
    let maxDate = new Date(tasksWithDates[0].endDate || tasksWithDates[0].startDate);

    tasksWithDates.forEach(t => {
      if (t.startDate) {
        const s = new Date(t.startDate);
        if (s < minDate) minDate = s;
      }
      if (t.endDate) {
        const e = new Date(t.endDate);
        if (e > maxDate) maxDate = e;
      }
    });

    // Add padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    this.projectStartMs = minDate.getTime();
    this.projectEndMs = maxDate.getTime();

    this.timelineDates = [];
    const current = new Date(minDate);
    const step = this.zoomLevel === 'day' ? 1 : this.zoomLevel === 'week' ? 7 : 30;
    while (current <= maxDate) {
      this.timelineDates.push(new Date(current));
      current.setDate(current.getDate() + step);
    }
  }

  getBarLeft(task: DisplayTask): number {
    if (!task.startDate || this.projectEndMs === this.projectStartMs) return 0;
    const taskStart = new Date(task.startDate).getTime();
    return ((taskStart - this.projectStartMs) / (this.projectEndMs - this.projectStartMs)) * 100;
  }

  getBarWidth(task: DisplayTask): number {
    if (!task.startDate || !task.endDate || this.projectEndMs === this.projectStartMs) return 2;
    const taskStart = new Date(task.startDate).getTime();
    const taskEnd = new Date(task.endDate).getTime();
    const width = ((taskEnd - taskStart) / (this.projectEndMs - this.projectStartMs)) * 100;
    return Math.max(width, 1);
  }

  private getExportData(): any[] {
    return this.allTasks
      .filter(t => !t.isProjectHeader)
      .map(t => ({
        'Project': t.projectName || (this.project?.name || ''),
        'Task Name': t.name,
        'Type': t.isMilestone ? 'Milestone' : 'Task',
        'Status': t.status || '',
        'Start Date': t.startDate ? new Date(t.startDate).toLocaleDateString() : '',
        'End Date': t.endDate ? new Date(t.endDate).toLocaleDateString() : '',
        'Progress (%)': t.completionPercentage ?? 0,
        'Assignee': t.assigneeName || '',
        'Critical Path': t.isCriticalPath ? 'Yes' : 'No'
      }));
  }

  private getFileName(): string {
    const date = new Date().toISOString().slice(0, 10);
    const name = this.project?.name || 'All-Projects';
    return `Gantt-Chart-${name.replace(/\s+/g, '-')}-${date}`;
  }

  exportToExcel() {
    const data = this.getExportData();
    if (!data.length) {
      this.snackBar.open('No data to export', 'Close', { duration: 3000 });
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = [
      { wch: 25 }, { wch: 35 }, { wch: 10 }, { wch: 12 },
      { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 12 }
    ];
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gantt Chart');
    XLSX.writeFile(wb, `${this.getFileName()}.xlsx`);
    this.snackBar.open('Exported to Excel', 'Close', { duration: 2000 });
  }

  exportToCsv() {
    const data = this.getExportData();
    if (!data.length) {
      this.snackBar.open('No data to export', 'Close', { duration: 3000 });
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${this.getFileName()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    this.snackBar.open('Exported to CSV', 'Close', { duration: 2000 });
  }

  exportToPng() {
    const el = this.ganttChartRef?.nativeElement as HTMLElement;
    if (!el) {
      this.snackBar.open('Chart not available', 'Close', { duration: 3000 });
      return;
    }

    const canvas = document.createElement('canvas');
    const scale = 2;
    const scrollWidth = el.scrollWidth;
    const scrollHeight = el.scrollHeight;
    canvas.width = scrollWidth * scale;
    canvas.height = scrollHeight * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, scrollWidth, scrollHeight);

    // Draw title
    const title = this.projectId ? `Gantt Chart - ${this.project?.name || ''}` : 'Projects Gantt Chart';
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(title, 16, 30);

    const tableWidth = 500;
    const rowHeight = 41;
    const headerHeight = 41;
    const titleOffset = 50;

    // Draw table header
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, titleOffset, tableWidth, headerHeight);
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Task Name', 12, titleOffset + 24);
    ctx.fillText('Start', 260, titleOffset + 24);
    ctx.fillText('End', 340, titleOffset + 24);
    ctx.fillText('Progress', 400, titleOffset + 24);

    // Draw table rows
    ctx.font = '12px Arial';
    this.allTasks.forEach((task, i) => {
      const y = titleOffset + headerHeight + i * rowHeight;

      if (task.isProjectHeader) {
        ctx.fillStyle = '#e3f2fd';
        ctx.fillRect(0, y, tableWidth, rowHeight);
        ctx.fillStyle = '#1565c0';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(task.projectName || '', 12, y + 24);
        ctx.font = '12px Arial';
      } else {
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#fafafa';
        ctx.fillRect(0, y, tableWidth, rowHeight);
        ctx.fillStyle = '#333333';
        const indent = this.projectId ? 12 : 28;
        ctx.fillText(task.name.substring(0, 35), indent, y + 24);
        ctx.fillText(task.startDate ? new Date(task.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '', 260, y + 24);
        ctx.fillText(task.endDate ? new Date(task.endDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '', 340, y + 24);
        ctx.fillText(`${task.completionPercentage ?? 0}%`, 400, y + 24);
      }

      // Row border
      ctx.strokeStyle = '#e0e0e0';
      ctx.beginPath();
      ctx.moveTo(0, y + rowHeight);
      ctx.lineTo(scrollWidth, y + rowHeight);
      ctx.stroke();
    });

    // Draw table right border
    ctx.strokeStyle = '#bdbdbd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tableWidth, titleOffset);
    ctx.lineTo(tableWidth, titleOffset + headerHeight + this.allTasks.length * rowHeight);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Draw timeline header
    const timelineX = tableWidth;
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(timelineX, titleOffset, scrollWidth - tableWidth, headerHeight);
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 10px Arial';
    const unitWidth = (scrollWidth - tableWidth) / Math.max(this.timelineDates.length, 1);
    this.timelineDates.forEach((date, i) => {
      const x = timelineX + i * unitWidth;
      const label = date.toLocaleDateString('en', this.zoomLevel === 'month' ? { month: 'short', year: 'numeric' } : { month: 'short', day: 'numeric' });
      ctx.fillText(label, x + 4, titleOffset + 24);
      ctx.strokeStyle = '#e8e8e8';
      ctx.beginPath();
      ctx.moveTo(x, titleOffset);
      ctx.lineTo(x, titleOffset + headerHeight + this.allTasks.length * rowHeight);
      ctx.stroke();
    });

    // Draw gantt bars
    const totalMs = this.projectEndMs - this.projectStartMs;
    this.allTasks.forEach((task, i) => {
      if (!task.startDate || !task.endDate) return;
      const y = titleOffset + headerHeight + i * rowHeight;
      const taskStartMs = new Date(task.startDate).getTime();
      const taskEndMs = new Date(task.endDate).getTime();
      const barLeft = ((taskStartMs - this.projectStartMs) / totalMs) * (scrollWidth - tableWidth);
      const barWidth = Math.max(((taskEndMs - taskStartMs) / totalMs) * (scrollWidth - tableWidth), 4);

      if (task.isProjectHeader) {
        ctx.fillStyle = 'rgba(21, 101, 192, 0.5)';
        ctx.beginPath();
        ctx.roundRect(timelineX + barLeft, y + 16, barWidth, 8, 4);
        ctx.fill();
      } else if (task.isMilestone) {
        ctx.fillStyle = '#e91e63';
        ctx.save();
        ctx.translate(timelineX + barLeft + 6, y + 20);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-5, -5, 10, 10);
        ctx.restore();
      } else {
        const isCompleted = task.status === 'DONE' || task.status === 'COMPLETED';
        ctx.fillStyle = task.isCriticalPath ? '#ffcdd2' : (isCompleted ? '#c8e6c9' : '#bbdefb');
        ctx.beginPath();
        ctx.roundRect(timelineX + barLeft, y + 8, barWidth, 24, 4);
        ctx.fill();

        // Progress fill
        const fillWidth = barWidth * (task.completionPercentage ?? 0) / 100;
        if (fillWidth > 0) {
          ctx.fillStyle = task.isCriticalPath ? '#f44336' : (isCompleted ? '#4caf50' : '#1976d2');
          ctx.beginPath();
          ctx.roundRect(timelineX + barLeft, y + 8, fillWidth, 24, 4);
          ctx.fill();
        }
      }
    });

    // Download
    canvas.toBlob(blob => {
      if (blob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${this.getFileName()}.png`;
        link.click();
        URL.revokeObjectURL(link.href);
        this.snackBar.open('Exported to PNG', 'Close', { duration: 2000 });
      }
    }, 'image/png');
  }
}

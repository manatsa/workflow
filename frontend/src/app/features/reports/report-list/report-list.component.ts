import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { ReportService, ReportDefinition } from '@core/services/report.service';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTabsModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  template: `
    <div class="reports-container">
      <div class="header">
        <div class="header-content">
          <h1>Reports</h1>
          <p class="subtitle">Generate insights and analytics from your workflow data</p>
        </div>
        <div class="header-stats">
          <mat-chip>{{ allReports.length }} Reports Available</mat-chip>
        </div>
      </div>

      <mat-card class="search-card">
        <mat-card-content>
          <div class="search-toolbar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search Reports</mat-label>
              <input matInput [(ngModel)]="searchTerm" (keyup)="filterReports()"
                     placeholder="Search by name or description">
              <mat-icon matPrefix>search</mat-icon>
              @if (searchTerm) {
                <button matSuffix mat-icon-button (click)="clearSearch()">
                  <mat-icon>clear</mat-icon>
                </button>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select [(ngModel)]="selectedCategory" (selectionChange)="filterReports()">
                <mat-option value="">All Categories</mat-option>
                @for (category of categories; track category.id) {
                  <mat-option [value]="category.id">
                    <mat-icon>{{ category.icon }}</mat-icon>
                    {{ category.name }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-tab-group class="category-tabs" (selectedTabChange)="onTabChange($event)">
        <mat-tab label="All Reports">
          <ng-template matTabLabel>
            <mat-icon>apps</mat-icon>
            <span>All Reports</span>
            <span class="tab-count">{{ allReports.length }}</span>
          </ng-template>
        </mat-tab>
        @for (category of categories; track category.id) {
          <mat-tab>
            <ng-template matTabLabel>
              <mat-icon>{{ category.icon }}</mat-icon>
              <span>{{ category.name }}</span>
              <span class="tab-count">{{ getReportCountByCategory(category.id) }}</span>
            </ng-template>
          </mat-tab>
        }
      </mat-tab-group>

      @if (filteredReports.length === 0) {
        <div class="empty-state">
          <mat-icon>search_off</mat-icon>
          <h3>No Reports Found</h3>
          <p>Try adjusting your search or filter criteria</p>
          <button mat-raised-button color="primary" (click)="clearSearch()">Clear Filters</button>
        </div>
      } @else {
        <div class="reports-grid">
          @for (category of getDisplayCategories(); track category.id) {
            <div class="category-section">
              <div class="category-header">
                <mat-icon>{{ category.icon }}</mat-icon>
                <div class="category-info">
                  <h2>{{ category.name }}</h2>
                  <p>{{ category.description }}</p>
                </div>
                <span class="report-count">{{ getFilteredReportsByCategory(category.id).length }} reports</span>
              </div>

              <div class="reports-row">
                @for (report of getFilteredReportsByCategory(category.id); track report.id) {
                  <mat-card class="report-card" [routerLink]="['/reports', report.id]">
                    <mat-card-content>
                      <div class="report-icon">
                        <mat-icon>{{ report.icon }}</mat-icon>
                      </div>
                      <div class="report-info">
                        <h3>{{ report.name }}</h3>
                        <p>{{ report.description }}</p>
                      </div>
                      <button mat-icon-button class="run-btn" matTooltip="Run Report">
                        <mat-icon>play_arrow</mat-icon>
                      </button>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Quick Access Section -->
      <mat-card class="quick-access-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>star</mat-icon>
            Popular Reports
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="quick-reports">
            @for (report of popularReports; track report.id) {
              <a class="quick-report-link" [routerLink]="['/reports', report.id]">
                <mat-icon>{{ report.icon }}</mat-icon>
                <span>{{ report.name }}</span>
              </a>
            }
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .reports-container { padding: 1rem; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .header-content h1 { margin: 0; }
    .header-content .subtitle {
      color: #666;
      margin: 0.25rem 0 0 0;
      font-size: 0.9rem;
    }

    .search-card {
      margin-bottom: 1.5rem;
    }

    .search-toolbar {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .search-field { flex: 1; max-width: 500px; }

    .category-tabs {
      margin-bottom: 1.5rem;
    }

    .category-tabs ::ng-deep .mat-mdc-tab {
      min-width: auto;
      padding: 0 16px;
    }

    .category-tabs ::ng-deep .mat-mdc-tab .mdc-tab__content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tab-count {
      background: rgba(0,0,0,0.1);
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.75rem;
      margin-left: 4px;
    }

    .reports-grid {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .category-section {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .category-header mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }

    .category-info {
      flex: 1;
    }

    .category-info h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .category-info p {
      margin: 0.25rem 0 0 0;
      color: #666;
      font-size: 0.85rem;
    }

    .report-count {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .reports-row {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .report-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 1px solid #e0e0e0;
    }

    .report-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .report-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem !important;
    }

    .report-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      background: #e3f2fd;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .report-icon mat-icon {
      color: #1976d2;
      font-size: 24px;
    }

    .report-info {
      flex: 1;
      min-width: 0;
    }

    .report-info h3 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .report-info p {
      margin: 0.25rem 0 0 0;
      font-size: 0.8rem;
      color: #666;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .run-btn {
      opacity: 0;
      transition: opacity 0.2s;
    }

    .report-card:hover .run-btn {
      opacity: 1;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 8px;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #999;
    }

    .empty-state h3 {
      margin: 1rem 0 0.5rem;
      color: #333;
    }

    .empty-state p {
      margin: 0 0 1.5rem;
      color: #666;
    }

    .quick-access-card {
      margin-top: 2rem;
    }

    .quick-access-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
    }

    .quick-reports {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .quick-report-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f5f5f5;
      border-radius: 20px;
      text-decoration: none;
      color: #333;
      font-size: 0.85rem;
      transition: background 0.2s, color 0.2s;
    }

    .quick-report-link:hover {
      background: #1976d2;
      color: white;
    }

    .quick-report-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class ReportListComponent implements OnInit {
  allReports: ReportDefinition[] = [];
  filteredReports: ReportDefinition[] = [];
  categories: { id: string; name: string; icon: string; description: string }[] = [];
  searchTerm = '';
  selectedCategory = '';
  selectedTabIndex = 0;

  popularReports: ReportDefinition[] = [];

  constructor(private reportService: ReportService) {}

  ngOnInit() {
    this.categories = this.reportService.getReportCategories();
    this.allReports = this.reportService.getAllReports();
    this.filteredReports = [...this.allReports];

    // Set popular reports
    this.popularReports = [
      this.allReports.find(r => r.id === 'executive-dashboard')!,
      this.allReports.find(r => r.id === 'submissions-by-status')!,
      this.allReports.find(r => r.id === 'pending-approvals-aging')!,
      this.allReports.find(r => r.id === 'average-processing-time')!,
      this.allReports.find(r => r.id === 'user-activity-summary')!,
      this.allReports.find(r => r.id === 'workflow-usage')!,
      this.allReports.find(r => r.id === 'monthly-trends')!,
      this.allReports.find(r => r.id === 'audit-trail')!
    ].filter(r => r);
  }

  filterReports() {
    let reports = [...this.allReports];

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      reports = reports.filter(r =>
        r.name.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (this.selectedCategory) {
      reports = reports.filter(r => r.category === this.selectedCategory);
    }

    this.filteredReports = reports;
  }

  clearSearch() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.filterReports();
  }

  onTabChange(event: any) {
    this.selectedTabIndex = event.index;
    if (event.index === 0) {
      this.selectedCategory = '';
    } else {
      this.selectedCategory = this.categories[event.index - 1]?.id || '';
    }
    this.filterReports();
  }

  getReportCountByCategory(categoryId: string): number {
    return this.allReports.filter(r => r.category === categoryId).length;
  }

  getFilteredReportsByCategory(categoryId: string): ReportDefinition[] {
    return this.filteredReports.filter(r => r.category === categoryId);
  }

  getDisplayCategories() {
    if (this.selectedCategory) {
      return this.categories.filter(c => c.id === this.selectedCategory);
    }
    // Only show categories that have filtered reports
    return this.categories.filter(c => this.getFilteredReportsByCategory(c.id).length > 0);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ThemeSettings {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private apiUrl = environment.apiUrl;
  private themeSettings$ = new BehaviorSubject<ThemeSettings>({});

  // Map of setting keys to CSS variable names
  private readonly settingToCssVar: Record<string, string> = {
    'theme.primary.color': '--primary-color',
    'theme.secondary.color': '--secondary-color',
    'theme.accent.color': '--accent-color',
    'theme.sidebar.bg': '--sidebar-bg',
    'theme.sidebar.text': '--sidebar-text',
    'theme.sidebar.header.bg': '--sidebar-header-bg',
    'theme.sidebar.footer.bg': '--sidebar-footer-bg',
    'theme.header.bg': '--header-bg',
    'theme.header.text': '--header-text',
    'theme.brand.color': '--brand-color',
    'theme.user.profile.bg': '--user-profile-bg',
    'theme.user.profile.text': '--user-profile-text',
    'theme.success.color': '--success-color',
    'theme.warning.color': '--warning-color',
    'theme.error.color': '--error-color',
    'theme.info.color': '--info-color',
    'theme.body.bg': '--body-bg',
    'theme.card.bg': '--card-bg',
    'theme.border.color': '--border-color',
    'theme.table.header.bg': '--table-header-bg',
    'theme.table.stripe.bg': '--table-stripe-bg',
    'theme.button.primary.bg': '--button-primary-bg',
    'theme.button.primary.text': '--button-primary-text',
    'theme.button.secondary.bg': '--button-secondary-bg',
    'theme.button.secondary.text': '--button-secondary-text',
    'theme.link.color': '--link-color',
    'theme.link.hover.color': '--link-hover-color',
    'theme.input.bg': '--input-bg',
    'theme.input.border': '--input-border',
    'theme.input.focus.border': '--input-focus-border',
    'theme.menu.active.bg': '--menu-active-bg',
    'theme.menu.hover.bg': '--menu-hover-bg',
    'theme.badge.pending.bg': '--badge-pending-bg',
    'theme.badge.approved.bg': '--badge-approved-bg',
    'theme.badge.rejected.bg': '--badge-rejected-bg',
    'theme.font.primary': '--font-primary',
    'theme.font.size.base': '--font-size-base',
    'theme.form.field.header.bg': '--form-field-header-bg',
    'theme.form.field.header.color': '--form-field-header-color'
  };

  constructor(private http: HttpClient) {}

  loadTheme(): void {
    // Try to load from localStorage first for instant display
    const cached = localStorage.getItem('themeSettings');
    if (cached) {
      try {
        const settings = JSON.parse(cached);
        this.applyTheme(settings);
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Then load fresh from API
    this.http.get<any>(`${this.apiUrl}/settings/tab/Theme%20Settings`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const settings: ThemeSettings = {};
          res.data.forEach((setting: any) => {
            settings[setting.key] = setting.value;
          });
          this.themeSettings$.next(settings);
          this.applyTheme(settings);
          localStorage.setItem('themeSettings', JSON.stringify(settings));
        }
      },
      error: (err) => {
        console.warn('Failed to load theme settings:', err);
      }
    });
  }

  applyTheme(settings: ThemeSettings): void {
    const root = document.documentElement;

    Object.entries(settings).forEach(([key, value]) => {
      const cssVar = this.settingToCssVar[key];
      if (cssVar && value) {
        // Handle font size specially (add 'px' if it's a number)
        if (key === 'theme.font.size.base' && !isNaN(Number(value))) {
          root.style.setProperty(cssVar, `${value}px`);
        } else {
          root.style.setProperty(cssVar, value);
        }
      }
    });

    // Handle dark mode
    if (settings['theme.dark.mode'] === 'true') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  refreshTheme(): void {
    this.loadTheme();
  }

  getThemeSettings() {
    return this.themeSettings$.asObservable();
  }
}

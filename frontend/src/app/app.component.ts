import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommandConsoleComponent } from './shared/components/command-console/command-console.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommandConsoleComponent],
  template: `
    <router-outlet></router-outlet>
    @if (showConsole && isSuperUser) {
      <app-command-console (close)="showConsole = false"></app-command-console>
    }
  `
})
export class AppComponent {
  showConsole = false;

  constructor(private authService: AuthService) {}

  get isSuperUser(): boolean {
    return this.authService.currentUser?.username === 'super';
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'p') {
      event.preventDefault();
      if (this.isSuperUser) {
        this.showConsole = !this.showConsole;
      }
    }
  }
}

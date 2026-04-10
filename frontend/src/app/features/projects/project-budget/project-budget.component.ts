import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-project-budget',
  standalone: true,
  template: `<p>Redirecting...</p>`
})
export class ProjectBudgetComponent implements OnInit {
  constructor(private router: Router, private route: ActivatedRoute) {}
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/projects', id], { fragment: 'budget' });
  }
}

import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-signout',
  templateUrl: './signout.component.html',
  styleUrl: './signout.component.css'
})
export class SignoutComponent implements OnInit {

  constructor(
    private _authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this._authService.signout();
    this.router.navigate(['start']);
  }
}

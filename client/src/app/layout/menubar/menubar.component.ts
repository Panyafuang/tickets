import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { IUser } from '../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menubar',
  templateUrl: './menubar.component.html',
  styleUrls: ['./menubar.component.css'], // Use styleUrls
})
export class MenubarComponent implements OnInit, OnDestroy {
  currUser: IUser | undefined | null;
  currUserSup!: Subscription;

  constructor(private _authService: AuthService) { }

  ngOnInit(): void {
    this.currUserSup = this._authService.currentUser$.subscribe(data => {
      this.currUser = data;
    });
  }

  ngOnDestroy() {
    this.currUserSup.unsubscribe();
  }

  toggleSidebar() {
    // Implement your sidebar toggle logic here (e.g., using MatSidenav)
    console.log('Toggle sidebar clicked!');
  }
}
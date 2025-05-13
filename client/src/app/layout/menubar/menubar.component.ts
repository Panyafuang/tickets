import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { IUser } from '../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menubar',
  templateUrl: './menubar.component.html',
  styleUrl: './menubar.component.css'
})
export class MenubarComponent implements OnInit, OnDestroy {
  currUser: IUser | undefined | null;
  currUserSup!: Subscription;

  constructor(private _authService: AuthService) {

  }


  ngOnInit(): void {
    // this._authService.getUserDetail();
    this.currUserSup = this._authService.userUpdated.subscribe(data => {
      this.currUser = data;
    });
  }

  ngOnDestroy() {
    this.currUserSup.unsubscribe();
  }
}

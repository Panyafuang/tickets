import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { IUser } from '../models/user.model';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrl: './start.component.css',
})
export class StartComponent implements OnInit, OnDestroy {
  currUser!: IUser | null | undefined;
  currUserSub!: Subscription;

  constructor(private _authService: AuthService) {}

  ngOnInit(): void {
    // this._authService.getUserDetail();
    this.currUserSub = this._authService.userUpdated.subscribe(data => {
      this.currUser = data;
    })
  }

  ngOnDestroy() {
    this.currUserSub.unsubscribe();
  }
}

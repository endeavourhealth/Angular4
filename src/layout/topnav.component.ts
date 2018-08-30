import { Component, OnInit } from '@angular/core';
import {AbstractMenuProvider} from "./menuProvider.service";
import {SecurityService} from "../security/security.service";
import {User} from "../security/models/User";
import {UserRole} from "../user-manager/models/UserRole";
import {UserManagerService} from "../user-manager/user-manager.service";
import {LoggerService} from "../logger/logger.service";

@Component({
  selector: 'topnav',
  template: `  <div class="title-bar">
      <span class="navbar-header" style="width: 50%">
        <img class="logo-image">
        <span class="title-text">{{getApplicationTitle()}}</span>
      </span>
		<div class="pull-right" style="padding: 10px;color:gray">

            <div ngbDropdown class="d-inline-block">
                Signed in :
                <button class="btn btn-info btn-sm" id="roleDropdown" ngbDropdownToggle>{{currentUser.title}} {{currentUser.forename}} {{currentUser.surname}}</button>
                <div class="dropdown-menu dropdown-menu-right" aria-labelledby="roleDropdown">
                    <div *ngFor="let role of userRoles" >
                        <div  class="dropdown-item">
                            <div class="row align-items-center">
                                <div [ngClass]="{'active': role == selectedRole}" class="col-md-10 role-menu-description hoverable" (click)="changeRole(role)">
                                    <p class="mb-0"><b>{{role.roleTypeName}}</b></p>
                                    <p class="mb-0 text-uppercase"><small>{{role.organisationName}}</small></p>
                                </div>
                                <div *ngIf="role.default" class="col-md-2">
                                    <i class="fa fa-star" (click)="setAsDefaultRole(role)"></i>
                                </div>
                                <div *ngIf="!role.default" class="col-md-2">
                                    <i class="fa fa-star-o" (click)="setAsDefaultRole(role)"></i>
                                </div>
                            </div>
                        </div>
                      <div class="dropdown-divider"></div>
                    </div>
                    <div class="dropdown-item">
                        <div class="pull-right">
                          <button type="button" class="btn btn-success"(click)="navigateUserAccount()">User account</button>
                          <button type="button" class="btn btn-danger"(click)="logout()">Sign out</button>
                        </div>
                    </div>
                    
                </div>
            </div>
		</div>
	</div>`,
  styles: [`
      .title-bar {
          position: fixed;
          background: #fbfbfb;
          z-index:1001;
          width: 100%;
      }
      .title-text {
          font-size: 28px;
          line-height: 50px;
          color: gray;
          margin-left:10px;
          vertical-align: middle;
      }

      .loggedin-text {
          color: gray;
          line-height: 50px;
          vertical-align: middle;
          margin-right: 10px;
      }

      .logo-image {
          height: 50px;
          width: 50px;
          margin: 5px;
      }
	`]
})
export class TopnavComponent implements OnInit {
  currentUser:User;
  userRoles: UserRole[] = [];
  selectedRole: UserRole;
  roleDetails = false;

  constructor(private securityService:SecurityService, private menuProvider : AbstractMenuProvider,
              private userManagerService: UserManagerService,
              protected logger : LoggerService) {
    let vm = this;

    vm.currentUser = this.securityService.getCurrentUser();
    if (this.menuProvider.useUserManagerForRoles()) {
      vm.roleDetails = true;
      vm.getUserRoles();
    } else {
      vm.roleDetails = false;
    }
  }

  ngOnInit(): void {
  }

  getApplicationTitle() : string {
    return this.menuProvider.getApplicationTitle();
  }

  navigateUserAccount() {
    var url = window.location.protocol + "//" + window.location.host;
    url = url + "/new-user-manager/#/userView";
    window.open(url, '_blank');
  }

  logout() {
    this.securityService.logout();
  };

  getUserRoles(setdefault: boolean = true) {
    const vm = this;
      vm.userManagerService.getUserRoles(vm.currentUser.uuid)
          .subscribe(
              (result) => {
                  vm.userRoles = result;
                  if (setdefault) {
                      vm.findDefaultRole();
                  } else  {
                      vm.setCurrentlyActiveRole();
                  }
              }
          );
  }

  findDefaultRole() {
    const vm = this;
    let fallbackRole : UserRole = null;
    for (let role of vm.userRoles) {
      fallbackRole = role;
      if (role.default) {
        vm.changeRole(role);
        return;
      }
    }
    if (fallbackRole != null) {
        vm.changeRole(fallbackRole);
    }
  }

  setCurrentlyActiveRole() {
      const vm = this;
      for (let role of vm.userRoles) {
          if (role.id === vm.selectedRole.id) {
              vm.selectedRole = role;
          }
      }
  }

  changeRole(role: UserRole) {
    const vm = this;
    vm.selectedRole = role;
    vm.userManagerService.changeUserRole(role);
  }

  setAsDefaultRole(role: UserRole) {
      const vm = this;
      vm.userManagerService.changeDefaultRole(vm.currentUser.uuid, role.id, vm.selectedRole.id)
          .subscribe(
              (result) => {
                vm.logger.success('Default role changed', null, 'Change default role');
                vm.getUserRoles(false);
              },
              (error) => {
                  vm.logger.error('Error changing default role', error, 'Error');
              }
          );
  }
}

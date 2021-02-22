import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticationService } from 'src/app/services/authentication/AuthenticationService';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
})
export class LoginComponent {
    public errorMessage: string;

    public loginForm = new FormGroup({
        email: new FormControl(),
        password: new FormControl(),
    });

    constructor(private router: Router,
                private authenticationService: AuthenticationService) {
    }
    public loginWithEmail(value: {email: string, password: string}) {
        this.authenticationService
            .doEmailLogin(value.email, value.password)
            .then(this.redirect)
            .catch((err) => this.errorMessage = err.message);
    }
    public loginWithGoogle() {
        this.authenticationService
            .doGoogleLogin()
            .then(this.redirect)
            .catch((err) => this.errorMessage = err.message);
    }
    private redirect = () => {
        this.router.navigate(['/server']);
    }
}

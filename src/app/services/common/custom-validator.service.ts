import { Injectable } from '@angular/core';
import { FormGroup, NgForm } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class CustomValidatorService {
  
  constructor() { }


  phoneNumberFormat(event, element: HTMLInputElement, form: NgForm) {
    const cleaned = (event.target.value).replace(/\D/g, '');
    if (cleaned !== '') {
      if (cleaned.length <= 10) {
        if (cleaned.length === 4) {
          const match = cleaned.match(/(\d{3})(\d{1})/);
          if (match) {
            element.value = match[1] + '-' + match[2];
          }
        } else if (cleaned.length == 7) {
          const match = cleaned.match(/(\d{3})(\d{3})(\d{1})/);
          if (match) {
            element.value = match[1] + '-' + match[2] + '-' + match[3];
          }
        } else if (cleaned.length == 10) {
          const match = cleaned.match(/(\d{3})(\d{3})(\d{4})/);
          if (match) {
            element.value = match[1] + '-' + match[2] + '-' + match[3];
          }
        } else {
          element.value = element.value.replace(/(?=[^-])(?=[\D])./, '');
        }
      } else {
        element.value = event.target.value.slice(0, 12);
      }
    } else {
      element.value = '';
    }
  
  }

  preventEnter(event, formController) {
    const flag = (formController.value == undefined || formController.value == '') ? true : false;
    if (event.charCode == 32 && flag) {
      event.preventDefault();
    }
  }

  MatchPassword(password: string, confirmPassword: string) {
    return (formGroup: FormGroup) => {
      const passwordControl = formGroup.controls[password];
      const confirmPasswordControl = formGroup.controls[confirmPassword];

      if (!passwordControl || !confirmPasswordControl) {
        return null;
      }

      if (confirmPasswordControl.errors && !confirmPasswordControl.errors.passwordMismatch) {
        return null;
      }

      if (passwordControl.value !== confirmPasswordControl.value) {
        confirmPasswordControl.setErrors({ passwordMismatch: true });
      } else {
        confirmPasswordControl.setErrors(null);
      }
    }
  }
 
}

import { Directive, Input } from '@angular/core';
import { FormGroup, NG_VALIDATORS, ValidationErrors } from '@angular/forms';
import { CustomValidatorService } from 'src/app/services/common/custom-validator.service';

@Directive({
  selector: '[appPasswordMatch]',
  providers: [{ provide: NG_VALIDATORS, useExisting: PasswordMatchDirective, multi: true }]

})

export class PasswordMatchDirective {

  @Input('appPasswordMatch') MatchPassword: string[] = [];

  constructor(private customValidator: CustomValidatorService) { }

  validate(formGroup: FormGroup): ValidationErrors {
    return this.customValidator.MatchPassword(this.MatchPassword[0], this.MatchPassword[1])(formGroup);
  }
}

import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint()
class IsPasswordConstraint implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    const digitRegex = /(?=.*\d)/;
    const uppercaseRegex = /(?=.*[A-Z])/;
    return digitRegex.test(text) && uppercaseRegex.test(text);
  }

  defaultMessage() {
    return 'Password must be at least 1 digit and 1 uppercase';
  }
}

export function IsPassword(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPasswordConstraint,
    });
  };
}

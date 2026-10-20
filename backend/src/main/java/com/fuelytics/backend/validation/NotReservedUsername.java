package com.fuelytics.backend.validation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = NotReservedUsername.Validator.class)
public @interface NotReservedUsername {
    String message() default ReservedUsernames.MESSAGE;
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<NotReservedUsername, String> {
        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            return !ReservedUsernames.isReserved(value);
        }
    }
}

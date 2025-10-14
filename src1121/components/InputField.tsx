// src/components/InputField.tsx
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import FormError from './forms/FormError';
import type { FieldError, FieldValues, UseFormRegister, Path } from "react-hook-form";

type InputFieldProps<T extends FieldValues> = {
  label: string;
  type?: string;
  register: UseFormRegister<T>;
  name: Path<T>;
  error?: FieldError;
  hidden?: boolean;
  disabled?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'>;

const InputField = <T extends FieldValues>({
  label,
  type = "text",
  register,
  name,
  error,
  hidden,
  disabled,
  className,
  ...props
}: InputFieldProps<T>) => {
  return (
    <div className={hidden ? "hidden" : "grid w-full items-center gap-1.5"}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        {...register(name)}
        disabled={disabled}
        aria-invalid={error ? "true" : "false"}
        className={className}
        {...props}
      />
      <FormError error={error} />
    </div>
  );
};

export default InputField;

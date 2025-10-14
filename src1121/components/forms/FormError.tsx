// src/components/forms/FormError.tsx
import type { FieldError } from "react-hook-form";
import { cn } from "@/lib/utils";

interface FormErrorProps {
  error?: FieldError;
  className?: string;
}

const FormError: React.FC<FormErrorProps> = ({ error, className }) => {
  if (!error?.message) return null;

  return (
    <p className={cn("text-sm text-destructive", className)}>
      {error.message.toString()}
    </p>
  );
};

export default FormError;

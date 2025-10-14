import InputField from "@/components/InputField";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { GradeSchema } from "@/lib/formValidationSchemas";

interface FormFieldsProps {
  register: UseFormRegister<GradeSchema>;
  errors: FieldErrors<GradeSchema>;
  isLoading: boolean;
}

const FormFields = ({ register, errors, isLoading }: FormFieldsProps) => {
  return (
    <div className="flex flex-col gap-4">
      <InputField
        label="Niveau (ex: 1, 2, 3)"
        name="level"
        type="number"
        register={register}
        error={errors?.level}
        disabled={isLoading}
        className="md:w-full"
      />
    </div>
  );
};

export default FormFields;

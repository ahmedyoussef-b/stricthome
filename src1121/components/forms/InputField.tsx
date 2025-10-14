import FormError from "./FormError";
import type { FieldError, FieldValues, UseFormRegister } from "react-hook-form";

type InputFieldProps = {
  label: string;
  type?: string;
  register: UseFormRegister<FieldValues>;
  name: string;
  defaultValue?: string;
  error?: FieldError;
  hidden?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  disabled?: boolean | undefined
};

const InputField = ({
  label,
  type = "text",
  register,
  name,
  defaultValue,
  error,
  hidden,
  inputProps,
  disabled,
}: InputFieldProps) => {
  return (
    <div className={hidden ? "hidden" : "flex flex-col gap-2 w-full"}>
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type={type}
        {...register(name)}
        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
        {...inputProps}
        defaultValue={defaultValue}
        disabled={disabled} // Pass disabled to the input
      />
      <FormError error={error} />
    </div>
  );
};

export default InputField;

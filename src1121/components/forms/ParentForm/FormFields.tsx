//src/components/fors/ParentForm/FormFields.tsx
import InputField from "@/components/InputField";
import ImageUpload from "./ImageUpload";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form"; // Import UseFormSetValue
import { ParentSchema } from "@/lib/formValidationSchemas";

interface FormFieldsProps {
  register: UseFormRegister<ParentSchema>;
  errors: FieldErrors<ParentSchema>;
  isLoading: boolean;
  setValue: UseFormSetValue<ParentSchema>;
  imgPreview: string | null | undefined;
  type: 'create' | 'update';
}

const FormFields = ({
  register,
  errors,
  isLoading,
  setValue,
  imgPreview,
  type,
}: FormFieldsProps) => {
  return (
    <>
      <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border p-4 rounded-md">
        <legend className="text-sm font-medium text-muted-foreground px-1">Authentification</legend>
        <InputField label="Nom d'utilisateur" name="username" register={register} error={errors.username} disabled={isLoading} />
        <InputField label="E-mail" name="email" type="email" register={register} error={errors.email} disabled={isLoading} />
        <InputField 
          label={type === 'update' ? "Nouveau mot de passe (optionnel)" : "Mot de passe"} 
          name="password" 
          type="password" 
          register={register} 
          error={errors.password} 
          disabled={isLoading} 
        />
      </fieldset>

      <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border p-4 rounded-md">
        <legend className="text-sm font-medium text-muted-foreground px-1">Informations Personnelles</legend>
        <InputField label="Prénom" name="name" register={register} error={errors.name} disabled={isLoading} />
        <InputField label="Nom" name="surname" register={register} error={errors.surname} disabled={isLoading} />
        <InputField label="Adresse" name="address" register={register} error={errors.address} disabled={isLoading} />
        <InputField label="Téléphone (Optionnel)" name="phone" register={register} error={errors.phone} disabled={isLoading} />
        
        <ImageUpload 
          setValue={setValue}
          imgPreview={imgPreview}
          isLoading={isLoading}
          error={errors.img}
        />
      </fieldset>
    </>
  );
};

export default FormFields;

// src/components/forms/TeacherForm/FormFields.tsx
import ImageUpload from "./ImageUpload";
import DatePicker from "./DatePicker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserSex, Role, Subject, TeacherSchema } from "@/types/index";
import InputField from "@/components/InputField";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";


interface FormFieldsProps {
  register: UseFormRegister<TeacherSchema>;
  errors: FieldErrors<TeacherSchema>;
  isLoading: boolean;
  setValue: UseFormSetValue<TeacherSchema>;
  sexWatch: UserSex | null | undefined;
  birthdayWatch: Date | null | undefined;
  imgPreview: string | null | undefined;
  availableSubjects: Subject[];
  type: 'create' | 'update';
}

const FormFields = ({
  register,
  errors,
  isLoading,
  setValue,
  sexWatch,
  birthdayWatch,
  imgPreview,
  availableSubjects,
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
        <InputField label="Groupe Sanguin" name="bloodType" register={register} error={errors.bloodType} disabled={isLoading} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
          <RadioGroup
            onValueChange={(value: string) => setValue("sex", value as UserSex)}
            value={sexWatch || undefined}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={UserSex.MALE} id="sex-male" disabled={isLoading} />
              <label htmlFor="sex-male">Masculin</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={UserSex.FEMALE} id="sex-female" disabled={isLoading} />
              <label htmlFor="sex-female">Féminin</label>
            </div>
          </RadioGroup>
          {errors.sex && <p className="mt-1 text-sm text-red-600">{errors.sex.message}</p>}
        </div>

        <DatePicker
          value={birthdayWatch}
          onChange={(date) => setValue("birthday", date, { shouldValidate: true })}
          error={errors.birthday}
          disabled={isLoading}
        />

        <div className="md:col-span-1">
          <label htmlFor="subjects-select" className="block text-sm font-medium text-gray-700 mb-1">Matières Enseignées</label>
          <select
            id="subjects-select"
            multiple
            {...register("subjects")}
            className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:opacity-50 h-24 p-2 ring-[1.5px] ring-gray-300 text-sm"
            disabled={isLoading}
          >
            {availableSubjects.map(subject => (
              <option key={subject.id} value={String(subject.id)}>{subject.name}</option>
            ))}
          </select>
          {errors.subjects && <p className="mt-1 text-sm text-red-600">{errors.subjects.message}</p>}
        </div>

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

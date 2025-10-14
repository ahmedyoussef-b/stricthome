//src/components/StudentForm/FormFields.tsx
import React from "react";
import InputField from "@/components/InputField";
import ImageUpload from "./ImageUpload";
import { UserSex } from "@/types/index";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { StudentSchema } from "@/lib/formValidationSchemas";

interface FormFieldsProps {
  register: UseFormRegister<StudentSchema>;
  errors: FieldErrors<StudentSchema>;
  isLoading: boolean;
  setValue: UseFormSetValue<StudentSchema>;
  imgPreview: string | null | undefined;
  relatedData?: {
    grades?: { id: number; level: number }[];
    classes?: { id: number; name: string; capacity: number; _count: { students: number } }[];
    parents?: { id: string; name: string; surname: string }[];
  };
  type: "create" | "update";
  data?: Partial<StudentSchema> & { id?: string };
}

const FormFields = ({
  register,
  errors,
  isLoading,
  setValue,
  imgPreview,
  relatedData,
  type,
  data,
}: FormFieldsProps) => {
  const { grades = [], classes = [], parents = [] } = relatedData || {};

  return (
    <>
      <span className="text-xs text-gray-400 font-medium">Informations d'Authentification</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="Nom d'utilisateur" name="username" register={register} error={errors?.username} disabled={isLoading}/>
        <InputField label="E-mail" name="email" type="email" register={register} error={errors?.email} disabled={isLoading}/>
        <InputField 
          label={type === 'create' ? "Mot de passe" : "Nouveau Mot de passe (optionnel)"} 
          name="password" 
          type="password" 
          register={register} 
          error={errors?.password} 
          disabled={isLoading}
        />
      </div>

      <span className="text-xs text-gray-400 font-medium">Informations Personnelles</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="Prénom" name="name" register={register} error={errors.name} disabled={isLoading}/>
        <InputField label="Nom" name="surname" register={register} error={errors.surname} disabled={isLoading}/>
        <InputField label="Téléphone" name="phone" type="tel" register={register} error={errors.phone} disabled={isLoading}/>
        <InputField label="Adresse" name="address" register={register} error={errors.address} disabled={isLoading}/>
        <InputField label="Groupe Sanguin" name="bloodType" register={register} error={errors.bloodType} disabled={isLoading}/>
        <InputField label="Date de Naissance" name="birthday" type="date" register={register} error={errors.birthday} disabled={isLoading}/>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Sexe</label>
          <select 
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50" 
            {...register("sex")} 
            disabled={isLoading}
          >
            <option value={UserSex.MALE}>Masculin</option>
            <option value={UserSex.FEMALE}>Féminin</option>
          </select>
          {errors.sex?.message && <p className="text-xs text-red-400">{errors.sex.message.toString()}</p>}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Niveau</label>
          <select 
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50" 
            {...register("gradeId")} 
            disabled={isLoading}
          >
            <option value="">Sélectionner le Niveau</option>
            {grades.map((grade) => (
              <option value={grade.id} key={grade.id}>{grade.level}</option>
            ))}
          </select>
          {errors.gradeId?.message && <p className="text-xs text-red-400">{errors.gradeId.message.toString()}</p>}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Classe</label>
          <select 
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50" 
            {...register("classId")} 
            disabled={isLoading}
          >
            <option value="">Sélectionner la Classe</option>
            {classes.map((classItem) => (
              <option 
                value={classItem.id} 
                key={classItem.id} 
                disabled={classItem._count.students >= classItem.capacity && type === "create"}
              >
                {classItem.name} ({classItem._count.students}/{classItem.capacity})
              </option>
            ))}
          </select>
          {errors.classId?.message && <p className="text-xs text-red-400">{errors.classId.message.toString()}</p>}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Parent</label>
          <select 
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50" 
            {...register("parentId")} 
            disabled={isLoading}
          >
            <option value="">Sélectionner le Parent</option>
            {parents.map((parent) => (
              <option value={parent.id} key={parent.id}>{parent.name} {parent.surname}</option>
            ))}
          </select>
          {errors.parentId?.message && <p className="text-xs text-red-400">{errors.parentId.message.toString()}</p>}
        </div>
      </div>

      <ImageUpload 
        setValue={setValue}
        imgPreview={imgPreview}
        isLoading={isLoading}
        error={errors.img}
      />
    </>
  );
};

export default FormFields;

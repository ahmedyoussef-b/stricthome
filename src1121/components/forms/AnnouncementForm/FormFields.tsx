// src/components/forms/AnnouncementForm/FormFields.tsx
import React from 'react';
import InputField from "@/components/InputField";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { AnnouncementSchema } from '@/lib/formValidationSchemas';
import { AnnouncementWithClass } from '@/types';

interface FormFieldsProps {
  register: UseFormRegister<AnnouncementSchema>;
  errors: FieldErrors<AnnouncementSchema>;
  isLoading: boolean;
  classes: { id: number; name: string }[];
  data?: AnnouncementWithClass;
}

const FormFields: React.FC<FormFieldsProps> = ({ register, errors, isLoading, classes, data }) => {
  return (
    <>
      <InputField
        label="Titre de l'Annonce"
        name="title"
        register={register as any} // Cast because InputField expects FieldValues
        error={errors.title}
        disabled={isLoading}
      />
      <div>
        <Label htmlFor="description">Contenu</Label>
        <Textarea
          id="description"
          placeholder="Décrivez l'annonce ici..."
          {...register("description")}
          disabled={isLoading}
          className="mt-1"
        />
        {/* The error for description is now handled at the FileUploadSection level */}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Date de publication"
          name="date"
          type="date"
          register={register as any} // Cast because InputField expects FieldValues
          error={errors?.date}
          disabled={isLoading}
        />
        <div className="flex flex-col gap-2 w-full">
          <Label>Classe (Optionnel)</Label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
            {...register("classId")}
            disabled={isLoading}
          >
            <option value="">Toutes les classes</option>
            {classes.map((cls) => (
              <option value={String(cls.id)} key={cls.id}>{cls.name}</option>
            ))}
          </select>
          {errors.classId?.message && <p className="text-xs text-red-400">{errors.classId.message?.toString()}</p>}
        </div>
      </div>
    </>
  );
};

export default FormFields;

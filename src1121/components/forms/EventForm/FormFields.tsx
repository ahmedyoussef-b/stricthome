//src/components/forms/EventF /FormFields.tsx
// import InputField from "@/components/InputField";
import { Textarea } from "@/components/ui/textarea";
import { type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { type EventSchema } from '@/lib/formValidationSchemas';
import { type Event } from '@/types';

interface FormFieldsProps {
  register: UseFormRegister<EventSchema>;
  errors: FieldErrors<EventSchema>;
  isLoading: boolean;
  availableClasses: { id: number; name: string }[];
  initialData?: Event | null;
}

const FormFields = ({ 
  register, 
  errors, 
  isLoading, 
  availableClasses,
  initialData
}: FormFieldsProps) => {
  return (
    <>
      <InputField
        label="Titre"
        name="title"
        register={register as any}
        error={errors.title}
        disabled={isLoading}
        className="md:w-full"
      />
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <Textarea
          id="description"
          {...register("description")}
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Date et heure de début"
          name="startTime"
          type="datetime-local"
          register={register as any}
          error={errors.startTime}
          disabled={isLoading}
          className="md:w-full"
        />
        <InputField
          label="Date et heure de fin"
          name="endTime"
          type="datetime-local"
          register={register as any}
          error={errors.endTime}
          disabled={isLoading}
          className="md:w-full"
        />
      </div>

      <div>
        <label htmlFor="classId" className="block text-sm font-medium text-gray-700">
          Classe (Optionnel)
        </label>
        <select
          id="classId"
          {...register("classId")}
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          defaultValue={initialData?.classId?.toString() ?? "null"}
        >
          <option value="null">Toutes les classes</option>
          {availableClasses.map(classItem => (
            <option key={classItem.id} value={String(classItem.id)}>
              {classItem.name}
            </option>
          ))}
        </select>
        {errors.classId && <p className="mt-1 text-sm text-red-600">{errors.classId.message}</p>}
      </div>
    </>
  );
};

export default FormFields;

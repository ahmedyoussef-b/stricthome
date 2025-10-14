import InputField from "@/components/InputField";
import { Day } from '@/types/index';
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { LessonSchema } from "@/lib/formValidationSchemas";

interface FormFieldsProps {
  register: UseFormRegister<LessonSchema>;
  errors: FieldErrors<LessonSchema>;
  isLoading: boolean;
  relatedData?: {
    subjects?: { id: number; name: string }[];
    classes?: { id: number; name: string }[];
    teachers?: { id: string; name: string; surname: string }[];
    classrooms?: { id: number; name: string }[];
  };
}

const FormFields = ({ register, errors, isLoading, relatedData }: FormFieldsProps) => {
  const { subjects = [], classes = [], teachers = [], classrooms = [] } = relatedData || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InputField 
        label="Nom du cours (ex: Maths 7A - Lundi)" 
        name="name" 
        register={register} 
        error={errors?.name} 
        disabled={isLoading}
      />
      
      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Jour</label>
        <select 
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" 
          {...register("day")} 
          disabled={isLoading}
        >
          {Object.values(Day).map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
        {errors.day?.message && (
          <p className="text-xs text-red-400">{errors.day.message.toString()}</p>
        )}
      </div>

      <InputField 
        label="Heure de début" 
        name="startTime" 
        type="time" 
        register={register} 
        error={errors?.startTime} 
        disabled={isLoading}
      />
      
      <InputField 
        label="Heure de fin" 
        name="endTime" 
        type="time" 
        register={register} 
        error={errors?.endTime} 
        disabled={isLoading}
      />

      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Matière</label>
        <select 
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" 
          {...register("subjectId")} 
          disabled={isLoading}
        >
          <option value="">Sélectionner une matière</option>
          {subjects.map(s => (
            <option key={s.id} value={String(s.id)}>{s.name}</option>
          ))}
        </select>
        {errors.subjectId?.message && (
          <p className="text-xs text-red-400">{errors.subjectId.message.toString()}</p>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Classe</label>
        <select 
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" 
          {...register("classId")} 
          disabled={isLoading}
        >
          <option value="">Sélectionner une classe</option>
          {classes.map(c => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
        {errors.classId?.message && (
          <p className="text-xs text-red-400">{errors.classId.message.toString()}</p>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Enseignant</label>
        <select 
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" 
          {...register("teacherId")} 
          disabled={isLoading}
        >
          <option value="">Sélectionner un enseignant</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.name} {t.surname}</option>
          ))}
        </select>
        {errors.teacherId?.message && (
          <p className="text-xs text-red-400">{errors.teacherId.message.toString()}</p>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Salle de classe (Optionnel)</label>
        <select 
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" 
          {...register("classroomId")} 
          disabled={isLoading}
        >
          <option value="">Aucune salle spécifique</option>
          {classrooms.map(c => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
        {errors.classroomId?.message && (
          <p className="text-xs text-red-400">{errors.classroomId.message.toString()}</p>
        )}
      </div>
    </div>
  );
};

export default FormFields;

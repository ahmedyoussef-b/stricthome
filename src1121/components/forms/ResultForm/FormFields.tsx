
// src/components/forms/ResultForm/FormFields.tsx
import InputField from "@/components/InputField";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Student, Exam, Assignment } from "@/types/index";
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { ResultSchema } from "@/lib/formValidationSchemas";

interface FormFieldsProps {
  register: UseFormRegister<ResultSchema>;
  errors: FieldErrors<ResultSchema>;
  isLoading: boolean;
  setValue: UseFormSetValue<ResultSchema>;
  assessmentType: 'exam' | 'assignment';
  relatedData?: {
    students?: Pick<Student, 'id' | 'name' | 'surname'>[];
    exams?: Pick<Exam, 'id' | 'title'>[];
    assignments?: Pick<Assignment, 'id' | 'title'>[];
  };
  isUpdate: boolean;
}

const FormFields = ({
  register,
  errors,
  isLoading,
  setValue,
  assessmentType,
  relatedData,
  isUpdate,
}: FormFieldsProps) => {
  const { students = [], exams = [], assignments = [] } = relatedData || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InputField
        label="Score"
        name="score"
        type="number"
        register={register}
        error={errors?.score}
        disabled={isLoading}
      />
      <div className="flex flex-col gap-2 w-full">
        <Label>Étudiant</Label>
        <select
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
          {...register("studentId")}
          disabled={isLoading || isUpdate}
        >
          <option value="">Sélectionner un étudiant</option>
          {students.map((student) => (
            <option value={student.id} key={student.id}>
              {student.name} {student.surname}
            </option>
          ))}
        </select>
        {errors.studentId && <p className="text-xs text-red-400">{errors.studentId.message as string}</p>}
      </div>
      
      <div className="md:col-span-2">
        <RadioGroup
          value={assessmentType}
          onValueChange={(value) => setValue("assessmentType", value as 'exam' | 'assignment', { shouldValidate: true })}
          className="flex gap-4"
          disabled={isLoading || isUpdate}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="exam" id="exam" />
            <Label htmlFor="exam">Examen</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="assignment" id="assignment" />
            <Label htmlFor="assignment">Devoir</Label>
          </div>
        </RadioGroup>
      </div>

      {assessmentType === 'exam' && (
        <div className="flex flex-col gap-2 w-full">
          <Label>Examen</Label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
            {...register("examId")}
            disabled={isLoading || isUpdate}
          >
            <option value="">Sélectionner un examen</option>
            {exams.map((exam) => (
              <option value={String(exam.id)} key={exam.id}>{exam.title}</option>
            ))}
          </select>
          {errors.examId && <p className="text-xs text-red-400">{errors.examId.message as string}</p>}
        </div>
      )}

      {assessmentType === 'assignment' && (
        <div className="flex flex-col gap-2 w-full">
          <Label>Devoir</Label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
            {...register("assignmentId")}
            disabled={isLoading || isUpdate}
          >
            <option value="">Sélectionner un devoir</option>
            {assignments.map((assignment) => (
              <option value={String(assignment.id)} key={assignment.id}>{assignment.title}</option>
            ))}
          </select>
          {errors.assignmentId && <p className="text-xs text-red-400">{errors.assignmentId.message as string}</p>}
        </div>
      )}
    </div>
  );
};

export default FormFields;

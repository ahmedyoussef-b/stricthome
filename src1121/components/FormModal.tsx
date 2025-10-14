//src/components/FormModal.tsx
"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction, FC } from "react";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import type { FormContainerProps } from "@/components/forms/types";
import {
  useDeleteSubjectMutation,
  useDeleteClassMutation,
  useDeleteTeacherMutation,
  useDeleteStudentMutation,
  useDeleteExamMutation,
  useDeleteAssignmentMutation,
  useDeleteEventMutation,
  useDeleteAnnouncementMutation,
  useDeleteParentMutation,
  useDeleteLessonMutation,
  useDeleteResultMutation,
  useDeleteAttendanceMutation,
  useDeleteGradeMutation,
} from "../lib/redux/api/entityApi/";
import { Plus, Pencil, Trash2, X as CloseIcon } from 'lucide-react';
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

// LAZY LOADING FORMS
const TeacherForm = dynamic(() => import("./forms/TeacherForm/TeacherForm"), { loading: () => <p>Chargement du formulaire...</p> });
const StudentForm = dynamic(() => import("./forms/StudentForm/StudentForm"), { loading: () => <p>Chargement du formulaire...</p> });
const SubjectForm = dynamic(() => import("./forms/SubjectForm/SubjectForm"), { loading: () => <p>Chargement du formulaire...</p> });
const ClassForm = dynamic(() => import("./forms/ClassForm/ClassForm"), { loading: () => <p>Chargement du formulaire...</p> });
const ExamForm = dynamic(() => import("./forms/ExamForm"), { loading: () => <p>Chargement du formulaire...</p> });
const AssignmentForm = dynamic(() => import("./forms/AssignmentForm/AssignmentForm"), { loading: () => <p>Chargement du formulaire...</p> });
const EventForm = dynamic(() => import("./forms/EventForm/EventForm"), { loading: () => <p>Chargement du formulaire...</p> });
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm/AnnouncementForm"), { loading: () => <p>Chargement du formulaire...</p> });
const GradeForm = dynamic(() => import("./forms/GradeForm/GradeForm"), { loading: () => <p>Chargement du formulaire...</p> });
const ParentForm = dynamic(() => import("./forms/ParentForm/ParentForm"), { loading: () => <p>Chargement du formulaire...</p> });
const AttendanceForm = dynamic(() => import("./forms/AttendanceForm/AttendanceForm"), { loading: () => <p>Chargement du formulaire...</p> });
const LessonForm = dynamic(() => import("./forms/LessonForm/LessonForm"), { loading: () => <p>Chargement du formulaire...</p> });
const ResultForm = dynamic(() => import("./forms/ResultForm/ResultForm"), { loading: () => <p>Chargement du formulaire...</p> });

// Define a type for the form components
type FormComponentType = (
  setOpen: Dispatch<SetStateAction<boolean>>,
  type: "create" | "update",
  data?: any,
  relatedData?: any
) => JSX.Element;

const forms: {
  [key: string]: FormComponentType;
} = {
  subject: (setOpen, type, data, relatedData) => <SubjectForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
  class: (setOpen, type, data, relatedData) => <ClassForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm
      type={type}
      initialData={data}
      setOpen={setOpen}
      availableSubjects={relatedData?.subjects || []}
      allClasses={relatedData?.classes || []}
    />),
  student: (setOpen, type, data, relatedData) => <StudentForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
  exam: (setOpen, type, data, relatedData) => <ExamForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
  assignment: (setOpen, type, data, relatedData) => (
    <AssignmentForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  event: (setOpen, type, data, relatedData) => <EventForm initialData={data} availableClasses={relatedData?.classes || []} setOpen={setOpen} />,
  announcement: (setOpen, type, data, relatedData) => <AnnouncementForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
  grade: (setOpen, type, data, relatedData) => <GradeForm type={type} data={data} setOpen={setOpen} />, 
  parent: (setOpen, type, data, relatedData) => <ParentForm type={type} initialData={data} setOpen={setOpen} />,
  attendance: (setOpen, type, data, relatedData) => <AttendanceForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
  lesson: (setOpen, type, data, relatedData) => <LessonForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
  result: (setOpen, type, data, relatedData) => <ResultForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
};

const FormModal: FC<FormContainerProps & { relatedData?: any }> = ({
  table,
  type,
  data,
  id,
  relatedData,
}) => {
  const sizeClass = type === "create" ? "w-8 h-8" : "w-7 h-7";
  
  const variantClass =
    type === "create"
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : type === "update"
      ? "bg-blue-500 text-white hover:bg-blue-600"
      : "bg-destructive text-destructive-foreground hover:bg-destructive/90";

  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Delete Mutation Hooks
  const [deleteSubject, { isLoading: isDeletingSubject, isSuccess: deleteSubjectSuccess, error: deleteSubjectError }] = useDeleteSubjectMutation();
  const [deleteClass, { isLoading: isDeletingClass, isSuccess: deleteClassSuccess, error: deleteClassError }] = useDeleteClassMutation();
  const [deleteTeacher, { isLoading: isDeletingTeacher, isSuccess: deleteTeacherSuccess, error: deleteTeacherError }] = useDeleteTeacherMutation();
  const [deleteStudent, { isLoading: isDeletingStudent, isSuccess: deleteStudentSuccess, error: deleteStudentError }] = useDeleteStudentMutation();
  const [deleteExam, { isLoading: isDeletingExam, isSuccess: deleteExamSuccess, error: deleteExamError }] = useDeleteExamMutation();
  const [deleteAssignment, { isLoading: isDeletingAssignment, isSuccess: deleteAssignmentSuccess, error: deleteAssignmentError }] = useDeleteAssignmentMutation();
  const [deleteEvent, { isLoading: isDeletingEvent, isSuccess: deleteEventSuccess, error: deleteEventError }] = useDeleteEventMutation();
  const [deleteAnnouncement, { isLoading: isDeletingAnnouncement, isSuccess: deleteAnnouncementSuccess, error: deleteAnnouncementError }] = useDeleteAnnouncementMutation();
  const [deleteParent, { isLoading: isDeletingParent, isSuccess: deleteParentSuccess, error: deleteParentError }] = useDeleteParentMutation();
  const [deleteLesson, { isLoading: isDeletingLesson, isSuccess: deleteLessonSuccess, error: deleteLessonError }] = useDeleteLessonMutation();
  const [deleteResult, { isLoading: isDeletingResult, isSuccess: deleteResultSuccess, error: deleteResultError }] = useDeleteResultMutation();
  const [deleteAttendance, { isLoading: isDeletingAttendance, isSuccess: deleteAttendanceSuccess, error: deleteAttendanceError }] = useDeleteAttendanceMutation();
  const [deleteGrade, { isLoading: isDeletingGrade, isSuccess: deleteGradeSuccess, error: deleteGradeError }] = useDeleteGradeMutation();

  const isAnyDeleteSuccessful = deleteSubjectSuccess || deleteClassSuccess || deleteTeacherSuccess || deleteStudentSuccess || deleteExamSuccess || deleteAssignmentSuccess || deleteEventSuccess || deleteAnnouncementSuccess || deleteParentSuccess || deleteLessonSuccess || deleteResultSuccess || deleteAttendanceSuccess || deleteGradeSuccess;
  const anyDeleteError = deleteSubjectError || deleteClassError || deleteTeacherError || deleteStudentError || deleteExamError || deleteAssignmentError || deleteEventError || deleteAnnouncementError || deleteParentError || deleteLessonError || deleteResultError || deleteAttendanceError || deleteGradeError;
  const isAnyDeleteLoading = isDeletingSubject || isDeletingClass || isDeletingTeacher || isDeletingStudent || isDeletingExam || isDeletingAssignment || isDeletingEvent || isDeletingAnnouncement || isDeletingParent || isDeletingLesson || isDeletingResult || isDeletingAttendance || isDeletingGrade;

  useEffect(() => {
    if (isAnyDeleteSuccessful) {
      toast({ title: `${table.charAt(0).toUpperCase() + table.slice(1)} a été supprimé(e) avec succès !` });
      setOpen(false);
      router.refresh();
    }
  }, [isAnyDeleteSuccessful, table, setOpen, router]);

  useEffect(() => {
    if (anyDeleteError) {
      const apiError = anyDeleteError as any;
      const errorMessage = apiError?.data?.message || "Échec de la suppression de l'élément.";
      toast({ variant: "destructive", title: "Échec de la Suppression", description: errorMessage });
    }
  }, [anyDeleteError]);

  const handleDelete = async () => {
    if (id === undefined || id === null) {
      toast({ variant: "destructive", title: "Erreur de Suppression", description: "Aucun élément sélectionné pour la suppression." });
      return;
    }
    try {
        switch (table) {
            case "subject": await deleteSubject(Number(id)).unwrap(); break;
            case "class": await deleteClass(Number(id)).unwrap(); break;
            case "teacher": await deleteTeacher(String(id)).unwrap(); break;
            case "student": await deleteStudent(String(id)).unwrap(); break;
            case "exam": await deleteExam(Number(id)).unwrap(); break;
            case "assignment": await deleteAssignment(Number(id)).unwrap(); break;
            case "event": await deleteEvent(Number(id)).unwrap(); break;
            case "announcement": await deleteAnnouncement(Number(id)).unwrap(); break;
            case "parent": await deleteParent(String(id)).unwrap(); break;
            case "lesson": await deleteLesson(Number(id)).unwrap(); break;
            case "result": await deleteResult(Number(id)).unwrap(); break;
            case "attendance": await deleteAttendance(Number(id)).unwrap(); break;
            case "grade": await deleteGrade(Number(id)).unwrap(); break;
            default: throw new Error("Fonction de suppression non configurée pour cette table.");
        }
    } catch (err) {
      // Error is handled in the useEffect hook that listens to anyDeleteError
    }
  };

  const RenderedForm = () => {
    if (type === "delete") {
      return (
        <div className="p-4 flex flex-col gap-4 items-center">
          <h2 className="text-lg font-semibold text-center">Confirmer la Suppression</h2>
          <p className="text-sm text-muted-foreground text-center">
            Êtes-vous sûr de vouloir supprimer cet élément ({table}) ? Cette action est irréversible.
          </p>
          <div className="flex gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isAnyDeleteLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              disabled={isAnyDeleteLoading}
            >
              {isAnyDeleteLoading ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
          {anyDeleteError && (
             <span className="text-destructive text-sm mt-2 text-center">
                Erreur: {(anyDeleteError as any)?.data?.message || "Une erreur s'est produite lors de la suppression."}
             </span>
          )}
        </div>
      );
    }

    const FormComponent = forms[table];
    if (FormComponent) {
      return FormComponent(setOpen, type, data, relatedData);
    }
    return <p>Formulaire non trouvé pour &quot;{table}&quot;</p>;
  };

  const IconComponent = type === 'create' ? Plus : (type === 'update' ? Pencil : Trash2);

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className={cn(
          "flex items-center justify-center rounded-full transition-opacity hover:opacity-90",
          sizeClass,
          variantClass
        )}
        onClick={() => setOpen(true)}
        aria-label={`${type} ${table}`}
      >
        <IconComponent className="h-4 w-4" />
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card p-6 rounded-lg shadow-xl relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <RenderedForm />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted"
              onClick={() => setOpen(false)}
              aria-label="Fermer le modal"
            >
              <CloseIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;

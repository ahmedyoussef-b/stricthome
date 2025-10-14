import { useMemo, useState } from 'react';
import type { Lesson, WizardData } from '@/types';

export const useViewMode = (wizardData: WizardData, schedule: Lesson[]) => {
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    wizardData.classes[0]?.id.toString() || ''
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    wizardData.teachers[0]?.id || ''
  );

  const filteredSchedule = useMemo(() => {
    if (viewMode === 'class' && selectedClassId) {
      return schedule.filter(l => l.classId === parseInt(selectedClassId));
    }
    if (viewMode === 'teacher' && selectedTeacherId) {
      return schedule.filter(l => l.teacherId === selectedTeacherId);
    }
    return [];
  }, [schedule, viewMode, selectedClassId, selectedTeacherId]);

  const handleViewModeChange = (value: string) => { // Changed to accept string
    setViewMode(value as 'class' | 'teacher'); // Cast to the expected type internally
  };

  const handleClassChange = (value: string) => {
    setSelectedClassId(value);
  };

  const handleTeacherChange = (value: string) => {
    setSelectedTeacherId(value);
  };

  return {
    viewMode,
    selectedClassId,
    selectedTeacherId,
    handleViewModeChange,
    handleClassChange,
    handleTeacherChange,
    filteredSchedule
  };
};
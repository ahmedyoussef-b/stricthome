// src/lib/redux/features/teacherAssignmentsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { TeacherAssignment } from '@/types/index'; // Import from the central types file

export type TeacherAssignmentsState = {
  items: TeacherAssignment[];
};

const initialState: TeacherAssignmentsState = {
  items: [],
};

export const teacherAssignmentsSlice = createSlice({
  name: 'teacherAssignments',
  initialState,
  reducers: {
    setAllTeacherAssignments(state, action: PayloadAction<TeacherAssignment[]>) {
      state.items = action.payload;
    },
    setAssignment(state, action: PayloadAction<{ teacherId: string; subjectId: number; classIds: number[] }>) {
        const { teacherId, subjectId, classIds } = action.payload;
        const existingAssignmentIndex = state.items.findIndex(
            (a) => a.teacherId === teacherId && a.subjectId === subjectId
        );

        // Remove any existing assignments of these classes to other teachers for the same subject
        state.items.forEach(assignment => {
            if (assignment.subjectId === subjectId && assignment.teacherId !== teacherId) {
                assignment.classIds = assignment.classIds.filter(id => !classIds.includes(id));
            }
        });

        if (existingAssignmentIndex > -1) {
            if (classIds.length > 0) {
                state.items[existingAssignmentIndex].classIds = classIds;
            } else {
                // If the class list is empty, remove the assignment
                state.items.splice(existingAssignmentIndex, 1);
            }
        } else if (classIds.length > 0) {
            // Create a new assignment if it doesn't exist and there are classes to assign
            state.items.push({
                id: -Date.now(),
                teacherId,
                subjectId,
                classIds,
                scheduleDraftId: '',
                classAssignments: []
            });
        }
        
        // Clean up any assignments that are now empty
        state.items = state.items.filter(a => a.classIds.length > 0);
    },
    toggleClassAssignment(state, action: PayloadAction<{ teacherId: string, subjectId: number, classId: number }>) {
        const { teacherId, subjectId, classId } = action.payload;

        const targetAssignmentIndex = state.items.findIndex(
            (a) => a.teacherId === teacherId && a.subjectId === subjectId
        );

        const isCurrentlyAssignedToTarget = 
            targetAssignmentIndex !== -1 && state.items[targetAssignmentIndex].classIds.includes(classId);

        // If it's already assigned to the target teacher, unassign it (toggle off)
        if (isCurrentlyAssignedToTarget) {
            state.items[targetAssignmentIndex].classIds = state.items[targetAssignmentIndex].classIds.filter(
                (id) => id !== classId
            );
            // Clean up the assignment if it becomes empty
            if (state.items[targetAssignmentIndex].classIds.length === 0) {
                state.items.splice(targetAssignmentIndex, 1);
            }
            return;
        }

        // --- Logic for toggling ON ---
        
        // Remove the class from any OTHER teacher who might have it for the same subject
        state.items.forEach((assignment, index) => {
            if (assignment.subjectId === subjectId && assignment.teacherId !== teacherId) {
                const classIndex = assignment.classIds.indexOf(classId);
                if (classIndex > -1) {
                    assignment.classIds.splice(classIndex, 1);
                }
            }
        });
        
        // Add the class to the target teacher
        if (targetAssignmentIndex !== -1) {
            // Assignment for this teacher/subject already exists, just add the class
            state.items[targetAssignmentIndex].classIds.push(classId);
        } else {
            // No assignment for this teacher/subject, create a new one
            state.items.push({
                id: -Date.now(),
                teacherId,
                subjectId,
                classIds: [classId],
                scheduleDraftId: '',
                classAssignments: []
            });
        }

        // Clean up any assignments that became empty after re-assignment
        state.items = state.items.filter(a => a.classIds.length > 0);
    },
    clearAllAssignments(state) {
        state.items = [];
    },
    removeAssignmentsForTeacher(state, action: PayloadAction<string>) {
      const teacherId = action.payload;
      state.items = state.items.filter(a => a.teacherId !== teacherId);
    },
  },
  selectors: {
    selectTeacherAssignments: (state) => state.items,
  }
});

export const { setAllTeacherAssignments, toggleClassAssignment, clearAllAssignments, removeAssignmentsForTeacher, setAssignment } = teacherAssignmentsSlice.actions;
export const { selectTeacherAssignments } = teacherAssignmentsSlice.selectors;
export default teacherAssignmentsSlice.reducer;

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Student } from '@prisma/client';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { fetchAllStudents, updateClassStudents, selectStudents, selectLoading } from '@/lib/redux/slices/class-slice';

interface AddStudentsToClassDialogProps {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  classId: string;
  className: string;
  initialStudents: string[];
}

export const AddStudentsToClassDialog = ({ isOpen, setOpen, classId, className, initialStudents }: AddStudentsToClassDialogProps) => {
  const dispatch: AppDispatch = useDispatch();
  const students = useSelector(selectStudents);
  const loading = useSelector(selectLoading);
  const [selectedStudents, setSelectedStudents] = useState<string[]>(initialStudents);

  useEffect(() => {
    dispatch(fetchAllStudents());
  }, [dispatch]);

  useEffect(() => {
    setSelectedStudents(initialStudents);
  }, [initialStudents]);

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSave = () => {
    dispatch(updateClassStudents({ classId, studentIds: selectedStudents }));
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Students to {className}</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p>Loading students...</p>
          ) : (
            students.map((student: Student) => (
              <div key={student.id} className="flex items-center space-x-2 my-2">
                <Checkbox
                  id={student.id}
                  checked={selectedStudents.includes(student.id)}
                  onCheckedChange={() => handleStudentSelect(student.id)}
                />
                <label htmlFor={student.id}>{student.name} {student.surname}</label>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

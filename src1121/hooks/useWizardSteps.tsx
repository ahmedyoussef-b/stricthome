// src/hooks/useWizardSteps.tsx
import React, { useState } from 'react';
import { School, Users, BookOpen, User, MapPin, Puzzle, CheckCircle } from 'lucide-react';

// Import the newly created form components
import { SchoolConfigForm } from '@/components/wizard/forms/SchoolConfigForm';
import ClassesForm from '@/components/wizard/forms/ClassesForm';
import SubjectsForm from '@/components/wizard/forms/SubjectsForm';
import TeachersForm from '@/components/wizard/forms/TeachersForm';
import ClassroomsForm from '@/components/wizard/forms/ClassroomsForm';
import ConstraintsForm from '@/components/wizard/forms/ConstraintsForm';

export default function useWizardSteps() {
    const [currentStep, setCurrentStep] = useState(0);
    
    const steps = [
        { id: 'school', title: 'Établissement', icon: School, description: 'Paramètres généraux', component: SchoolConfigForm },
        { id: 'classes', title: 'Classes', icon: Users, description: 'Définition des classes', component: ClassesForm, csvPath: '/imports/classes.csv' },
        { id: 'subjects', title: 'Matières', icon: BookOpen, description: 'Horaires par classe', component: SubjectsForm, csvPath: '/imports/subjects.csv' },
        { id: 'teachers', title: 'Professeurs', icon: User, description: 'Gestion des enseignants', component: TeachersForm, csvPath: '/imports/teachers.csv' },
        { id: 'rooms', title: 'Salles', icon: MapPin, description: 'Déclaration des espaces', component: ClassroomsForm, csvPath: '/imports/classrooms.csv' },
        { id: 'constraints', title: 'Contraintes', icon: Puzzle, description: 'Indisponibilités et exigences', component: ConstraintsForm },
        { id: 'validation', title: 'Génération', icon: CheckCircle, description: 'Vérification et génération', component: () => (<div>Validation</div>) }
    ];

    const progress = ((currentStep + 1) / steps.length) * 100;

    const handleNext = () => currentStep < steps.length - 1 && setCurrentStep(currentStep + 1);
    const handlePrevious = () => currentStep > 0 && setCurrentStep(currentStep - 1);
    const handleStepClick = (stepIndex: number) => setCurrentStep(stepIndex);

    return {
        steps,
        currentStep,
        progress,
        handleNext,
        handlePrevious,
        handleStepClick
    };
}

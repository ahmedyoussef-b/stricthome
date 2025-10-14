// src/components/wizard/ShuddlePageClient.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { cn } from '@/lib/utils';
import { Loader2, ChevronLeft, ChevronRight, Sparkles, Info, CheckCircle, AlertTriangle, Calendar, Clock, Wand2, Download, Save, CloudOff, Edit, RotateCw, Printer, BookOpen, MapPin, Puzzle, School, Users, User as UserIcon } from 'lucide-react';


// Components
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import TimetableDisplay from '../schedule/TimetableDisplay';
import ViewModeTabs from '../schedule/TimetableDisplay/components/ViewModeTabs';

// Forms
import { SchoolConfigForm } from '@/components/wizard/forms/SchoolConfigForm';
import ClassesForm from '@/components/wizard/forms/ClassesForm';
import SubjectsForm from '@/components/wizard/forms/SubjectsForm';
import TeachersForm from '@/components/wizard/forms/TeachersForm';
import ClassroomsForm from '@/components/wizard/forms/ClassroomsForm';
import ConstraintsForm from '@/components/wizard/forms/ConstraintsForm';


// Hooks & Redux
import useWizardData from '@/hooks/useWizardData';
import { setInitialSchedule, saveSchedule } from '@/lib/redux/features/schedule/scheduleSlice';
import { generateSchedule } from '@/lib/schedule-generation';
import { useToast } from '@/hooks/use-toast';
import { selectActiveDraft } from '@/lib/redux/features/scheduleDraftSlice';
import { setInitialData } from '@/lib/redux/features/wizardSlice';

import type { WizardData, Lesson, ValidationResult, Day, Subject, ClassWithGrade } from '@/types';
import ScenarioManager from '@/components/wizard/ScenarioManager';

interface ShuddlePageClientProps {
    initialData: WizardData;
}

// --- Sub-component Prop Types ---
interface ValidationViewProps {
    validationResults: ValidationResult[];
    isGenerating: boolean;
    generationProgress: number;
    onGenerate: () => void;
    canGenerate: boolean;
}

interface StepNavigationProps {
    steps: Array<{ id: string; title: string; icon: React.ElementType, csvPath?: string }>;
    currentStep: number;
    onStepClick: (index: number) => void;
    disabled?: boolean;
}

interface StepFooterProps {
    onPrevious: () => void;
    onNext: () => void;
    currentStep: number;
    stepsLength: number;
    disabled?: boolean;
}


const ShuddlePageClient: React.FC<ShuddlePageClientProps> = ({ initialData }) => {
    console.log("🚀 [ShuddlePageClient] Le composant client du planificateur est en cours de rendu.");
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const [mode, setMode] = useState<'wizard' | 'view'>('wizard');
    const scheduleItems = useAppSelector(state => state.schedule.items);
    const wizardData = useWizardData();
    const activeDraft = useAppSelector(selectActiveDraft);
    const hydrationRef = useRef(false);

    // View state
    const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
    const [selectedViewId, setSelectedViewId] = useState<string>('');

    // Validation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
    
    // HYDRATION EFFECT
    useEffect(() => {
        if (!hydrationRef.current) {
            console.log("💧 [ShuddlePageClient] Hydratation avec les données du serveur/actives.");
            dispatch(setInitialData(initialData));
            hydrationRef.current = true;
        }
    }, [dispatch, initialData]);
    
    useEffect(() => {
        // Add safe checks to ensure wizardData and its properties exist
        if (!selectedViewId && wizardData) {
            if (viewMode === 'class' && wizardData.classes && wizardData.classes.length > 0 && wizardData.classes[0]?.id) {
                setSelectedViewId(wizardData.classes[0].id.toString());
            } else if (viewMode === 'teacher' && wizardData.teachers && wizardData.teachers.length > 0 && wizardData.teachers[0]?.id) {
                setSelectedViewId(wizardData.teachers[0].id);
            }
        }
    }, [viewMode, wizardData, selectedViewId]);


    const { steps, currentStep, progress, handleNext, handlePrevious, handleStepClick } = useWizardSteps();
    
    const validateData = useCallback(() => {
        console.log("🔬 [ShuddlePageClient] Lancement de la validation des données de configuration.");
        const results: ValidationResult[] = [];
        const { school, classes, teachers, subjects, lessonRequirements, teacherAssignments, rooms } = wizardData;
        
        if (!school.name) results.push({ type: 'error', message: "Nom d'établissement manquant." });
        if (classes.length === 0) results.push({ type: 'error', message: 'Aucune classe configurée.' });
        if (teachers.length === 0) results.push({ type: 'error', message: 'Aucun enseignant configuré.' });
        if (subjects.length === 0) results.push({ type: 'error', message: 'Aucune matière configurée.' });
        if (rooms.length === 0) results.push({ type: 'error', message: 'Aucune salle nest configurée.' });
        if (results.some(r => r.type === 'error')) return results;

        lessonRequirements.forEach(req => {
            if (req.hours > 0) {
                const assignmentExists = teacherAssignments.some(a => a.classIds.includes(req.classId) && a.subjectId === req.subjectId);
                if (!assignmentExists) {
                    const className = classes.find(c => c.id === req.classId)?.name;
                    const subjectName = subjects.find(s => s.id === req.subjectId)?.name;
                    results.push({ type: 'error', message: `Matière non assignée`, details: `La matière "${subjectName || 'Inconnue'}" requise pour la classe "${className || 'Inconnue'}" n'a pas de professeur assigné.` });
                }
            }
        });

        if (results.every(r => r.type !== 'error')) {
          results.unshift({ type: 'success', message: 'Configuration de base valide et prête pour la génération.' });
        }
        
        console.log(`🔬 [ShuddlePageClient] Validation terminée avec ${results.length} résultat(s).`);
        return results;
      }, [wizardData]);

    useEffect(() => {
        if(currentStep === steps.length - 1) { 
            setValidationResults(validateData());
        }
    }, [wizardData, currentStep, steps.length, validateData]);
    

    const handleGenerate = async () => {
        console.log("⚙️ [ShuddlePageClient] Lancement de la génération de l'emploi du temps.");
        setIsGenerating(true);
        setGenerationProgress(0);
        await new Promise(resolve => setTimeout(resolve, 200));
        setGenerationProgress(20);
        
        try {
            const { schedule: finalSchedule, unplacedLessons } = generateSchedule(wizardData);
            await new Promise(resolve => setTimeout(resolve, 500));
            setGenerationProgress(100);

            dispatch(setInitialSchedule(finalSchedule));
            
            console.log(`✅ [ShuddlePageClient] Génération terminée. ${finalSchedule.length} cours placés.`);

            if (unplacedLessons.length > 0) {
                 console.warn(`⚠️ [ShuddlePageClient] ${unplacedLessons.length} cours n'ont pas pu être placés.`);
                toast({ variant: "destructive", title: "Génération Partielle", description: `${unplacedLessons.length} cours n'ont pas pu être placés. Vérifiez les contraintes et réessayez.`, duration: 8000 });
            } else {
                toast({ title: "Génération terminée !", description: "Les emplois du temps ont été générés avec succès. Vous pouvez maintenant les éditer." });
            }
            
            setMode('view');

        } catch (error) {
            console.error("❌ [ShuddlePageClient] Erreur de Génération d'emploi du temps:", error);
            toast({ variant: 'destructive', title: "Erreur de Génération", description: "Une erreur est survenue. Vérifiez les contraintes et réessayez." });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSaveAndFinish = async () => {
        try {
            await dispatch(saveSchedule(scheduleItems)).unwrap();
            toast({
                title: 'Emploi du temps sauvegardé !',
                description: "La configuration actuelle de l'emploi du temps a été enregistrée dans la base de données."
            })
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Erreur de Sauvegarde',
                description: error.message || "Impossible de sauvegarder l'emploi du temps."
            })
        }
    }
    
    const renderStepContent = () => {
        const StepComponent = steps[currentStep].component;
        
        if (currentStep === steps.length - 1) { // Validation Step
            return (
                <ValidationView 
                    validationResults={validationResults}
                    isGenerating={isGenerating}
                    generationProgress={generationProgress}
                    onGenerate={handleGenerate}
                    canGenerate={validationResults.every(result => result.type !== 'error')}
                />
            );
        }
        
        return <StepComponent />;
    };
    
    const renderWizard = () => (
        <>
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-foreground truncate pr-4">
                       Configuration de l'emploi du temps
                    </h2>
                     <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setMode('view')}>
                            <Calendar size={16} className="mr-2"/>
                            Voir l'emploi du temps
                        </Button>
                    </div>
                </div>
                <Progress value={progress} className="h-2" />
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
                <StepNavigation 
                    steps={steps}
                    currentStep={currentStep}
                    onStepClick={handleStepClick}
                />
                
                <div className="flex-1">
                    <Card className="p-8 min-h-full">
                        <div className="flex flex-col h-full">
                           <div className="flex-grow">
                               {renderStepContent()}
                           </div>
                            <StepFooter 
                                onPrevious={handlePrevious}
                                onNext={handleNext}
                                currentStep={currentStep}
                                stepsLength={steps.length}
                            />
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );

    const renderViewMode = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <Button variant="outline" onClick={() => setMode('wizard')}>
                    <Edit className="mr-2 h-4 w-4" />
                    Retour à la configuration
                </Button>
                 <div className="flex items-center gap-2">
                     <Button onClick={handleGenerate}>
                        <RotateCw size={16} className="mr-2" />
                        Regénérer
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer size={16} className="mr-2" />
                        Imprimer
                    </Button>
                     <Button onClick={handleSaveAndFinish}>
                        <Save className="mr-2 h-4 w-4"/>
                        Sauvegarder et Terminer
                    </Button>
                 </div>
            </div>
            
            <Card className="p-4 non-printable">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <ViewModeTabs
                        viewMode={viewMode}
                        onViewModeChange={(value) => {
                            setViewMode(value as 'class' | 'teacher');
                            setSelectedViewId('');
                        }}
                        selectedClassId={selectedViewId}
                        onClassChange={setSelectedViewId}
                        selectedTeacherId={selectedViewId}
                        onTeacherChange={setSelectedViewId}
                        classes={wizardData.classes}
                        teachers={wizardData.teachers}
                    />
                </div>
            </Card>
            
            <div className="printable-schedule-container">
                <TimetableDisplay 
                    wizardData={wizardData}
                    isEditable={true}
                    viewMode={viewMode}
                    selectedViewId={selectedViewId}
                    scheduleOverride={scheduleItems} // Use the redux schedule items
                />
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-6 lg:p-8 flex flex-col gap-2">
            <PageHeader />
            {mode === 'wizard' ? renderWizard() : renderViewMode()}
        </div>
    );
};

// --- Wizard Steps Definition ---
function useWizardSteps() {
    const [currentStep, setCurrentStep] = useState(0);
    
    const steps = [
        { id: 'school', title: 'Établissement', icon: School, description: 'Paramètres généraux', component: SchoolConfigForm },
        { id: 'classes', title: 'Classes', icon: Users, description: 'Définition des classes', component: ClassesForm, csvPath: '/imports/classes.csv' },
        { id: 'subjects', title: 'Matières', icon: BookOpen, description: 'Horaires par classe', component: SubjectsForm, csvPath: '/imports/subjects.csv' },
        { id: 'teachers', title: 'Professeurs', icon: UserIcon, description: 'Gestion des enseignants', component: TeachersForm, csvPath: '/imports/teachers.csv' },
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


// --- Sub-components ---
const getValidationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'error': return <AlertTriangle className="text-destructive" size={20} />;
      default: return null;
    }
};
  
const ValidationView: React.FC<ValidationViewProps> = ({ validationResults, isGenerating, generationProgress, onGenerate, canGenerate }) => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <CheckCircle className="text-primary" size={20} />
          <span>Validation de la configuration</span>
        </h3>
        
        <div className="space-y-3">
          {validationResults.map((result, index) => (
            <Alert 
              key={index} 
              variant={result.type === 'error' ? 'destructive' : 'default'}
              className={`border-l-4 ${
                result.type === 'success' 
                  ? 'border-green-500 bg-green-500/10' 
                  : result.type === 'warning' 
                    ? 'border-yellow-500 bg-yellow-500/10' 
                    : 'border-destructive bg-destructive/10'
              }`}
            >
              <div className="flex items-start space-x-3">
                {getValidationIcon(result.type)}
                <div className="flex-1">
                  <AlertTitle className={`font-semibold ${
                      result.type === 'success' ? 'text-green-700 dark:text-green-400'
                      : result.type === 'warning' ? 'text-yellow-700 dark:text-yellow-400'
                      : 'text-destructive'
                  }`}>
                    {result.message}
                  </AlertTitle>
                  {result.details && (
                    <AlertDescription className="text-sm text-muted-foreground mt-1">
                      {result.details}
                    </AlertDescription>
                  )}
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Calendar className="text-primary" size={20} />
          <span>Génération des emplois du temps</span>
        </h3>
        
        {isGenerating ? (
          <div className="space-y-4">
            <Progress value={generationProgress} className="h-3" />
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Clock size={20} className="animate-spin" />
              <span>Génération en cours... {Math.round(generationProgress)}%</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!canGenerate && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Veuillez corriger les erreurs de configuration avant de lancer la génération.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={onGenerate} 
                disabled={!canGenerate} 
                className="flex-1" 
                size="lg"
              >
                <Wand2 size={20} className="mr-2" />
                Générer l'emploi du temps
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
);


const StepNavigation: React.FC<StepNavigationProps> = ({ steps, currentStep, onStepClick, disabled }) => (
    <div className="w-full md:w-80 space-y-2">
        {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
                <Card 
                    key={step.id} 
                    className={cn(
                        "p-4 transition-all duration-300", 
                        !disabled && "cursor-pointer hover:shadow-md",
                        disabled && "opacity-60 cursor-not-allowed",
                        isActive && "border-primary bg-primary/10", 
                        isCompleted && "border-green-500 bg-green-500/10"
                    )} 
                    onClick={() => !disabled && onStepClick(index)}
                >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                          <div className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-full",
                              isActive && "bg-primary text-primary-foreground",
                              isCompleted && "bg-green-500 text-white",
                              !isActive && !isCompleted && "bg-muted text-muted-foreground"
                          )}>
                              <Icon size={16} />
                          </div>
                          <div className="flex-1">
                              <h3 className={cn(
                                  "font-medium", 
                                  isActive && "text-primary", 
                                  isCompleted && "text-green-600 dark:text-green-400"
                              )}>
                                  {step.title}
                              </h3>
                          </div>
                      </div>
                      {step.csvPath && (
                         <a href={step.csvPath} download>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => e.stopPropagation()}>
                                <Download size={16} />
                            </Button>
                         </a>
                      )}
                    </div>
                </Card>
            );
        })}
    </div>
);


const StepFooter: React.FC<StepFooterProps> = ({ 
    onPrevious, 
    onNext, 
    currentStep, 
    stepsLength,
    disabled = false
}) => (
    <div className="flex justify-end items-center mt-auto pt-8">
        <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                onClick={onPrevious} 
                disabled={currentStep === 0 || disabled}
            >
                <ChevronLeft size={16} className="mr-2" /> 
                Précédent
            </Button>
            {currentStep < stepsLength - 1 && (
                <Button 
                    onClick={onNext} 
                    disabled={disabled}
                >
                    Suivant 
                    <ChevronRight size={16} className="ml-2" />
                </Button>
            )}
        </div>
    </div>
);

const PageHeader: React.FC = () => (
    <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            <Sparkles className="text-primary"/>
            Planificateur d'Emplois du Temps
        </h1>
        <ScenarioManager />
    </div>
);

export default ShuddlePageClient;

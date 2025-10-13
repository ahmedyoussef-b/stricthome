
// prisma/seed.ts
import { PrismaClient, Role, TaskType, TaskDifficulty, TaskCategory } from '@prisma/client';
import placeholderImages from '../src/lib/placeholder-images.json';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
  console.log('⚡️ Forcing Prisma client generation...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully.');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error);
    process.exit(1);
  }
  
  console.log('🚀 Démarrage du seeding...');

  // Clean up existing data in the correct order to avoid foreign key constraints
  console.log('🧹 Nettoyage des anciennes données...');
  await prisma.studentAchievement.deleteMany();
  await prisma.finalRoundParticipant.deleteMany();
  await prisma.finalRound.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.leaderboard.deleteMany();
  await prisma.studentProgress.deleteMany();
  await prisma.etatEleve.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.coursSession.deleteMany();
  await prisma.task.deleteMany();
  // Classrooms must be deleted before users that teach them
  await prisma.classroom.deleteMany();
  await prisma.user.deleteMany();
  await prisma.metier.deleteMany();
  
  console.log('✅ Données nettoyées.');

  // Create careers (métiers)
  console.log('🎨 Création des métiers...');
  const pompier = await prisma.metier.create({
    data: {
      nom: 'Pompier',
      description: 'Protège les personnes et les biens des incendies.',
      icon: 'Flame',
      theme: {
        backgroundColor: 'from-red-500 to-orange-500',
        textColor: 'text-white',
        primaryColor: '24 96% 59%', // orange-500
        accentColor: '0 84% 60%', // red-500
        cursor: 'cursor-crosshair',
        imageUrl: placeholderImages.pompier.url,
      },
    },
  });

  const astronaute = await prisma.metier.create({
    data: {
      nom: 'Astronaute',
      description: "Explore l'espace et voyage vers d'autres planètes.",
      icon: 'Rocket',
      theme: {
        backgroundColor: 'from-gray-800 to-blue-900',
        textColor: 'text-white',
        primaryColor: '217 91% 60%', // blue-500
        accentColor: '221 39% 11%', // gray-900
        cursor: 'cursor-grab',
        imageUrl: placeholderImages.astronaute.url,
      },
    },
  });

  const veterinaire = await prisma.metier.create({
    data: {
      nom: 'Vétérinaire',
      description: 'Soigne les animaux malades et blessés.',
      icon: 'HeartPulse',
      theme: {
        backgroundColor: 'from-green-400 to-teal-500',
        textColor: 'text-white',
        primaryColor: '162 72% 47%', // teal-500
        accentColor: '142 58% 58%', // green-400
        cursor: 'cursor-help',
        imageUrl: placeholderImages.veterinaire.url,
      },
    },
  });
  console.log('✅ Métiers créés.');

  // Create a teacher FIRST
  console.log('🧑‍🏫 Création du professeur...');
  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@example.com',
      name: 'M. Dupont',
      role: Role.PROFESSEUR,
    },
  });
  console.log('✅ Professeur créé.');

  // Create Tasks
  console.log('🎯 Création des tâches...');
  await prisma.task.createMany({
    data: [
      // --- DAILY TASKS ---
      {
        title: 'Tache dessin quotidien',
        description: 'Copier manuellement le dessin et le téléverser.',
        points: 20,
        type: TaskType.DAILY,
        category: TaskCategory.ACADEMIC,
        difficulty: TaskDifficulty.MEDIUM,
        requiresProof: true,
      },
      {
        title: 'Prendre une douche au quotidien',
        description: 'Tâche de propreté.',
        points: 20,
        type: TaskType.DAILY,
        category: TaskCategory.PERSONAL,
        difficulty: TaskDifficulty.EASY,
        requiresProof: true,
      },
      {
        title: 'Pièce bien rangée',
        description: 'Prouvez que votre pièce est bien rangée aujourd\'hui.',
        points: 20,
        type: TaskType.DAILY,
        category: TaskCategory.PERSONAL,
        difficulty: TaskDifficulty.EASY,
        requiresProof: true,
      },
      {
        title: 'Apprendre une page Coran',
        description: 'Apprendre et réciter une page du Coran.',
        points: 100,
        type: TaskType.DAILY,
        category: TaskCategory.PERSONAL, // Or ACADEMIC
        difficulty: TaskDifficulty.HARD,
        requiresProof: true,
      },
      {
        title: 'Connexion journalière',
        description: 'Connectez-vous entre 05h00 et 06h00.',
        points: 50,
        type: TaskType.DAILY,
        category: TaskCategory.PERSONAL,
        difficulty: TaskDifficulty.EASY,
        requiresProof: false,
        startTime: '05:00',
        endTime: '06:00',
      },
      {
        title: 'Objectif prières',
        description: 'Accomplir les 5 prières journalières.',
        points: 100,
        type: TaskType.DAILY,
        category: TaskCategory.PERSONAL,
        difficulty: TaskDifficulty.MEDIUM,
        requiresProof: true,
      },

      // --- WEEKLY TASKS ---
      {
        title: 'Apprentissage par cœur',
        description: 'Réciter un texte d\'une page appris par cœur.',
        points: 100,
        type: TaskType.WEEKLY,
        category: TaskCategory.ACADEMIC,
        difficulty: TaskDifficulty.MEDIUM,
        requiresProof: true,
      },
      {
        title: 'Pas d\'appareil portable',
        description: 'S\'abstenir du portable 6j/7j sauf pour cause d\'études.',
        points: 100,
        type: TaskType.WEEKLY,
        category: TaskCategory.PERSONAL,
        difficulty: TaskDifficulty.EASY,
        requiresProof: false, 
      },
      {
        title: 'Réaction emoji',
        description: 'Réagissez à un message avec un emoji dans la session.',
        points: 10,
        type: TaskType.WEEKLY, // As per image
        category: TaskCategory.PERSONAL, // As per image
        difficulty: TaskDifficulty.EASY,
        requiresProof: false,
      },
      {
        title: 'Mission hebdomadaire 1',
        description: 'Terminez tous vos devoirs de la semaine.',
        points: 50,
        type: TaskType.WEEKLY,
        category: TaskCategory.ACADEMIC,
        difficulty: TaskDifficulty.MEDIUM,
        requiresProof: false,
      },
      {
        title: 'Collaboration de groupe',
        description: 'Participez à une session de groupe et contribuez activement.',
        points: 40,
        type: TaskType.WEEKLY,
        category: TaskCategory.COLLABORATIVE,
        difficulty: TaskDifficulty.MEDIUM,
        requiresProof: false,
      },
      {
        title: 'Synthèse de la semaine',
        description: 'Postez un résumé de ce que vous avez appris cette semaine.',
        points: 100,
        type: TaskType.WEEKLY,
        category: TaskCategory.ACADEMIC,
        difficulty: TaskDifficulty.MEDIUM,
        requiresProof: true,
      },
      {
        title: 'Défi créatif hebdomadaire',
        description: 'Réalisez une petite recette créative liée à la cuisine.',
        points: 100,
        type: TaskType.WEEKLY,
        category: TaskCategory.CREATIVE,
        difficulty: TaskDifficulty.HARD,
        requiresProof: true,
      },

      // --- MONTHLY TASKS ---
      {
        title: 'Objectif Progression scolaire 1',
        description: 'Présenter un devoir contrôle/synthèse avec 20/20.',
        points: 200,
        type: TaskType.MONTHLY,
        category: TaskCategory.ACADEMIC,
        difficulty: TaskDifficulty.HARD,
        requiresProof: true,
      },
      {
        title: 'Projet créatif mensuel',
        description: 'Projet jardinage.',
        points: 300,
        type: TaskType.MONTHLY,
        category: TaskCategory.CREATIVE,
        difficulty: TaskDifficulty.HARD,
        requiresProof: true,
      },
      {
        title: 'Maître des points',
        description: 'Atteignez le top 3 du classement ce mois-ci.',
        points: 200,
        type: TaskType.MONTHLY,
        category: TaskCategory.PERSONAL,
        difficulty: TaskDifficulty.HARD,
        requiresProof: false,
      },
      {
        title: 'Objectif Progression scolaire 2',
        description: 'Réaliser des points de progressions dans la moyenne générale.',
        points: 200, // Points not specified, using a high value
        type: TaskType.MONTHLY, // Assuming monthly
        category: TaskCategory.ACADEMIC,
        difficulty: TaskDifficulty.HARD, // Assuming hard
        requiresProof: false,
      },
       // Other tasks from previous seedings
      { 
        title: 'Marathon de Concentration', 
        description: 'Restez actif sur la plateforme pendant 60 minutes continues.', 
        points: 100, 
        type: TaskType.DAILY, 
        category: 'PERSONAL', 
        duration: 60, 
        isActive: true, 
        difficulty: TaskDifficulty.HARD, 
        requiresProof: false, 
      },
      { 
        title: 'Question pertinente', 
        description: 'Posez une question intelligente en classe.', 
        points: 15, 
        type: TaskType.DAILY, 
        category: 'ACADEMIC', 
        difficulty: TaskDifficulty.MEDIUM, 
        requiresProof: false, 
      },
    ]
  });
  console.log('✅ Tâches créées.');

  // Create classes (AFTER teacher is created)
  console.log('🏫 Création des classes...');
  const classroomA = await prisma.classroom.create({
    data: { nom: 'Classe A', professeurId: teacher.id },
  });
  const classroomB = await prisma.classroom.create({
    data: { nom: 'Classe B', professeurId: teacher.id },
  });
  const classroomC = await prisma.classroom.create({
    data: { nom: 'Classe C', professeurId: teacher.id },
  });
  console.log('✅ 3 Classes créées.');

  // Create students
  console.log('🧑‍🎓 Création des élèves...');
  const studentNames = [
      // Classe A
      'Ahmed', 'Ali', 'Fatima', 'Yasmine', 'Omar', 'Karim', 'Leila', 'Sofia', 'Hassan', 'Nadia',
      // Classe B
      'Mohamed', 'Aya', 'Youssef', 'Nour', 'Adam', 'Sarah', 'Amir', 'Ines', 'Rayan', 'Lina',
      // Classe C
      'Mehdi', 'Samira', 'Bilal', 'Zahra', 'Idris', 'Anissa', 'Malik', 'Khadija', 'Walid', 'Salma'
  ];

  const classrooms = [classroomA, classroomB, classroomC];
  let studentIndex = 0;
  const students = [];

  for (const classroom of classrooms) {
      for (let i = 0; i < 10; i++) {
          const name = studentNames[studentIndex];
          const student = await prisma.user.create({
              data: {
                  name: name,
                  email: `${name.toLowerCase()}@example.com`,
                  role: 'ELEVE',
                  ambition: `devenir ${name === 'Fatima' ? 'médecin' : 'ingénieur'}`,
                  points: Math.floor(Math.random() * 250),
                  classroomId: classroom.id,
              },
          });
          
          students.push(student);
          
          let metierId: string | undefined = undefined;
          if (i % 3 === 0) metierId = pompier.id;
          else if (i % 3 === 1) metierId = astronaute.id;
          
          await prisma.etatEleve.create({
              data: {
                  eleveId: student.id,
                  isPunished: false,
                  metierId: metierId,
              },
          });
          studentIndex++;
      }
  }
  console.log(`✅ ${students.length} élèves créés et répartis dans les classes.`);

  // Create leaderboard entries
  console.log('🏆 Création du classement...');
  for (const student of students) {
    await prisma.leaderboard.create({
      data: {
        studentId: student.id,
        totalPoints: student.points,
        dailyPoints: Math.floor(Math.random() * 50),
        weeklyPoints: Math.floor(Math.random() * 100),
        monthlyPoints: Math.floor(Math.random() * 200),
        completedTasks: Math.floor(Math.random() * 15),
        currentStreak: Math.floor(Math.random() * 10),
        bestStreak: Math.floor(Math.random() * 15),
        rank: 0, // Will be calculated later
      },
    });
  }
  console.log('✅ Classement créé.');

  // Create some messages in the chatroom
  console.log('✉️ Création des messages...');
  if (students.length > 0) {
    await prisma.message.create({
        data: {
            message: "Bonjour la classe! N'oubliez pas vos devoirs pour demain.",
            senderId: teacher.id,
            senderName: teacher.name!,
            classroomId: classroomA.id,
        }
    });

    await prisma.message.create({
        data: {
            message: "Bonjour Monsieur, j'ai une question sur l'exercice 3.",
            senderId: students[0].id,
            senderName: students[0].name!,
            classroomId: classroomA.id,
        }
    });

    await prisma.message.create({
        data: {
            message: "Quelqu'un a compris la leçon d'aujourd'hui ?",
            senderId: students[1].id,
            senderName: students[1].name!,
            classroomId: classroomA.id,
        }
    });
  }
  console.log('✅ Messages créés.');
  
  // Create some announcements
  console.log('📢 Création des annonces...');
  await prisma.announcement.create({
    data: {
      title: 'Bienvenue sur Classroom Connector !',
      content: "C'est un nouvel espace pour apprendre et explorer ensemble. N'hésitez pas à poser des questions !",
      authorId: teacher.id,
      // Public announcement (classeId is null)
    }
  });
  await prisma.announcement.create({
    data: {
      title: 'Rappel pour la Classe A',
      content: 'Le projet sur les volcans est à rendre pour vendredi prochain. Bon courage !',
      authorId: teacher.id,
      classeId: classroomA.id,
    }
  });
  await prisma.announcement.create({
    data: {
      title: 'Concours de Mathématiques',
      content: 'Participez au concours de mathématiques la semaine prochaine ! Des points bonus à gagner.',
      authorId: teacher.id,
      classeId: classroomB.id,
    }
  });
  console.log('✅ Annonces créées.');

  // Create achievements
  console.log('🎖️ Création des succès...');
  await prisma.achievement.createMany({
    data: [
      {
        name: 'Premier Pas',
        description: 'Complète ta première tâche',
        icon: '🎯',
        points: 100,
        criteria: { type: 'first_task' }
      },
      {
        name: 'Streak de 7 jours',
        description: 'Complète des tâches 7 jours consécutifs',
        icon: '🔥',
        points: 200,
        criteria: { type: 'streak', days: 7 }
      },
      {
        name: 'Maître des Tâches',
        description: 'Complète 50 tâches',
        icon: '🏆',
        points: 500,
        criteria: { type: 'total_tasks', count: 50 }
      },
      {
        name: 'Collaborateur Pro',
        description: 'Participe à 10 sessions de groupe',
        icon: '🤝',
        points: 300,
        criteria: { type: 'group_sessions', count: 10 }
      },
      {
        name: 'Curieux Insatiable',
        description: 'Pose 20 questions en classe',
        icon: '❓',
        points: 150,
        criteria: { type: 'questions_asked', count: 20 }
      }
    ]
  });
  console.log('✅ Succès créés.');

  console.log('🎉 Seeding terminé avec succès !');
  console.log(`📊 Résumé :`);
  console.log(`   - 1 professeur créé`);
  console.log(`   - 3 classes créées`);
  console.log(`   - ${students.length} élèves créés`);
  console.log(`   - 3 métiers créés`);
  console.log(`   - 19 tâches créées`);
  console.log(`   - 5 succès créés`);
  console.log(`   - Classement initialisé`);
}

main()
  .catch((e) => {
    console.error('❌ Une erreur est survenue durant le seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


// prisma/seed.ts
import { PrismaClient, Role, TaskType, TaskDifficulty, TaskCategory } from '@prisma/client';
import placeholderImages from '../src/lib/placeholder-images.json';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Démarrage du seeding...');

  // Clean up existing data in the correct order to avoid foreign key constraints
  console.log('🧹 Nettoyage des anciennes données...');
  
  // Delete in reverse order of dependencies
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
  await prisma.annonce.deleteMany();
  await prisma.coursSession.deleteMany();
  await prisma.task.deleteMany();
  
  // Delete classes before users since classes depend on users (professeurId)
  await prisma.classe.deleteMany();
  
  // Finally delete users
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
      // Daily
      { title: 'Connexion quotidienne', description: 'Connectez-vous une fois par jour.', points: 5, type: TaskType.DAILY, category: TaskCategory.ENGAGEMENT, duration: 1, isActive: true, prerequisites: [], difficulty: TaskDifficulty.EASY },
      { title: 'Message quotidien', description: 'Envoyez un message dans le chat de la classe.', points: 10, type: TaskType.DAILY, category: TaskCategory.ENGAGEMENT, duration: 1, isActive: true, prerequisites: [], difficulty: TaskDifficulty.EASY },
      { title: 'Réaction emoji', description: 'Réagissez à un message avec un emoji.', points: 3, type: TaskType.DAILY, category: TaskCategory.ENGAGEMENT, duration: 1, isActive: true, prerequisites: [], difficulty: TaskDifficulty.EASY },
      { title: 'Question pertinente', description: 'Posez une question intelligente en classe.', points: 15, type: TaskType.DAILY, category: TaskCategory.ACADEMIC, duration: 1, isActive: true, prerequisites: [], difficulty: TaskDifficulty.MEDIUM },
      
      // Weekly
      { title: 'Mission hebdomadaire', description: 'Terminez tous vos devoirs de la semaine.', points: 50, type: TaskType.WEEKLY, category: TaskCategory.ACADEMIC, duration: 7, isActive: true, prerequisites: [], difficulty: TaskDifficulty.MEDIUM },
      { title: 'Collaboration de groupe', description: 'Participez à une session de groupe et contribuez activement.', points: 40, type: TaskType.WEEKLY, category: TaskCategory.COLLABORATIVE, duration: 7, isActive: true, prerequisites: [], difficulty: TaskDifficulty.MEDIUM },
      { title: 'Synthèse de la semaine', description: 'Postez un résumé de ce que vous avez appris cette semaine.', points: 30, type: TaskType.WEEKLY, category: TaskCategory.ACADEMIC, duration: 7, isActive: true, prerequisites: [], difficulty: TaskDifficulty.EASY },
      { title: 'Défi créatif hebdomadaire', description: 'Réalisez un petit projet créatif lié au cours.', points: 60, type: TaskType.WEEKLY, category: TaskCategory.CREATIVE, duration: 7, isActive: true, prerequisites: [], difficulty: TaskDifficulty.HARD },
      
      // Monthly
      { title: 'Objectif de sessions', description: 'Participez à au moins 3 sessions en direct ce mois-ci.', points: 100, type: TaskType.MONTHLY, category: TaskCategory.ENGAGEMENT, duration: 30, isActive: true, prerequisites: [], difficulty: TaskDifficulty.MEDIUM },
      { title: 'Projet créatif mensuel', description: 'Soumettez un projet personnel ambitieux lié à votre ambition.', points: 150, type: TaskType.MONTHLY, category: TaskCategory.CREATIVE, duration: 30, isActive: true, prerequisites: [], difficulty: TaskDifficulty.HARD },
      { title: 'Maître des points', description: 'Atteignez le top 3 du classement ce mois-ci.', points: 200, type: TaskType.MONTHLY, category: TaskCategory.COMPETITION, duration: 30, isActive: true, prerequisites: [], difficulty: TaskDifficulty.HARD },
      { title: 'Présentation Académique', description: 'Préparez et présentez un sujet de recherche à la classe.', points: 180, type: TaskType.MONTHLY, category: TaskCategory.ACADEMIC, duration: 30, isActive: true, prerequisites: [], difficulty: TaskDifficulty.HARD },
    ]
  });
  console.log('✅ Tâches créées.');

  // Create classes (AFTER teacher is created)
  console.log('🏫 Création des classes...');
  const classeA = await prisma.classe.create({
    data: { nom: 'Classe A', professeurId: teacher.id },
  });
  const classeB = await prisma.classe.create({
    data: { nom: 'Classe B', professeurId: teacher.id },
  });
  const classeC = await prisma.classe.create({
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

  const classes = [classeA, classeB, classeC];
  let studentIndex = 0;
  const students = [];

  for (const classe of classes) {
      for (let i = 0; i < 10; i++) {
          const name = studentNames[studentIndex];
          const student = await prisma.user.create({
              data: {
                  name: name,
                  email: `${name.toLowerCase()}@example.com`,
                  role: 'ELEVE',
                  ambition: `devenir ${name === 'Fatima' ? 'médecin' : 'ingénieur'}`,
                  points: Math.floor(Math.random() * 250),
                  classeId: classe.id,
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
            classeId: classeA.id,
        }
    });

    await prisma.message.create({
        data: {
            message: "Bonjour Monsieur, j'ai une question sur l'exercice 3.",
            senderId: students[0].id,
            senderName: students[0].name!,
            classeId: classeA.id,
        }
    });

    await prisma.message.create({
        data: {
            message: "Quelqu'un a compris la leçon d'aujourd'hui ?",
            senderId: students[1].id,
            senderName: students[1].name!,
            classeId: classeA.id,
        }
    });
  }
  console.log('✅ Messages créés.');
  
  // Create some announcements
  console.log('📢 Création des annonces...');
  await prisma.annonce.create({
    data: {
      title: 'Bienvenue sur Classroom Connector !',
      content: "C'est un nouvel espace pour apprendre et explorer ensemble. N'hésitez pas à poser des questions !",
      authorId: teacher.id,
      // Public announcement (classeId is null)
    }
  });
  await prisma.annonce.create({
    data: {
      title: 'Rappel pour la Classe A',
      content: 'Le projet sur les volcans est à rendre pour vendredi prochain. Bon courage !',
      authorId: teacher.id,
      classeId: classeA.id,
    }
  });
  await prisma.annonce.create({
    data: {
      title: 'Concours de Mathématiques',
      content: 'Participez au concours de mathématiques la semaine prochaine ! Des points bonus à gagner.',
      authorId: teacher.id,
      classeId: classeB.id,
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
  console.log(`   - 12 tâches créées`);
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



    

    

    

    

    
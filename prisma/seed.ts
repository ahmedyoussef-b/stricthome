
// prisma/seed.ts
import { PrismaClient, Role, TaskType } from '@prisma/client';
import placeholderImages from '../src/lib/placeholder-images.json';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Démarrage du seeding...');

  // Clean up existing data
  console.log('🧹 Nettoyage des anciennes données...');
  // Delete relations first to avoid foreign key constraint errors
  await prisma.etatEleve.deleteMany();
  await prisma.coursSession.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.taskCompletion.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.annonce.deleteMany();
  await prisma.classe.deleteMany();
  
  // Then delete main entities
  await prisma.user.deleteMany();
  await prisma.metier.deleteMany();
  await prisma.task.deleteMany();
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

  // Create Tasks
  console.log('🎯 Création des tâches...');
  await prisma.task.createMany({
    data: [
      { title: 'Connexion quotidienne', description: 'Connectez-vous une fois par jour.', points: 5, type: TaskType.DAILY },
      { title: 'Message quotidien', description: 'Envoyez un message dans le chat de la classe.', points: 10, type: TaskType.DAILY },
      { title: 'Réaction emoji', description: 'Réagissez à un message avec un emoji.', points: 3, type: TaskType.DAILY },
      { title: 'Question pertinente', description: 'Posez une question intelligente en classe.', points: 15, type: TaskType.DAILY },
      
      { title: 'Mission hebdomadaire', description: 'Terminez tous vos devoirs de la semaine.', points: 50, type: TaskType.WEEKLY },
      { title: 'Collaboration', description: 'Participez à une session de groupe.', points: 40, type: TaskType.WEEKLY },
      { title: 'Synthèse de la semaine', description: 'Postez un résumé de ce que vous avez appris.', points: 30, type: TaskType.WEEKLY },
      
      { title: 'Objectif mensuel', description: 'Participez à au moins 3 sessions en direct.', points: 100, type: TaskType.MONTHLY },
      { title: 'Projet créatif', description: 'Soumettez un projet personnel lié à votre ambition.', points: 150, type: TaskType.MONTHLY },
      { title: 'Maître des points', description: 'Atteignez le top 3 du classement ce mois-ci.', points: 200, type: TaskType.MONTHLY },
    ]
  })
  console.log('✅ Tâches créées.');


  // Create a teacher
  console.log('🧑‍🏫 Création du professeur...');
  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@example.com',
      name: 'M. Dupont',
      role: Role.PROFESSEUR,
    },
  });
  console.log('✅ Professeur créé.');

  // Create a class
  console.log('🏫 Création de la classe...');
  const classeA = await prisma.classe.create({
    data: {
      nom: 'Classe A',
      professeurId: teacher.id,
    },
  });
  console.log('✅ Classe créée.');

  // Create students
  console.log('🧑‍🎓 Création des élèves...');
  const studentsData = [
    { name: 'Alice', ambition: 'devenir pompier', email: 'student1@example.com', points: 125 },
    { name: 'Bob', ambition: 'explorer Mars', email: 'student2@example.com', points: 80 },
    { name: 'Charlie', ambition: 'soigner les animaux', email: 'student3@example.com', points: 210 },
    { name: 'Diana', ambition: "être une artiste célèbre", email: 'student4@example.com', points: 55 },
  ];
  
  const createdStudents = [];
  for (const studentData of studentsData) {
    const student = await prisma.user.create({
      data: {
        email: studentData.email,
        name: studentData.name,
        role: Role.ELEVE,
        ambition: studentData.ambition,
        points: studentData.points,
        classeId: classeA.id,
      },
    });
    createdStudents.push(student);
  }

  // Create student states
  await prisma.etatEleve.create({
      data: { eleveId: createdStudents[0].id, isPunished: false, metierId: pompier.id },
  });
   await prisma.etatEleve.create({
      data: { eleveId: createdStudents[1].id, isPunished: false, metierId: astronaute.id },
  });
   await prisma.etatEleve.create({
      data: { eleveId: createdStudents[2].id, isPunished: false, metierId: veterinaire.id },
  });
    await prisma.etatEleve.create({
      data: { eleveId: createdStudents[3].id, isPunished: false },
  });

  console.log('✅ Élèves et leurs états créés.');

  // Create some messages in the chatroom
  console.log('✉️ Création des messages...');
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
        senderId: createdStudents[0].id,
        senderName: createdStudents[0].name!,
        classeId: classeA.id,
    }
  });
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
  console.log('✅ Annonces créées.');


  console.log('🎉 Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Une erreur est survenue durant le seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

    
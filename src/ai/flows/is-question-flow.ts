// src/ai/flows/is-question-flow.ts
'use server';
/**
 * @fileOverview Un agent pour déterminer si un texte est une question.
 *
 * - isQuestion - Une fonction qui analyse un message.
 */

/**
 * Détermine si un texte est une question en se basant sur des mots-clés.
 * @param text Le message à analyser.
 * @returns Vrai si le message est probablement une question, faux sinon.
 */
export async function isQuestion(text: string): Promise<boolean> {
  const questionWords = ['qui', 'que', 'quoi', 'quand', 'où', 'pourquoi', 'comment'];
  const lowerCaseText = text.toLowerCase();
  
  if (text.trim().endsWith('?')) {
    return true;
  }
  
  return questionWords.some(word => {
    // Check for whole words to avoid matching parts of words
    return new RegExp(`\\b${word}\\b`).test(lowerCaseText);
  });
}

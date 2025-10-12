// src/ai/flows/is-question-flow.ts
'use server';
/**
 * @fileOverview Un agent IA pour déterminer si un texte est une question.
 *
 * - isQuestion - Une fonction qui analyse un message.
 * - IsQuestionInput - Le type d'entrée pour la fonction isQuestion.
 * - IsQuestionOutput - Le type de retour pour la fonction isQuestion.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IsQuestionInputSchema = z.object({
  message: z.string().describe('Le contenu du message à analyser.'),
});
export type IsQuestionInput = z.infer<typeof IsQuestionInputSchema>;

const IsQuestionOutputSchema = z.object({
  isQuestion: z
    .boolean()
    .describe(
      'Vrai si le message est une question, faux dans le cas contraire.'
    ),
});
export type IsQuestionOutput = z.infer<typeof IsQuestionOutputSchema>;

export async function isQuestion(
  input: IsQuestionInput
): Promise<IsQuestionOutput> {
  return isQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'isQuestionPrompt',
  input: { schema: IsQuestionInputSchema },
  output: { schema: IsQuestionOutputSchema },
  prompt: `Vous êtes un expert en linguistique. Analysez le message suivant et déterminez s'il s'agit d'une question.

Message: {{{message}}}

Répondez uniquement par le format JSON demandé. Une question doit chercher à obtenir une information. Les salutations comme "ça va ?" ne sont pas considérées comme de vraies questions dans ce contexte.`,
});

const isQuestionFlow = ai.defineFlow(
  {
    name: 'isQuestionFlow',
    inputSchema: IsQuestionInputSchema,
    outputSchema: IsQuestionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

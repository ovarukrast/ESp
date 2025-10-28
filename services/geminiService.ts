import { GoogleGenAI } from "@google/genai";
import { Difficulty, ExerciseType } from "../types";

const MODEL_NAME = 'gemini-2.5-flash';

export const generateExerciseSheet = async (
  topic: string,
  exerciseType: ExerciseType,
  difficulty: Difficulty,
  numQuestions: number
): Promise<string> => {
  // Fix: Per Gemini API guidelines, the API key is assumed to be present in
  // the environment variables, so the check for its existence has been removed.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Eres un experto profesor de español creando materiales de aprendizaje interactivos. Tu tarea es generar una ficha de ejercicios en español basada en los siguientes criterios. La salida DEBE estar en formato Markdown y ser fácilmente analizable por una máquina.

    **Tema:** ${topic}
    **Tipo de Ejercicio:** ${exerciseType}
    **Nivel de Dificultad:** ${difficulty} (escala MCER)

    **Instrucciones de Formato Estricto:**
    1.  Crea un título claro y conciso para la ficha (ej. "# Ficha de Ejercicios: Los Verbos en Presente"). No incluyas ningún texto antes del título.
    2.  Proporciona una instrucción breve y sencilla para el estudiante.
    3.  Genera exactamente ${numQuestions} preguntas, cada una en una nueva línea y comenzando con un número seguido de un punto (ej. "1. ...").
    4.  **Para ejercicios de 'Completar los espacios'**: Usa "[___]" para indicar dónde debe ir la respuesta. NO uses "____".
    5.  **Para ejercicios de 'Opción múltiple'**: Cada opción debe estar en su propia línea, comenzando con una letra mayúscula entre paréntesis, ej. "(A) Opción 1".
    6.  **Para ejercicios de 'Ordenar las frases'**: Proporciona las palabras desordenadas en una sola línea, separadas por " / ".
    7.  **Clave de Respuestas OBLIGATORIA**: Al final, proporciona una sección separada titulada exactamente "## Clave de Respuestas".
    8.  En la clave de respuestas, enumera las respuestas correctas. Cada respuesta debe estar en una nueva línea, comenzando con el número de la pregunta seguido de un punto. Ej: "1. respuesta correcta". Para opción múltiple, solo indica la respuesta correcta, no la letra de la opción. Ej: "3. es".
    9.  **Importante para 'Ordenar las frases'**: La respuesta NO debe terminar con un punto. Si hay múltiples órdenes gramaticalmente correctos (ej. adjetivos intercambiables), enumera todas las variaciones correctas separadas por un pipe "|".
    10. Formatea toda la salida usando Markdown para una estructura clara (encabezados, listas, etc.).

    Ejemplo de "Completar los espacios":
    # Ficha: El Pretérito
    Completa las frases con el verbo correcto.
    1. Ayer, yo [___] al cine. (ir)
    2. María [___] una carta. (escribir)
    ...
    ## Clave de Respuestas
    1. fui
    2. escribió

    Ejemplo de "Opción Múltiple":
    # Ficha: Los Sustantivos
    Elige la opción correcta.
    1. ¿Cuál de estas palabras es un sustantivo?
    (A) Correr
    (B) Feliz
    (C) Casa
    ...
    ## Clave de Respuestas
    1. Casa

    Ejemplo de "Ordenar las frases":
    # Ficha: Orden de Frases
    Ordena las palabras para formar frases correctas.
    1. museo / es / El / muy / famoso / y / interesante
    2. a / parque / vamos / el / nosotros
    ...
    ## Clave de Respuestas
    1. El museo es muy famoso y interesante | El museo es muy interesante y famoso
    2. Nosotros vamos al parque
    `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate exercise sheet from Gemini API.");
  }
};
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI API with your API key from a .env file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

/**
 * Translates a list of sentences using GPT-4o.
 * @param {Array<string>} sentences - The list of sentences to translate.
 * @param {string} targetLanguage - The target language for the translation (e.g., "Spanish").
 * @param {string} tone - The tone of the translation (e.g., "formal" or "informal").
 * @param {number} maxLength - Maximum character count for each translated sentence (optional).
 * @returns {Promise<Array<string>>} - The translated sentences.
 */
async function translateSentences(sentences, targetLanguage, tone = "formal", maxLength = null) {
  if (!Array.isArray(sentences) || sentences.length === 0) {
    throw new Error("The input must be a non-empty array of sentences.");
  }

  const delimiter = "@";
  const promptBase = `Translate the following sentences into ${targetLanguage} with a ${tone} tone. Return nothing but the translations with the ${delimiter} symbol between them.`;
  const lengthInstruction = maxLength
  const promptBase = `Translate the following sentences into ${targetLanguage} with a ${tone} tone. Return nothing but the translations with the ${delimiter} symbol between them. Maintain consistent terminology for recurring terms or names.`;
  const lengthInstruction = maxLength ? ` Make sure each sentence is no longer than ${maxLength} characters.`: "";

  const prompt = `${promptBase}${lengthInstruction}\n\nSentences:\n${sentences
    .map((sentence, index) => `${index + 1}. ${sentence}`)
    .join("\n")}`;

  try {
    const context =
      `You are a professional translator. Return translations as a list, with each translation separated by the ${delimiter} symbol without spaces.`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: context,
        },
        { role: "user", content: prompt },
      ],
    });

    const translatedText = response.choices[0].message.content;

    // Split translations using the delimiter
    const translatedSentences = translatedText.split(delimiter).map((line) => line.trim());

    var numSentencesTooLong = 0;
    for (let sentence of translatedSentences) {
        if (sentence.length > maxLength) {
          numSentencesTooLong++;
        }
    }

    if (numSentencesTooLong) {
        const sentWord = numSentencesTooLong != 1 ? "sentences are" : "sentence is";
        console.log(`Note: ${numSentencesTooLong} ${sentWord} over the character limit of ${maxLength}.`)
    }

    return translatedSentences;
  } catch (error) {
    console.error("Error translating sentences:", error);
    throw new Error("Failed to translate sentences.");
  }
}

// Example
(async () => {
  const spanishIdioms = [
    "Ella está buscando el príncipe azul.", // Literal: She is looking for the blue prince. Actual: She is looking for Prince Charming (the perfect man)
    "Ver todo color de rosa.", // Literal: To see everything in the pink color. Actual: To see through rose-colored glasses.
    "He encontrado mi media naranja.", // Literal: To find your half orange. Actual: To find your other/better half.
    "No hay color.", // Literal: There is no color. Actual: It's like comparing apples to oranges.
    "Tengo la negra", // Literal: I have the black color. Actual: I have bad luck.
    "Ella está hasta en la sopa." // Literal: She is evenly in the soup. Actual: She is here, there, and everywhere.
  ];
  const sentences = [
    "In this video, we will demonstrate how holograms work.",
    "Holograms are created using light and interference patterns.",
    "Here's a question that nobody in the world knows the answer to.",
    "Suppose you have some closed continuous curve, which essentially means some squiggle you could draw on paper without lifting the pen that ends where it starts.",
    "If you can find four points somewhere on this loop that make the vertices of a square, it's called an inscribed square of the loop."
  ];

  const targetLanguage = "English"; // Can also include regional language inputs (e.g. Mexican Spanish, Canadian French, etc.)
  const tone = "formal"; // Can also include other tones (e.g. informal, casual, excited, inspiring)
  const maxLength = 100; // Optional: limit each sentence to 100 characters

  try {
    const translations = await translateSentences(spanishIdioms, targetLanguage, tone, maxLength);
    console.log("Translated Sentences:", translations);
  } catch (error) {
    console.error(error.message);
  }
})();

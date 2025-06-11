import { v2 } from '@google-cloud/translate';
import { db } from "@db";
import { guides, users } from "@db/schema";
import { eq } from "drizzle-orm";

const translate = new v2.Translate({
  projectId: process.env.GOOGLE_PROJECT_ID,
  key: process.env.GOOGLE_TRANSLATE_API_KEY,
});

interface TranslationResult {
  originalText: string;
  translatedText: string;
  detectedSourceLanguage: string;
}

export async function translateText(
  text: string,
  targetLanguage: string
): Promise<TranslationResult> {
  try {
    console.log('Attempting to translate text:', {
      textLength: text.length,
      targetLanguage,
      hasGoogleKey: !!process.env.GOOGLE_TRANSLATE_API_KEY,
      hasProjectId: !!process.env.GOOGLE_PROJECT_ID
    });

    const [translation, metadata] = await translate.translate(text, targetLanguage);

    console.log('Translation successful:', {
      originalLength: text.length,
      translatedLength: translation.length,
      detectedLanguage: metadata.data.translations[0].detectedSourceLanguage
    });

    return {
      originalText: text,
      translatedText: translation,
      detectedSourceLanguage: metadata.data.translations[0].detectedSourceLanguage,
    };
  } catch (error) {
    console.error('Translation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`Failed to translate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function translateGuideProfile(
  guideId: number,
  targetLanguage: string
): Promise<{
  bio: TranslationResult;
  specialties: TranslationResult[];
}> {
  try {
    console.log('Starting guide profile translation:', {
      guideId,
      targetLanguage
    });

    // Query guide with user relation using db.query
    const guide = await db.query.guides.findFirst({
      where: eq(guides.id, guideId),
      with: {
        user: true
      }
    });

    console.log('Guide data retrieved:', {
      found: !!guide,
      hasSpecialties: guide?.specialties?.length,
      hasBio: !!guide?.user?.bio
    });

    if (!guide || !guide.specialties) {
      throw new Error('Guide not found or missing required data');
    }

    // Translate bio
    const bioTranslation = await translateText(guide.user.bio || '', targetLanguage);

    // Translate specialties
    const specialtiesTranslations = await Promise.all(
      guide.specialties.map(specialty => translateText(specialty, targetLanguage))
    );

    console.log('Translation completed:', {
      bioTranslated: !!bioTranslation,
      specialtiesTranslated: specialtiesTranslations.length
    });

    return {
      bio: bioTranslation,
      specialties: specialtiesTranslations,
    };
  } catch (error) {
    console.error('Guide translation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`Failed to translate guide profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
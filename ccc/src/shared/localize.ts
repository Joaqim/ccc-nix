import dictionary from "./dictionary_se";

type Dictionary = typeof dictionary;
type TranslationKey = keyof Dictionary;
type TextToTranslate = keyof Dictionary[TranslationKey]["translation"];

export default (text: TextToTranslate, localeTarget: TranslationKey = "se") =>
  dictionary[localeTarget].translation[text];

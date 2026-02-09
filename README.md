
# ScriptValidator
## PIPELINE
1) Run 1RusExtractor to extract russian lines into russian_lines.txt. English_lines.txt and german_lines.txt updated. Same files used for every translation in dir X:\scriptTranslator\Translator
2) Translate russian text using GPT with prompt, paste in german, english, spanish_lines.txt accordingly.
3) Create placeholders for every language using 2AddPlaceholder.js
4) Merge placeholder file with translations using 3MergeSequentialAuto.js
5) Validate whole script using Validator

Russian master script
        ↓
extract-dialogue.js  (hash IDs)
        ↓
russian_lines_with_ids.txt
        ↓
GPT → english_lines_with_ids.txt
        ↓
mergeTranslations.js
        ↓
translation_db.txt
        ↓
applyToUnityScript.js  (inject translations, remove IDs)



## TO DO
1) **Pack into standalone app**
2) **Correct merge of lang, now it is only exchange one lang by another**

### Translator
1) **If line consists of latin letters only, it doesn't add a placeholder, example Sunset Angels!**
2) **Consider in RUS extract (hearts_Celeste 2)**

### Validator
1) **Check umlaut, GPT change them to ae, ue**
2) **Start with Cap letter??**
3) **start with <i> is ok, Add tag check if incomplete, example i>**
4) **Text in 2 lines - potential error**
5) **Consider ` in validator**
6) **Check and compare lines amount**
7) **Spanish letters validation**
8) **Check all names once again Sunset Angels, Sirens, Sunborn Bay**


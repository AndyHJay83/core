// Binary filter engine adapted from grail-binary/src/utils/binaryFilter.ts
// Plain JS version for integration into coretest-new.

const DEFAULT_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function filterWords(wordList, sequence, currentLetterIndex, letterSequence = DEFAULT_ALPHABET, dynamicSequence = []) {
  let currentLetter;
  let isComplete;

  if (letterSequence === '') {
    currentLetter = dynamicSequence[currentLetterIndex] || '';
    isComplete = currentLetterIndex >= dynamicSequence.length;
  } else if (currentLetterIndex < letterSequence.length) {
    currentLetter = letterSequence[currentLetterIndex] || '';
    isComplete = currentLetterIndex >= letterSequence.length;
  } else {
    const dynamicIndex = currentLetterIndex - letterSequence.length;
    currentLetter = dynamicSequence[dynamicIndex] || '';
    isComplete = dynamicIndex >= dynamicSequence.length;
  }

  if (!sequence || sequence.length === 0) {
    return {
      leftWords: wordList,
      rightWords: wordList,
      leftCount: wordList.length,
      rightCount: wordList.length,
      currentLetter,
      letterIndex: currentLetterIndex,
      isComplete,
      sequence: sequence || []
    };
  }

  const leftWords = [];
  const rightWords = [];

  wordList.forEach(word => {
    const upperWord = String(word || '').toUpperCase();
    let matchesLeftPattern = true;
    let matchesRightPattern = true;

    for (let i = 0; i < sequence.length; i++) {
      let letter;
      if (letterSequence === '') {
        letter = dynamicSequence[i] || '';
      } else if (i < letterSequence.length) {
        letter = letterSequence[i];
      } else {
        letter = dynamicSequence[i] || '';
      }

      const choice = sequence[i];
      if (!letter) continue;

      const hasLetter = upperWord.includes(letter);

      if (choice === 'L' && !hasLetter) matchesLeftPattern = false;
      if (choice === 'R' && hasLetter) matchesLeftPattern = false;

      if (choice === 'R' && !hasLetter) matchesRightPattern = false;
      if (choice === 'L' && hasLetter) matchesRightPattern = false;
    }

    if (matchesLeftPattern) leftWords.push(word);
    if (matchesRightPattern) rightWords.push(word);
  });

  return {
    leftWords,
    rightWords,
    leftCount: leftWords.length,
    rightCount: rightWords.length,
    currentLetter,
    letterIndex: currentLetterIndex,
    isComplete,
    sequence: sequence.slice()
  };
}

// Color thresholds: 1 (green), 2-5 (orange), 6-10 (red), 11+ (no color)
function getWordCountClass(count) {
  if (count === 1) return 'mute-count-green';
  if (count >= 2 && count <= 5) return 'mute-count-orange';
  if (count >= 6 && count <= 10) return 'mute-count-red';
  return ''; // 11+ neutral
}

function analyzeLetterFrequency(words) {
  const frequency = new Map();
  for (const word of words || []) {
    const upper = String(word || '').toUpperCase();
    for (const ch of upper) {
      if (ch >= 'A' && ch <= 'Z') {
        frequency.set(ch, (frequency.get(ch) || 0) + 1);
      }
    }
  }
  return frequency;
}

function selectNextDynamicLetter(words, usedLetters) {
  const used = usedLetters || new Set();
  if (!words || words.length === 0) return null;

  if (words.length <= 5) {
    const lettersInWords = new Set();
    for (const word of words) {
      const upper = String(word || '').toUpperCase();
      for (const ch of upper) {
        if (ch >= 'A' && ch <= 'Z') lettersInWords.add(ch);
      }
    }

    const alphabet = DEFAULT_ALPHABET;
    for (const letter of alphabet) {
      if (used.has(letter)) continue;
      let wordsWithLetter = 0;
      for (const word of words) {
        if (String(word || '').toUpperCase().includes(letter)) wordsWithLetter++;
      }
      if (wordsWithLetter === 1) return letter;
    }

    for (const letter of lettersInWords) {
      if (!used.has(letter)) return letter;
    }

    for (const letter of alphabet) {
      if (used.has(letter)) continue;
      let wordsWithLetter = 0;
      for (const word of words) {
        if (String(word || '').toUpperCase().includes(letter)) wordsWithLetter++;
      }
      if (wordsWithLetter > 0 && wordsWithLetter < words.length) return letter;
    }

    return null;
  }

  const freq = analyzeLetterFrequency(words);
  let maxFreq = 0;
  let selectedLetter = null;
  for (const [letter, f] of freq.entries()) {
    if (used.has(letter)) continue;
    if (f > maxFreq) {
      maxFreq = f;
      selectedLetter = letter;
    }
  }
  return selectedLetter;
}

function getNextLetterWithDynamic(currentIndex, letterSequence, remainingWords, usedLetters, mostFrequentFilter) {
  const used = usedLetters || new Set();

  if (letterSequence === '') {
    const dynamicLetter = selectNextDynamicLetter(remainingWords, used);
    return { letter: dynamicLetter || '', isDynamic: !!dynamicLetter };
  }

  if (currentIndex < letterSequence.length) {
    const letter = letterSequence[currentIndex];
    if (used.has(letter)) {
      for (let i = currentIndex + 1; i < letterSequence.length; i++) {
        const nextLetter = letterSequence[i];
        if (!used.has(nextLetter)) {
          return { letter: nextLetter, isDynamic: false };
        }
      }
      const dynamicLetter = selectNextDynamicLetter(remainingWords, used);
      return { letter: dynamicLetter || '', isDynamic: !!dynamicLetter };
    }
    return { letter, isDynamic: false };
  }

  if (!mostFrequentFilter) {
    return { letter: '', isDynamic: false };
  }

  const dynamicLetter = selectNextDynamicLetter(remainingWords, used);
  return { letter: dynamicLetter || '', isDynamic: !!dynamicLetter };
}

// Expose as global for script.js
window.muteBinaryEngine = {
  filterWords,
  getWordCountClass,
  analyzeLetterFrequency,
  selectNextDynamicLetter,
  getNextLetterWithDynamic,
};


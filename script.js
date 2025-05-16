// Global helper function to check if a character is a consonant
const isConsonant = (function() {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    return function(char) {
        if (!char) return false;
        return !vowels.has(char.toLowerCase());
    };
})();

let wordList = [];
let totalWords = 0;
let isNewMode = true;
let isLexiconMode = true;
let isVowelMode = true;
let isShapeMode = true;
let currentFilteredWords = [];
let currentPosition = -1;
let currentPosition2 = -1;
let currentVowelIndex = 0;
let uniqueVowels = [];
let currentFilteredWordsForVowels = [];
let originalFilteredWords = [];
let hasAdjacentConsonants = null;
let hasO = null;
let selectedCurvedLetter = null;
let isOMode = false;
let isCurvedMode = false;
let isTogetherMode = true;
let isWordMode = true;

// Function to check if a word has any adjacent consonants
function hasWordAdjacentConsonants(word) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const wordLower = word.toLowerCase();
    
    for (let i = 0; i < wordLower.length - 1; i++) {
        const currentChar = wordLower[i];
        const nextChar = wordLower[i + 1];
        
        // Check if both current and next characters are consonants
        if (!vowels.has(currentChar) && !vowels.has(nextChar)) {
            console.log(`Found adjacent consonants in "${wordLower}": "${currentChar}${nextChar}" at position ${i}`);
            return true;
        }
    }
    return false;
}

// Letter shape categories with exact categorization
const letterShapes = {
    straight: new Set(['A', 'E', 'F', 'H', 'I', 'K', 'L', 'M', 'N', 'T', 'V', 'W', 'X', 'Y', 'Z']),
    curved: new Set(['B', 'C', 'D', 'G', 'J', 'O', 'P', 'Q', 'R', 'S', 'U'])
};

// Function to get letter shape
function getLetterShape(letter) {
    letter = letter.toUpperCase();
    if (letterShapes.straight.has(letter)) return 'straight';
    if (letterShapes.curved.has(letter)) return 'curved';
    return null;
}

// Function to analyze position shapes
function analyzePositionShapes(words, position) {
    const shapes = {
        straight: new Set(),
        curved: new Set()
    };
    
    let totalLetters = 0;
    
    words.forEach(word => {
        if (word.length > position) {
            const letter = word[position];
            const shape = getLetterShape(letter);
            console.log(`Word ${word}: Position ${position + 1} has letter ${letter} which is ${shape}`);
            if (shape) {
                shapes[shape].add(letter);
                totalLetters++;
            }
        }
    });
    
    const distribution = {
        straight: shapes.straight.size / totalLetters,
        curved: shapes.curved.size / totalLetters
    };
    
    console.log(`Position ${position + 1} analysis:`, {
        shapes: {
            straight: Array.from(shapes.straight),
            curved: Array.from(shapes.curved)
        },
        distribution,
        totalLetters
    });
    
    return {
        shapes,
        distribution,
        totalLetters
    };
}

// Function to find position with least variance
function findLeastVariancePosition(words, startPos, endPos) {
    let maxVariance = -1;
    let result = -1;
    
    console.log('Finding position with most variance in words:', words);
    
    for (let pos = startPos; pos < endPos; pos++) {
        const analysis = analyzePositionShapes(words, pos);
        
        // Skip if we don't have at least one letter of each shape
        if (analysis.shapes.straight.size === 0 || analysis.shapes.curved.size === 0) {
            console.log(`Position ${pos + 1} skipped: missing one or both shapes`);
            continue;
        }
        
        // Calculate variance between the two distributions
        const variance = Math.abs(analysis.distribution.straight - analysis.distribution.curved);
        console.log(`Position ${pos + 1} variance:`, variance, 'straight:', analysis.distribution.straight, 'curved:', analysis.distribution.curved);
        
        if (variance > maxVariance) {
            maxVariance = variance;
            result = pos;
            console.log(`New best position: ${pos + 1} with variance ${variance}`);
        }
    }
    
    console.log('Selected position:', result + 1, 'with variance:', maxVariance);
    return result;
}

// Function to get shortest word length
function getShortestWordLength(words) {
    return Math.min(...words.map(word => word.length));
}

// Function to filter words by shape category
function filterWordsByShape(words, position, category) {
    return words.filter(word => {
        if (word.length <= position) return false;
        const letter = word[position];
        return getLetterShape(letter) === category;
    });
}

// Function to update shape display
function updateShapeDisplay(words) {
    console.log('Updating shape display with words:', words.length);
    const shapeFeature = document.getElementById('shapeFeature');
    const shapeDisplay = shapeFeature.querySelector('.shape-display');
    
    if (!isShapeMode || words.length === 0) {
        console.log('Shape mode disabled or no words to display');
        shapeFeature.style.display = 'none';
        return;
    }

    // Get the length of the shortest word to avoid out-of-bounds
    const shortestLength = getShortestWordLength(words);
    console.log('Shortest word length:', shortestLength);
    
    // Analyze all positions in the words
    const startPos = 0;
    const endPos = shortestLength;
    console.log('Analyzing positions from', startPos, 'to', endPos);

    const position = findLeastVariancePosition(words, startPos, endPos);
    console.log('Found position with most variance:', position);
    
    if (position === -1) {
        console.log('No valid position found');
        shapeFeature.style.display = 'none';
        return;
    }

    currentPosition = position;
    const analysis = analyzePositionShapes(words, position);
    console.log('Shape analysis:', analysis);
    
    const shapes = analysis.shapes;
    
    const positionDisplay = shapeDisplay.querySelector('.position-display');
    positionDisplay.textContent = `Position ${position + 1}`;
    
    const categoryButtons = shapeDisplay.querySelector('.category-buttons');
    categoryButtons.innerHTML = '';
    
    Object.entries(shapes).forEach(([category, letters]) => {
        if (letters.size > 0) {
            const button = document.createElement('button');
            button.className = 'category-button';
            const percentage = Math.round(analysis.distribution[category] * 100);
            button.textContent = `${category.toUpperCase()} (${percentage}%)`;
            button.addEventListener('click', () => {
                const filteredWords = filterWordsByShape(words, position, category);
                displayResults(filteredWords);
                expandWordList();
            });
            categoryButtons.appendChild(button);
            console.log('Added button for category:', category, 'with percentage:', percentage);
        }
    });
    
    shapeFeature.style.display = 'block';
    console.log('Shape feature display updated');
}

// Function to load word list
async function loadWordList() {
    try {
        console.log('Attempting to load word list...');
        const possiblePaths = [
            'words/ENUK-Long words Noun.txt',
            './words/ENUK-Long words Noun.txt',
            '../words/ENUK-Long words Noun.txt',
            'ENUK-Long words Noun.txt'
        ];

        let response = null;
        let successfulPath = null;

        for (const path of possiblePaths) {
            try {
                console.log(`Trying path: ${path}`);
                response = await fetch(path);
                if (response.ok) {
                    successfulPath = path;
                    break;
                }
            } catch (e) {
                console.log(`Failed to load from ${path}: ${e.message}`);
            }
        }

        if (!response || !response.ok) {
            throw new Error(`Could not load word list from any of the attempted paths`);
        }

        console.log(`Successfully loaded from: ${successfulPath}`);
        const text = await response.text();
        console.log('Raw text length:', text.length);
        
        wordList = text.split('\n')
            .map(word => word.trim())
            .filter(word => word !== '');
            
        console.log('Processed word list length:', wordList.length);
        
        if (wordList.length === 0) {
            throw new Error('No words found in the file');
        }
        
        totalWords = wordList.length;
        console.log(`Successfully loaded ${totalWords} words`);
        updateWordCount(totalWords);
        displayResults(wordList);
        
    } catch (error) {
        console.error('Error loading word list:', error);
        document.getElementById('wordCount').textContent = 'Error loading words';
        
        const errorDetails = document.createElement('div');
        errorDetails.style.color = 'red';
        errorDetails.style.padding = '10px';
        errorDetails.textContent = `Error details: ${error.message}`;
        document.getElementById('wordCount').parentNode.appendChild(errorDetails);
    }
}

// Function to update word count
function updateWordCount(count) {
    const wordCountElement = document.getElementById('wordCount');
    if (wordCountElement) {
        wordCountElement.textContent = count;
    }
}

// Function to get consonants in order
function getConsonantsInOrder(str) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const consonants = [];
    const word = str.toLowerCase();
    
    for (let i = 0; i < word.length; i++) {
        if (!vowels.has(word[i])) {
            consonants.push(word[i]);
        }
    }
    
    console.log('Input word:', word);
    console.log('Consonants found in order:', consonants);
    return consonants;
}

// Function to get unique vowels
function getUniqueVowels(str) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const uniqueVowels = new Set();
    str.toLowerCase().split('').forEach(char => {
        if (vowels.has(char)) {
            uniqueVowels.add(char);
        }
    });
    const result = Array.from(uniqueVowels);
    console.log('Found unique vowels:', result);
    return result;
}

// Function to find least common vowel
function findLeastCommonVowel(words, vowels) {
    const vowelCounts = {};
    vowels.forEach(vowel => {
        vowelCounts[vowel] = 0;
    });

    words.forEach(word => {
        const wordLower = word.toLowerCase();
        vowels.forEach(vowel => {
            if (wordLower.includes(vowel)) {
                vowelCounts[vowel]++;
            }
        });
    });

    console.log('Vowel counts:', vowelCounts);

    let leastCommonVowel = vowels[0];
    let lowestCount = vowelCounts[vowels[0]];

    vowels.forEach(vowel => {
        if (vowelCounts[vowel] < lowestCount) {
            lowestCount = vowelCounts[vowel];
            leastCommonVowel = vowel;
        }
    });

    console.log('Selected least common vowel:', leastCommonVowel, 'with count:', lowestCount);
    return leastCommonVowel;
}

// Function to handle vowel selection
function handleVowelSelection(includeVowel) {
    const currentVowel = uniqueVowels[currentVowelIndex];
    console.log('Handling vowel selection:', currentVowel, 'Include:', includeVowel);
    console.log('Before filtering:', currentFilteredWordsForVowels.length, 'words');
    
    if (includeVowel) {
        currentFilteredWordsForVowels = currentFilteredWordsForVowels.filter(word => 
            word.toLowerCase().includes(currentVowel)
        );
    } else {
        currentFilteredWordsForVowels = currentFilteredWordsForVowels.filter(word => 
            !word.toLowerCase().includes(currentVowel)
        );
    }
    
    console.log('After filtering:', currentFilteredWordsForVowels.length, 'words');
    
    // Remove the processed vowel from uniqueVowels array
    uniqueVowels = uniqueVowels.filter(v => v !== currentVowel);
    
    // Update the display with the filtered words
    displayResults(currentFilteredWordsForVowels);
    
    // If we still have vowels to process, show the next one
    if (uniqueVowels.length > 0) {
        const vowelFeature = document.getElementById('vowelFeature');
        const vowelLetter = vowelFeature.querySelector('.vowel-letter');
        const leastCommonVowel = findLeastCommonVowel(originalFilteredWords, uniqueVowels);
        console.log('Setting next vowel letter to:', leastCommonVowel.toUpperCase());
        vowelLetter.textContent = leastCommonVowel.toUpperCase();
    } else {
        // No more vowels to process, mark as completed and move to next feature
        document.getElementById('vowelFeature').classList.add('completed');
        // Update currentFilteredWords with the vowel-filtered results
        currentFilteredWords = [...currentFilteredWordsForVowels];
        showNextFeature();
    }
}

// Function to show next feature
function showNextFeature() {
    console.log('Showing next feature...');
    console.log('Current mode states:', {
        isOMode,
        isCurvedMode,
        isTogetherMode,
        isWordMode,
        isVowelMode,
        isLexiconMode,
        isShapeMode
    });
    
    // First hide all features
    const allFeatures = [
        'oFeature',
        'curvedFeature',
        'position1Feature',
        'vowelFeature',
        'lexiconFeature',
        'consonantQuestion',
        'shapeFeature'
    ];
    
    allFeatures.forEach(featureId => {
        const feature = document.getElementById(featureId);
        if (feature) {
            feature.style.display = 'none';
            // Remove all click event listeners
            const buttons = feature.querySelectorAll('button');
            buttons.forEach(button => {
                button.replaceWith(button.cloneNode(true));
            });
        }
    });
    
    // Then show the appropriate feature based on the current state
    if (isOMode && !document.getElementById('oFeature').classList.contains('completed')) {
        console.log('Showing O? feature');
        const oFeature = document.getElementById('oFeature');
        oFeature.style.display = 'block';
        
        // Set up O? feature buttons
        const oYesBtn = document.getElementById('oYesBtn');
        const oNoBtn = document.getElementById('oNoBtn');
        const oSkipBtn = document.getElementById('oSkipBtn');
        
        if (oYesBtn) {
            oYesBtn.addEventListener('click', function handleYes() {
                console.log('O? YES selected');
                hasO = true;
                const filteredWords = currentFilteredWords.filter(word => word.toLowerCase().includes('o'));
                currentFilteredWords = filteredWords;
                displayResults(currentFilteredWords);
                oFeature.classList.add('completed');
                showNextFeature();
            });
        }
        
        if (oNoBtn) {
            oNoBtn.addEventListener('click', function handleNo() {
                console.log('O? NO selected');
                hasO = false;
                const filteredWords = currentFilteredWords.filter(word => !word.toLowerCase().includes('o'));
                currentFilteredWords = filteredWords;
                displayResults(currentFilteredWords);
                oFeature.classList.add('completed');
                showNextFeature();
            });
        }
        
        if (oSkipBtn) {
            oSkipBtn.addEventListener('click', function handleSkip() {
                console.log('O? SKIP selected');
                oFeature.classList.add('completed');
                showNextFeature();
            });
        }
    }
    else if (isCurvedMode && !document.getElementById('curvedFeature').classList.contains('completed')) {
        console.log('Showing CURVED feature');
        const curvedFeature = document.getElementById('curvedFeature');
        curvedFeature.style.display = 'block';
        
        // Set up CURVED feature buttons
        const curvedButtons = document.querySelectorAll('.curved-btn');
        curvedButtons.forEach(button => {
            button.addEventListener('click', function handleCurved() {
                const letter = button.textContent;
                console.log('CURVED letter selected:', letter);
                const filteredWords = currentFilteredWords.filter(word => word.toLowerCase().includes(letter.toLowerCase()));
                currentFilteredWords = filteredWords;
                displayResults(currentFilteredWords);
                curvedFeature.classList.add('completed');
                showNextFeature();
            });
        });
        
        const curvedSkipBtn = document.getElementById('curvedSkipBtn');
        if (curvedSkipBtn) {
            curvedSkipBtn.addEventListener('click', function handleSkip() {
                console.log('CURVED SKIP selected');
                curvedFeature.classList.add('completed');
                showNextFeature();
            });
        }
    }
    else if (isTogetherMode && hasAdjacentConsonants === null) {
        console.log('Showing TOGETHER? feature');
        const consonantQuestion = document.getElementById('consonantQuestion');
        consonantQuestion.style.display = 'block';
        
        // Set up Consonant question buttons
        const consonantYesBtn = document.getElementById('consonantYesBtn');
        const consonantNoBtn = document.getElementById('consonantNoBtn');
        
        if (consonantYesBtn) {
            consonantYesBtn.addEventListener('click', function handleYes() {
                console.log('Consonants YES selected');
                hasAdjacentConsonants = true;
                const filteredWords = currentFilteredWords.filter(word => {
                    for (let i = 0; i < word.length - 1; i++) {
                        if (isConsonant(word[i]) && isConsonant(word[i + 1])) {
                            return true;
                        }
                    }
                    return false;
                });
                currentFilteredWords = filteredWords;
                displayResults(currentFilteredWords);
                showNextFeature();
            });
        }
        
        if (consonantNoBtn) {
            consonantNoBtn.addEventListener('click', function handleNo() {
                console.log('Consonants NO selected');
                hasAdjacentConsonants = false;
                const filteredWords = currentFilteredWords.filter(word => {
                    for (let i = 0; i < word.length - 1; i++) {
                        if (isConsonant(word[i]) && isConsonant(word[i + 1])) {
                            return false;
                        }
                    }
                    return true;
                });
                currentFilteredWords = filteredWords;
                displayResults(currentFilteredWords);
                showNextFeature();
            });
        }
    }
    else if (isWordMode && !document.getElementById('position1Feature').classList.contains('completed')) {
        console.log('Showing WORD feature');
        const position1Feature = document.getElementById('position1Feature');
        position1Feature.style.display = 'block';
        
        // Set up WORD feature button
        const position1Button = document.getElementById('position1Button');
        if (position1Button) {
            position1Button.addEventListener('click', function handleDone() {
                const input = document.getElementById('position1Input');
                const word = input.value.trim().toUpperCase();
                if (word) {
                    console.log('WORD submitted:', word);
                    const consonantPairs = getConsonantPairs(word);
                    const filteredWords = currentFilteredWords.filter(w => {
                        return consonantPairs.some(pair => w.includes(pair));
                    });
                    currentFilteredWords = filteredWords;
                    displayResults(currentFilteredWords);
                    position1Feature.classList.add('completed');
                    showNextFeature();
                }
            });
        }
    }
    else if (isVowelMode && !document.getElementById('vowelFeature').classList.contains('completed')) {
        console.log('Showing VOWEL feature');
        const vowelFeature = document.getElementById('vowelFeature');
        vowelFeature.style.display = 'block';
        
        // Set up VOWEL feature buttons
        const vowelButtons = document.querySelectorAll('.vowel-btn');
        vowelButtons.forEach(button => {
            button.addEventListener('click', function handleVowel() {
                const isYes = button.classList.contains('yes-btn');
                handleVowelSelection(isYes);
            });
        });
        
        // Initialize vowel processing
        if (uniqueVowels.length === 0) {
            console.log('Initializing vowels from current word list');
            const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
            uniqueVowels = Array.from(new Set(
                currentFilteredWords.join('').toLowerCase().split('')
                    .filter(char => vowels.has(char))
            ));
            currentFilteredWordsForVowels = [...currentFilteredWords];
            originalFilteredWords = [...currentFilteredWords];
            currentVowelIndex = 0;
        }
        
        // Set up the vowel display
        const vowelLetter = vowelFeature.querySelector('.vowel-letter');
        if (uniqueVowels.length > 0) {
            const leastCommonVowel = findLeastCommonVowel(originalFilteredWords, uniqueVowels);
            console.log('Setting vowel letter to:', leastCommonVowel.toUpperCase());
            vowelLetter.textContent = leastCommonVowel.toUpperCase();
            vowelLetter.style.display = 'inline-block';
        } else {
            console.log('No vowels found in current word list');
            vowelLetter.style.display = 'none';
        }
    }
    else if (isLexiconMode && !document.getElementById('lexiconFeature').classList.contains('completed')) {
        console.log('Showing LEXICON feature');
        const lexiconFeature = document.getElementById('lexiconFeature');
        lexiconFeature.style.display = 'block';
        
        // Set up LEXICON feature buttons
        const lexiconFilterButton = document.getElementById('lexiconFilterButton');
        const lexiconSkipButton = document.getElementById('lexiconSkipButton');
        
        if (lexiconFilterButton) {
            lexiconFilterButton.addEventListener('click', function handleFilter() {
                const input = document.getElementById('lexiconPositions');
                const positions = input.value.trim();
                if (positions) {
                    console.log('LEXICON positions submitted:', positions);
                    const positionArray = positions.split('').map(p => parseInt(p) - 1);
                    const filteredWords = currentFilteredWords.filter(word => {
                        return positionArray.every(pos => {
                            if (pos >= 0 && pos < word.length) {
                                const letter = word[pos].toLowerCase();
                                return ['b', 'c', 'd', 'g', 'j', 'o', 'p', 'q', 'r', 's', 'u'].includes(letter);
                            }
                            return false;
                        });
                    });
                    currentFilteredWords = filteredWords;
                    displayResults(currentFilteredWords);
                    lexiconFeature.classList.add('completed');
                    showNextFeature();
                }
            });
        }
        
        if (lexiconSkipButton) {
            lexiconSkipButton.addEventListener('click', function handleSkip() {
                console.log('LEXICON SKIP selected');
                lexiconFeature.classList.add('completed');
                showNextFeature();
            });
        }
    }
    else if (isShapeMode && !document.getElementById('shapeFeature').classList.contains('completed')) {
        console.log('Showing SHAPE feature');
        document.getElementById('shapeFeature').style.display = 'block';
        updateShapeDisplay(currentFilteredWords);
    }
    else {
        console.log('Expanding word list');
        expandWordList();
    }
}

// Function to expand word list
function expandWordList() {
    const wordListContainer = document.getElementById('wordListContainer');
    wordListContainer.classList.add('expanded');
}

// Function to display results
function displayResults(words) {
    currentFilteredWords = words;
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';
    
    words.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-item';
        wordElement.textContent = word.toUpperCase();
        resultsContainer.appendChild(wordElement);
    });
    
    updateWordCount(words.length);
}

// Function to reset the app
function resetApp() {
    document.getElementById('wordListContainer').classList.remove('expanded');
    document.getElementById('resultsContainer').innerHTML = '';
    document.getElementById('lexiconPositions').value = '';
    document.getElementById('position1Input').value = '';
    
    const features = document.querySelectorAll('.feature-section');
    features.forEach(feature => {
        feature.style.display = 'none';
        feature.classList.remove('completed');
    });
    
    updateWordCount(totalWords);
    currentFilteredWords = [];
    currentPosition = -1;
    currentPosition2 = -1;
    uniqueVowels = [];
    hasAdjacentConsonants = null;
    
    displayResults(wordList);
    showNextFeature();
}

// Function to toggle mode
function toggleMode() {
    isNewMode = document.getElementById('modeToggle').checked;
    resetApp();
}

// Function to toggle feature mode
function toggleFeature(featureId) {
    // Convert featureId to toggleId
    const toggleId = featureId === 'consonantQuestion' ? 'togetherToggle' : 
                    featureId === 'position1Feature' ? 'wordToggle' :
                    featureId.replace('Feature', 'Toggle');
    
    const toggle = document.getElementById(toggleId);
    if (!toggle) {
        console.warn(`Toggle element not found: ${toggleId}`);
        return;
    }
    
    const isEnabled = toggle.checked;
    console.log(`Toggling ${featureId} (${toggleId}): ${isEnabled ? 'ON' : 'OFF'}`);
    
    // Update the mode flag for the feature
    switch(featureId) {
        case 'oFeature':
            isOMode = isEnabled;
            break;
        case 'curvedFeature':
            isCurvedMode = isEnabled;
            break;
        case 'consonantQuestion':
            isTogetherMode = isEnabled;
            break;
        case 'position1Feature':
            isWordMode = isEnabled;
            break;
        case 'lexiconFeature':
            isLexiconMode = isEnabled;
            break;
        case 'vowelFeature':
            isVowelMode = isEnabled;
            break;
        case 'shapeFeature':
            isShapeMode = isEnabled;
            break;
    }
    
    // Reset the workflow
    resetWorkflow();
}

// Function to reset the workflow
function resetWorkflow() {
    console.log('Resetting workflow...');
    
    // Reset all feature states
    const allFeatures = [
        'oFeature',
        'curvedFeature',
        'position1Feature',
        'vowelFeature',
        'lexiconFeature',
        'consonantQuestion',
        'shapeFeature'
    ];
    
    // Reset all features and mark disabled ones as completed
    allFeatures.forEach(featureId => {
        const feature = document.getElementById(featureId);
        if (!feature) {
            console.warn(`Feature element not found: ${featureId}`);
            return;
        }
        
        feature.classList.remove('completed');
        feature.style.display = 'none';
        
        // Get the corresponding toggle
        const toggleId = featureId === 'consonantQuestion' ? 'togetherToggle' : 
                        featureId === 'position1Feature' ? 'wordToggle' :
                        featureId.replace('Feature', 'Toggle');
        const toggle = document.getElementById(toggleId);
        
        // If the toggle exists and is disabled, mark the feature as completed
        if (toggle && !toggle.checked) {
            feature.classList.add('completed');
            console.log(`${featureId} marked as completed (disabled)`);
        }
    });
    
    // Reset all state variables
    hasAdjacentConsonants = null;
    uniqueVowels = [];
    currentFilteredWordsForVowels = [];
    originalFilteredWords = [];
    currentVowelIndex = 0;
    
    // Reset the word list
    currentFilteredWords = [...wordList];
    displayResults(currentFilteredWords);
    
    // Show the first active feature
    showNextFeature();
}

// Function to initialize the app
function initializeApp() {
    console.log('Initializing app...');
    
    // Set initial mode flags
    isOMode = false;
    isCurvedMode = false;
    isTogetherMode = true;
    isWordMode = true;
    isLexiconMode = true;
    isVowelMode = true;
    isShapeMode = true;
    
    // Initialize current filtered words
    currentFilteredWords = [...wordList];
    
    // Reset all features
    const allFeatures = [
        'oFeature',
        'curvedFeature',
        'position1Feature',
        'vowelFeature',
        'lexiconFeature',
        'consonantQuestion',
        'shapeFeature'
    ];
    
    // Reset all features and mark disabled ones as completed
    allFeatures.forEach(featureId => {
        const feature = document.getElementById(featureId);
        if (!feature) {
            console.warn(`Feature element not found: ${featureId}`);
            return;
        }
        
        feature.classList.remove('completed');
        feature.style.display = 'none';
        
        // Get the corresponding toggle
        const toggleId = featureId === 'consonantQuestion' ? 'togetherToggle' : 
                        featureId === 'position1Feature' ? 'wordToggle' :
                        featureId.replace('Feature', 'Toggle');
        const toggle = document.getElementById(toggleId);
        
        // If the toggle exists and is disabled, mark the feature as completed
        if (toggle && !toggle.checked) {
            feature.classList.add('completed');
            console.log(`${featureId} marked as completed (disabled)`);
        }
    });
    
    // Reset all state variables
    hasAdjacentConsonants = null;
    uniqueVowels = [];
    currentFilteredWordsForVowels = [];
    originalFilteredWords = [];
    currentVowelIndex = 0;
    
    // Display initial results
    displayResults(currentFilteredWords);
    
    // Show the first active feature
    showNextFeature();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');
    
    try {
        await loadWordList();
        
        // Initialize the app
        initializeApp();
        
        // Mode toggle listener
        const modeToggle = document.getElementById('modeToggle');
        if (modeToggle) {
            modeToggle.addEventListener('change', toggleMode);
        }
        
        // Feature toggle listeners
        const toggleMappings = {
            'oToggle': 'oFeature',
            'curvedToggle': 'curvedFeature',
            'togetherToggle': 'consonantQuestion',
            'wordToggle': 'position1Feature',
            'lexiconToggle': 'lexiconFeature',
            'vowelToggle': 'vowelFeature',
            'shapeToggle': 'shapeFeature'
        };
        
        // Initialize toggle states and add event listeners
        Object.entries(toggleMappings).forEach(([toggleId, featureId]) => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                // Set initial state based on featureId
                switch(featureId) {
                    case 'oFeature':
                        toggle.checked = isOMode;
                        break;
                    case 'curvedFeature':
                        toggle.checked = isCurvedMode;
                        break;
                    case 'consonantQuestion':
                        toggle.checked = isTogetherMode;
                        break;
                    case 'position1Feature':
                        toggle.checked = isWordMode;
                        break;
                    case 'lexiconFeature':
                        toggle.checked = isLexiconMode;
                        break;
                    case 'vowelFeature':
                        toggle.checked = isVowelMode;
                        break;
                    case 'shapeFeature':
                        toggle.checked = isShapeMode;
                        break;
                }
                
                toggle.addEventListener('change', () => toggleFeature(featureId));
            } else {
                console.warn(`Toggle element not found: ${toggleId}`);
            }
        });
        
        // O? feature buttons
        const oYesBtn = document.getElementById('oYesBtn');
        if (oYesBtn) {
            oYesBtn.addEventListener('click', () => {
                console.log('O? YES selected');
                hasO = true;
                const filteredWords = currentFilteredWords.filter(word => word.toLowerCase().includes('o'));
                currentFilteredWords = filteredWords;
                displayResults(currentFilteredWords);
                document.getElementById('oFeature').classList.add('completed');
                showNextFeature();
            });
        }
        
        const oNoBtn = document.getElementById('oNoBtn');
        if (oNoBtn) {
            oNoBtn.addEventListener('click', () => {
                console.log('O? NO selected');
                hasO = false;
                const filteredWords = currentFilteredWords.filter(word => !word.toLowerCase().includes('o'));
                currentFilteredWords = filteredWords;
                displayResults(currentFilteredWords);
                document.getElementById('oFeature').classList.add('completed');
                showNextFeature();
            });
        }
        
        const oSkipBtn = document.getElementById('oSkipBtn');
        if (oSkipBtn) {
            oSkipBtn.addEventListener('click', () => {
                console.log('O? SKIP selected');
                document.getElementById('oFeature').classList.add('completed');
                showNextFeature();
            });
        }
        
        // CURVED feature buttons
        const curvedButtons = document.querySelectorAll('.curved-btn');
        curvedButtons.forEach(button => {
            button.addEventListener('click', () => {
                const letter = button.textContent;
                console.log('CURVED letter selected:', letter);
                const filteredWords = currentFilteredWords.filter(word => word.toLowerCase().includes(letter.toLowerCase()));
                currentFilteredWords = filteredWords;
                displayResults(currentFilteredWords);
                document.getElementById('curvedFeature').classList.add('completed');
                showNextFeature();
            });
        });
        
        const curvedSkipBtn = document.getElementById('curvedSkipBtn');
        if (curvedSkipBtn) {
            curvedSkipBtn.addEventListener('click', () => {
                console.log('CURVED SKIP selected');
                document.getElementById('curvedFeature').classList.add('completed');
                showNextFeature();
            });
        }
        
        // Consonant question buttons
        const consonantYesBtn = document.getElementById('consonantYesBtn');
        if (consonantYesBtn) {
            consonantYesBtn.addEventListener('click', () => {
                console.log('Consonants YES selected');
                hasAdjacentConsonants = true;
                const filteredWords = currentFilteredWords.filter(word => {
                    for (let i = 0; i < word.length - 1; i++) {
                        if (isConsonant(word[i]) && isConsonant(word[i + 1])) {
                            return true;
                        }
                    }
                    return false;
                });
                currentFilteredWords = filteredWords;
                displayResults(currentFilteredWords);
                showNextFeature();
            });
        }
        
        const consonantNoBtn = document.getElementById('consonantNoBtn');
        if (consonantNoBtn) {
            consonantNoBtn.addEventListener('click', () => {
                console.log('Consonants NO selected');
                hasAdjacentConsonants = false;
                const filteredWords = currentFilteredWords.filter(word => {
                    for (let i = 0; i < word.length - 1; i++) {
                        if (isConsonant(word[i]) && isConsonant(word[i + 1])) {
                            return false;
                        }
                    }
                    return true;
                });
                currentFilteredWords = filteredWords;
                displayResults(currentFilteredWords);
                showNextFeature();
            });
        }
        
        // WORD feature
        const position1Button = document.getElementById('position1Button');
        if (position1Button) {
            position1Button.addEventListener('click', () => {
                const input = document.getElementById('position1Input');
                const word = input.value.trim().toUpperCase();
                if (word) {
                    console.log('WORD submitted:', word);
                    const consonantPairs = getConsonantPairs(word);
                    const filteredWords = currentFilteredWords.filter(w => {
                        return consonantPairs.some(pair => w.includes(pair));
                    });
                    currentFilteredWords = filteredWords;
                    displayResults(currentFilteredWords);
                    document.getElementById('position1Feature').classList.add('completed');
                    showNextFeature();
                }
            });
        }
        
        // LEXICON feature
        const lexiconFilterButton = document.getElementById('lexiconFilterButton');
        if (lexiconFilterButton) {
            lexiconFilterButton.addEventListener('click', () => {
                const input = document.getElementById('lexiconPositions');
                const positions = input.value.trim();
                if (positions) {
                    console.log('LEXICON positions submitted:', positions);
                    const positionArray = positions.split('').map(p => parseInt(p) - 1);
                    const filteredWords = currentFilteredWords.filter(word => {
                        return positionArray.every(pos => {
                            if (pos >= 0 && pos < word.length) {
                                const letter = word[pos].toLowerCase();
                                return ['b', 'c', 'd', 'g', 'j', 'o', 'p', 'q', 'r', 's', 'u'].includes(letter);
                            }
                            return false;
                        });
                    });
                    currentFilteredWords = filteredWords;
                    displayResults(currentFilteredWords);
                    document.getElementById('lexiconFeature').classList.add('completed');
                    showNextFeature();
                }
            });
        }
        
        const lexiconSkipButton = document.getElementById('lexiconSkipButton');
        if (lexiconSkipButton) {
            lexiconSkipButton.addEventListener('click', () => {
                console.log('LEXICON SKIP selected');
                document.getElementById('lexiconFeature').classList.add('completed');
                showNextFeature();
            });
        }
        
        // VOWEL feature
        const vowelButtons = document.querySelectorAll('.vowel-btn');
        vowelButtons.forEach(button => {
            button.addEventListener('click', () => {
                const isYes = button.classList.contains('yes-btn');
                handleVowelSelection(isYes);
            });
        });
        
        // Reset button
        const resetButton = document.getElementById('resetButton');
        if (resetButton) {
            resetButton.addEventListener('click', resetApp);
        }
        
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

// Function to check if a letter is curved
function isCurvedLetter(letter) {
    if (!letter) return false;
    letter = letter.toUpperCase();
    return letterShapes.curved.has(letter);
}

// Function to filter words by curved letter positions
function filterWordsByCurvedPositions(words, positions) {
    // Convert positions string to array of numbers and validate
    const positionArray = positions.split('')
        .map(Number)
        .filter(pos => pos >= 1 && pos <= 5); // Only allow positions 1-5
    
    if (positionArray.length === 0) {
        console.log('No valid positions provided');
        return words;
    }
    
    return words.filter(word => {
        // Skip words shorter than the highest required position
        const maxPosition = Math.max(...positionArray);
        if (word.length < maxPosition) {
            return false;
        }
        
        // Check each position from 1 to 5
        for (let i = 0; i < 5; i++) {
            const pos = i + 1; // Convert to 1-based position
            const letter = word[i];
            
            // Skip if we've reached the end of the word
            if (!letter) {
                continue;
            }
            
            if (positionArray.includes(pos)) {
                // This position should have a curved letter
                if (!isCurvedLetter(letter)) {
                    return false;
                }
            } else {
                // This position should have a straight letter
                if (isCurvedLetter(letter)) {
                    return false;
                }
            }
        }
        
        return true;
    });
} 

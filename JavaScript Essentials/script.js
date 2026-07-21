/**
 * Character Counter — core interactivity
 * ---------------------------------------
 * Wires the static UI from Lab 1 to live text analysis:
 *   - character / word / line counts (with "exclude spaces" option)
 *   - optional character limit with a visual warning state
 *   - approximate reading time
 *   - letter density breakdown with a "see more / see less" toggle
 *   - light/dark theme toggle
 */

document.addEventListener('DOMContentLoaded', () => {

    // ---------- Element references ----------
    const textInput = document.getElementById('textInput');
    const excludeSpacesBox = document.getElementById('excludeSpaces');
    const enableLimitBox = document.getElementById('enableLimit');
    const limitInput = document.getElementById('limitInput');
    const limitWarning = document.getElementById('limitWarning');
    const editorCard = document.querySelector('.editor-card');

    const statTotal = document.getElementById('statTotal');
    const statWords = document.getElementById('statWords');
    const statLines = document.getElementById('statLines');
    const readingTimeEl = document.getElementById('readingTime');

    const densityList = document.getElementById('densityList');

    const themeToggleBtn = document.querySelector('[data-theme-toggle]');
    const sunIcon = document.querySelector('.icon-sun');
    const moonIcon = document.querySelector('.icon-moon');

    // Average adult silent reading speed, used for the reading time estimate.
    const WORDS_PER_MINUTE = 200;

    // How many density rows show before "See more" is needed.
    const DENSITY_PREVIEW_COUNT = 5;

    let densityExpanded = false;

    // ---------- Helpers ----------

    /**
     * Counts characters, optionally excluding whitespace.
     */
    function countCharacters(text, excludeSpaces) {
        return excludeSpaces ? text.replace(/\s/g, '').length : text.length;
    }

    /**
     * Counts words by splitting on whitespace and dropping empty tokens.
     */
    function countWords(text) {
        const trimmed = text.trim();
        return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
    }

    /**
     * Counts lines. An empty textarea has zero lines; otherwise it's the
     * number of newline-separated segments.
     */
    function countLines(text) {
        return text === '' ? 0 : text.split(/\n/).length;
    }

    /**
     * If a limit is enabled and the text exceeds it, trims the text back
     * down to the limit (respecting the "exclude spaces" setting).
     */
    function enforceLimit() {
        if (!enableLimitBox.checked) return;

        const limit = parseInt(limitInput.value, 10) || 0;
        const excludeSpaces = excludeSpacesBox.checked;
        let text = textInput.value;

        if (!excludeSpaces) {
            text = text.slice(0, limit);
        } else {
            while (countCharacters(text, excludeSpaces) > limit && text.length > 0) {
                text = text.slice(0, -1);
            }
        }

        if (text !== textInput.value) {
            textInput.value = text;
            textInput.setSelectionRange(text.length, text.length);
        }
    }

    /**
     * Builds a sorted letter-frequency table (A-Z only, case-insensitive).
     */
    function getLetterDensity(text) {
        const counts = {};
        let totalLetters = 0;

        for (const char of text.toLowerCase()) {
            if (/[a-z]/.test(char)) {
                counts[char] = (counts[char] || 0) + 1;
                totalLetters++;
            }
        }

        return Object.entries(counts)
            .map(([letter, count]) => ({
                letter,
                count,
                percent: totalLetters ? (count / totalLetters) * 100 : 0
            }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Formats the reading time as "<1 minute" or "N minute(s)".
     */
    function formatReadingTime(wordCount) {
        const minutes = wordCount / WORDS_PER_MINUTE;
        if (minutes < 1) return '<1 minute';
        const rounded = Math.round(minutes);
        return `${rounded} minute${rounded === 1 ? '' : 's'}`;
    }

    /**
     * Pads single-digit numbers with a leading zero, matching the original
     * static markup (e.g. line count "06").
     */
    function padNumber(num) {
        return num < 10 ? `0${num}` : String(num);
    }

    // ---------- Rendering ----------

    function renderDensity(densityData) {
        densityList.innerHTML = '';

        if (densityData.length === 0) {
            densityList.innerHTML = '<p class="empty-state">No characters found. Start typing to see letter density.</p>';
            return;
        }

        densityData.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'density-row';
            if (index >= DENSITY_PREVIEW_COUNT && !densityExpanded) {
                row.hidden = true;
            }

            row.innerHTML = `
        <span class="density-letter">${item.letter}</span>
        <span class="density-track"><span class="density-fill" style="width:${item.percent.toFixed(2)}%"></span></span>
        <span class="density-count">${item.count} (${item.percent.toFixed(2)}%)</span>
      `;
            densityList.appendChild(row);
        });

        // Only show the toggle button when there's more than the preview count.
        if (densityData.length > DENSITY_PREVIEW_COUNT) {
            const seeMoreBtn = document.createElement('button');
            seeMoreBtn.type = 'button';
            seeMoreBtn.className = 'see-more' + (densityExpanded ? ' is-expanded' : '');
            seeMoreBtn.innerHTML = `
        <span>${densityExpanded ? 'See less' : 'See more'}</span>
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
            seeMoreBtn.addEventListener('click', () => {
                densityExpanded = !densityExpanded;
                updateStats();
            });
            densityList.appendChild(seeMoreBtn);
        }
    }

    // ---------- Main update loop ----------

    function updateStats() {
        enforceLimit();
        const text = textInput.value;
        const excludeSpaces = excludeSpacesBox.checked;
        const limitEnabled = enableLimitBox.checked;
        const limit = parseInt(limitInput.value, 10) || 0;

        const totalChars = countCharacters(text, excludeSpaces);
        const wordCount = countWords(text);
        const lineCount = countLines(text);

        statTotal.textContent = padNumber(totalChars);
        statWords.textContent = padNumber(wordCount);
        statLines.textContent = padNumber(lineCount);

        readingTimeEl.textContent = `Approx. reading time: ${formatReadingTime(wordCount)}`;

        // Character limit feedback
        const isOverLimit = limitEnabled && totalChars >= limit;
        editorCard.classList.toggle('is-over-limit', isOverLimit);
        if (isOverLimit) {
            limitWarning.hidden = false;
            limitWarning.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
          <rect x="7.25" y="6.5" width="1.5" height="5" rx="0.75" fill="currentColor"/>
          <rect x="7.25" y="3.75" width="1.5" height="1.5" rx="0.75" fill="currentColor"/>
        </svg>
        <span>Limit reached! Maximum ${limit} characters.</span>
      `;
        } else {
            limitWarning.hidden = true;
            limitWarning.innerHTML = '';
        }

        // Letter density
        renderDensity(getLetterDensity(text));
    }

    // ---------- Event listeners ----------

    textInput.addEventListener('input', updateStats);
    excludeSpacesBox.addEventListener('change', updateStats);

    enableLimitBox.addEventListener('change', () => {
        enableLimitBox.checked ? limitInput.removeAttribute('hidden'):limitInput.setAttribute('hidden', 'true');
        updateStats();
    });

    limitInput.addEventListener('input', updateStats);

    // Theme toggle: swaps the data-theme attribute and the sun/moon icon.
    themeToggleBtn.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
        sunIcon.hidden = isLight;
        moonIcon.hidden = !isLight;
    });

    // ---------- Initial render ----------
    updateStats();
});
/* ============================================================
   NEXUS — FRONTEND CONTROLLER
   ============================================================ */

const API_URL = "http://127.0.0.1:8000";


// ============================================================
// DOM ELEMENTS
// ============================================================

const startupScreen = document.getElementById("startupScreen");

const questionInput = document.getElementById("questionInput");
const askButton = document.getElementById("askButton");

const loadingPanel = document.getElementById("loading");
const loadingBar = document.getElementById("loadingBar");
const loadingText = document.getElementById("loadingText");

const resultSection = document.getElementById("results");
const answerElement = document.getElementById("answerContent");
const sourcesElement = document.getElementById("sourcesList");

const saveAnswerButton =
    document.getElementById("saveResultButton");

const historyList =
    document.getElementById("historyList");

const historyEmpty = document.getElementById("historyEmpty");

const savedList =
    document.getElementById("savedList");

const savedEmpty = document.getElementById("savedEmpty");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");

const navItems =
    document.querySelectorAll(".nav-item");

const pages = {
    home: document.getElementById("homePage"),
    history: document.getElementById("historyPage"),
    saved: document.getElementById("savedPage"),
    settings: document.getElementById("settingsPage")
};


// ============================================================
// STORAGE
// ============================================================

const STORAGE_HISTORY = "nexus_research_history";
const STORAGE_SAVED = "nexus_saved_answers";
const STORAGE_THEME = "nexus_theme";

let loadingTimer = null;
let currentResearch = null;


// ============================================================
// STARTUP
// ============================================================

function runStartup() {

    if (!startupScreen) {
        return;
    }

    // Always start visible. This prevents a stale CSS state from
    // leaving the application underneath an invisible overlay.
    startupScreen.style.display = "flex";
    startupScreen.classList.remove("hidden");

    document.body.classList.add("startup-running");

    const statusElement =
        startupScreen.querySelector(".startup-status");

    const messages = [
        "INITIALIZING RESEARCH ENGINE",
        "LOADING KNOWLEDGE SYSTEM",
        "CONNECTING RETRIEVAL PIPELINE",
        "RESEARCH ENGINE READY"
    ];

    let index = 0;

    if (statusElement) {
        statusElement.textContent = messages[0];
    }

    const statusTimer = setInterval(() => {
        index += 1;

        if (index >= messages.length) {
            clearInterval(statusTimer);
            return;
        }

        statusElement?.animate(
            [
                { opacity: 0, transform: "translateY(5px)" },
                { opacity: 0.8, transform: "translateY(0)" }
            ],
            { duration: 280, easing: "ease-out", fill: "forwards" }
        );

        if (statusElement) {
            statusElement.textContent = messages[index];
        }

    }, 620);

    setTimeout(() => {
        clearInterval(statusTimer);

        startupScreen.classList.add("hidden");
        document.body.classList.remove("startup-running");

        setTimeout(() => {
            startupScreen.style.display = "none";
        }, 900);

    }, 3300);
}



// ============================================================
// STORAGE HELPERS
// ============================================================

function readStorage(key) {

    try {

        const value =
            localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : [];

    } catch (error) {

        console.error(
            "Storage read error:",
            error
        );

        return [];
    }
}


function writeStorage(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch (error) {

        console.error(
            "Storage write error:",
            error
        );
    }
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


// ============================================================
// TOAST
// ============================================================

function showToast(message) {

    if (!toast || !toastMessage) {
        return;
    }

    toastMessage.textContent =
        message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 1800);
}


// ============================================================
// LOADING ANIMATION
// ============================================================

function startLoadingAnimation() {

    if (!loadingPanel) {
        return;
    }

    loadingPanel.classList.remove("hidden");

    resultSection?.classList.add("hidden");

    if (loadingBar) {
        loadingBar.style.width = "0%";
    }

    if (loadingText) {
        loadingText.textContent =
            "Searching research documents...";
    }

    let progress = 0;

    const messages = [

        "Searching research documents...",

        "Running semantic retrieval...",

        "Combining dense and BM25 results...",

        "Reranking relevant evidence...",

        "Preparing grounded answer..."

    ];

    clearInterval(loadingTimer);

    loadingTimer = setInterval(() => {

        progress +=
            Math.random() * 7 + 2;

        if (progress > 92) {
            progress = 92;
        }

        if (loadingBar) {

            loadingBar.style.width =
                `${progress}%`;
        }

        const index =
            Math.min(
                Math.floor(progress / 20),
                messages.length - 1
            );

        if (loadingText) {

            loadingText.textContent =
                messages[index];
        }

    }, 350);
}


function stopLoadingAnimation() {

    clearInterval(loadingTimer);

    loadingTimer = null;

    if (loadingBar) {
        loadingBar.style.width = "100%";
    }

    if (loadingText) {
        loadingText.textContent =
            "Response ready.";
    }

}


// ============================================================
// SOURCES
// ============================================================

function renderSources(sources) {

    if (!sourcesElement) {
        return;
    }

    sourcesElement.innerHTML = "";

    if (
        !Array.isArray(sources) ||
        sources.length === 0
    ) {

        sourcesElement.innerHTML = `

            <div class="source-card">

                <div class="source-title">
                    No source information returned.
                </div>

            </div>

        `;

        return;
    }


    sources.forEach((source, index) => {

        const paper =
            source.paper ||
            source.title ||
            source.document ||
            source.source ||
            "Research Paper";


        const page =
            source.page ??
            source.page_number ??
            source.metadata?.page ??
            "—";


        const score =
            source.score ??
            source.relevance_score ??
            "";


        const card =
            document.createElement("div");

        card.className =
            "source-card";


        card.innerHTML = `

            <div class="source-top">

                <span class="source-number">

                    SOURCE
                    ${String(index + 1).padStart(2, "0")}

                </span>

                <span class="source-page">

                    PAGE
                    ${escapeHTML(String(page))}

                </span>

            </div>


            <div class="source-title">

                ${escapeHTML(String(paper))}

            </div>


            ${
                score !== ""
                    ? `

                    <div class="source-score">

                        RELEVANCE SCORE:
                        ${escapeHTML(String(score))}

                    </div>

                    `
                    : ""
            }

        `;


        sourcesElement.appendChild(card);

    });
}


// ============================================================
// DISPLAY RESULT
// ============================================================

async function displayResult(data) {

    console.log("Displaying result:", data);

    if (!data) {
        return;
    }

    currentResearch = data;

    const resultQuestionText = document.getElementById("resultQuestionText");
    if (resultQuestionText) {
        resultQuestionText.textContent = String(data.question || "");
    }

    const answer =
        data.answer ||
        data.response ||
        data.result ||
        "No answer returned.";

    const sources =
        data.sources ||
        data.documents ||
        [];

    if (resultSection) {
        resultSection.classList.remove("hidden");
    }

    if (loadingPanel) {
        loadingPanel.classList.add("hidden");
    }

    stopLoadingAnimation();

    if (answerElement) {
        answerElement.textContent = "";
        const text = String(answer);

        // Smooth ChatGPT-style reveal without freezing the UI.
        let index = 0;
        const chunkSize = 7;

        await new Promise(resolve => {
            function reveal() {
                index = Math.min(index + chunkSize, text.length);
                answerElement.textContent = text.slice(0, index);

                if (index < text.length) {
                    requestAnimationFrame(reveal);
                } else {
                    resolve();
                }
            }

            reveal();
        });
    }

    renderSources(sources);
    updateSaveButtonState();

    setTimeout(() => {
        resultSection?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, 80);
}


// ============================================================
// ASK NEXUS
// ============================================================

async function askResearchAI() {

    const question =
        questionInput?.value.trim() || "";

    if (selectedFiles.length > 0) {
        showToast("Files selected. File processing will be connected to NEXUS backend next.");
    }


    // --------------------------------------------------------
    // EMPTY QUESTION
    // --------------------------------------------------------

    if (!question) {

        questionInput?.focus();

        if (questionInput) {

            questionInput.style.boxShadow =
                "0 0 0 1px rgba(236,72,153,0.75)";

            setTimeout(() => {

                questionInput.style.boxShadow =
                    "";

            }, 1000);
        }

        return;
    }


    // --------------------------------------------------------
    // DISABLE BUTTON
    // --------------------------------------------------------

    if (askButton) {

        askButton.disabled = true;

        askButton.style.opacity =
            "0.6";

        askButton.style.pointerEvents =
            "none";
    }


    // --------------------------------------------------------
    // START LOADING
    // --------------------------------------------------------

    startLoadingAnimation();


    console.log(
        "Sending question to:",
        `${API_URL}/ask`
    );

    console.log(
        "Question:",
        question
    );


    try {

        // ----------------------------------------------------
        // API REQUEST
        // ----------------------------------------------------

        const response =
            await fetch(
                `${API_URL}/ask`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        question: question
                    })
                }
            );


        console.log(
            "API status:",
            response.status
        );


        // ----------------------------------------------------
        // HTTP ERROR
        // ----------------------------------------------------

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                `Server returned ${response.status}: ${errorText}`
            );
        }


        // ----------------------------------------------------
        // READ JSON
        // ----------------------------------------------------

        const data =
            await response.json();


        console.log(
            "API response:",
            data
        );


        // ----------------------------------------------------
        // VALIDATE ANSWER
        // ----------------------------------------------------

        const answer =
            data.answer ||
            data.response ||
            data.result ||
            data.message ||
            "";


        const sources =
            Array.isArray(data.sources)
                ? data.sources
                : (
                    Array.isArray(data.documents)
                        ? data.documents
                        : []
                );


        // ----------------------------------------------------
        // CREATE RESULT OBJECT
        // ----------------------------------------------------

        currentResearch = {

            question: question,

            answer:
                answer ||
                "No answer returned.",

            sources: sources,

            timestamp:
                new Date().toISOString()

        };


        console.log(
            "Final research object:",
            currentResearch
        );


        // ----------------------------------------------------
        // SAVE HISTORY
        // ----------------------------------------------------

        saveHistoryItem(
            currentResearch
        );


        // ----------------------------------------------------
        // STOP LOADING
        // ----------------------------------------------------

        stopLoadingAnimation();


        // ----------------------------------------------------
        // DISPLAY ANSWER
        // ----------------------------------------------------

        displayResult(
            currentResearch
        );


    } catch (error) {

        console.error(
            "NEXUS request error:",
            error
        );


        clearInterval(
            loadingTimer
        );


        // ----------------------------------------------------
        // SHOW ERROR
        // ----------------------------------------------------

        if (loadingText) {

            loadingText.textContent =
                "Unable to process request.";
        }


        if (loadingBar) {

            loadingBar.style.width =
                "100%";
        }


        if (answerElement) {

            answerElement.innerHTML = `

                <strong
                    style="
                        color:#ec4899;
                        font-size:18px;
                    "
                >
                    Request Error
                </strong>

                <br><br>

                <span>
                    NEXUS could not complete the request.
                    Check that the FastAPI backend is running
                    and that CORS is enabled for this frontend.
                </span>

                <br><br>

                <code>
                    ${escapeHTML(error.message)}
                </code>

            `;
        }


        resultSection?.classList.remove(
            "hidden"
        );

        loadingPanel?.classList.add(
            "hidden"
        );

    }


    // --------------------------------------------------------
    // ENABLE BUTTON
    // --------------------------------------------------------

    if (askButton) {

        askButton.disabled = false;

        askButton.style.opacity =
            "1";

        askButton.style.pointerEvents =
            "auto";
    }

}


// ============================================================
// ASK BUTTON CLICK
// ============================================================

if (askButton) {

    askButton.addEventListener(
        "click",
        askResearchAI
    );

}


// ============================================================
// ENTER KEY
// ============================================================

if (questionInput) {

    questionInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                askResearchAI();

            }

        }
    );

}


// ============================================================
// CHARACTER COUNT
// ============================================================

function updateCharacterCount() {

    if (!questionInput || !characterCount) {
        return;
    }

    characterCount.textContent =
        `${questionInput.value.length}`;

}


questionInput?.addEventListener(
    "input",
    () => {

        updateCharacterCount();

        resizeQuestionBox();

    }
);


// ============================================================
// AUTO EXPANDING QUESTION BOX
// ============================================================

function resizeQuestionBox() {

    if (!questionInput) {
        return;
    }

    questionInput.style.height =
        "auto";

    questionInput.style.height =
        `${questionInput.scrollHeight}px`;
}


// ============================================================
// HISTORY
// ============================================================

function saveHistoryItem(item) {

    const history =
        readStorage(
            STORAGE_HISTORY
        );


    history.unshift({

        id: Date.now(),

        question:
            item.question,

        answer:
            item.answer,

        sources:
            item.sources || [],

        timestamp:
            item.timestamp ||
            new Date().toISOString()

    });


    writeStorage(
        STORAGE_HISTORY,
        history.slice(0, 100)
    );

}


// ============================================================
// RENDER HISTORY
// ============================================================

function renderHistory() {

    if (!historyList) {
        return;
    }


    const history =
        readStorage(
            STORAGE_HISTORY
        );


    historyList.innerHTML = "";

    if (historyEmpty) {
        historyEmpty.classList.toggle("hidden", history.length !== 0);
    }

    if (history.length === 0) {
        return;
    }


    history.forEach(item => {

        const card =
            document.createElement("div");


        card.className =
            "history-card history-item";


        card.innerHTML = `

            <div class="history-question">

                ${escapeHTML(
                    item.question
                )}

            </div>


            <div class="history-date">

                ${formatDate(
                    item.timestamp
                )}

            </div>


            <div class="history-answer">

                ${escapeHTML(
                    item.answer
                )}

            </div>


            <div class="saved-actions">

                <button
                    class="small-button"
                    data-history-id="${item.id}"
                >
                    Open
                </button>

            </div>

        `;


        const openButton =
            card.querySelector(
                "[data-history-id]"
            );


        openButton?.addEventListener(
            "click",
            () => {

                currentResearch =
                    item;

                showPage("home");

                displayResult(
                    item
                );

            }
        );


        historyList.appendChild(
            card
        );

    });

}


// ============================================================
// SAVED ANSWERS
// ============================================================

function saveCurrentAnswer() {

    if (
        !currentResearch ||
        !currentResearch.answer
    ) {

        showToast(
            "No answer to save."
        );

        return;
    }


    const saved =
        readStorage(
            STORAGE_SAVED
        );


    const alreadySaved =
        saved.some(
            item =>
                item.question ===
                    currentResearch.question &&
                item.answer ===
                    currentResearch.answer
        );


    if (alreadySaved) {

        showToast(
            "Already saved."
        );

        updateSaveButtonState();

        return;
    }


    saved.unshift({

        id: Date.now(),

        question:
            currentResearch.question,

        answer:
            currentResearch.answer,

        sources:
            currentResearch.sources || [],

        timestamp:
            new Date().toISOString()

    });


    writeStorage(
        STORAGE_SAVED,
        saved
    );


    updateSaveButtonState();

    renderSaved();


    showToast(
        "Answer saved."
    );

}


// ============================================================
// DELETE SAVED ANSWER
// ============================================================

function deleteSavedAnswer(id) {

    const saved =
        readStorage(
            STORAGE_SAVED
        );


    writeStorage(

        STORAGE_SAVED,

        saved.filter(
            item =>
                item.id !== id
        )

    );


    renderSaved();

    updateSaveButtonState();


    showToast(
        "Saved answer deleted."
    );

}


// ============================================================
// RENDER SAVED
// ============================================================

function renderSaved() {

    if (!savedList) {
        return;
    }


    const saved =
        readStorage(
            STORAGE_SAVED
        );


    savedList.innerHTML = "";

    if (savedEmpty) {
        savedEmpty.classList.toggle("hidden", saved.length !== 0);
    }

    if (saved.length === 0) {
        return;
    }


    saved.forEach(item => {

        const card =
            document.createElement("div");


        card.className =
            "saved-card saved-item";


        card.innerHTML = `

            <div class="saved-question">

                ${escapeHTML(
                    item.question
                )}

            </div>


            <div class="saved-date">

                ${formatDate(
                    item.timestamp
                )}

            </div>


            <div class="saved-answer">

                ${escapeHTML(
                    item.answer
                )}

            </div>


            <div class="saved-actions">

                <button
                    class="small-button"
                    data-open-id="${item.id}"
                >
                    Open
                </button>


                <button
                    class="small-button delete-button"
                    data-delete-id="${item.id}"
                >
                    Delete
                </button>

            </div>

        `;


        card.querySelector(
            "[data-open-id]"
        )?.addEventListener(
            "click",
            () => {

                currentResearch =
                    item;

                showPage("home");

                displayResult(
                    item
                );

            }
        );


        card.querySelector(
            "[data-delete-id]"
        )?.addEventListener(
            "click",
            () => {

                deleteSavedAnswer(
                    item.id
                );

            }
        );


        savedList.appendChild(
            card
        );

    });

}


// ============================================================
// SAVE BUTTON STATE
// ============================================================

function updateSaveButtonState() {

    if (
        !saveAnswerButton ||
        !currentResearch
    ) {

        return;
    }


    const saved =
        readStorage(
            STORAGE_SAVED
        );


    const exists =
        saved.some(
            item =>
                item.question ===
                    currentResearch.question &&
                item.answer ===
                    currentResearch.answer
        );


    saveAnswerButton.classList.toggle(
        "saved",
        exists
    );


    const icon =
        saveAnswerButton.querySelector(
            "span"
        );


    if (icon) {

        icon.textContent =
            exists
                ? "♥"
                : "♡";

    }


    const label =
        Array.from(
            saveAnswerButton.childNodes
        ).find(
            node =>
                node.nodeType ===
                Node.TEXT_NODE
        );


    if (label) {

        label.textContent =
            exists
                ? " Saved"
                : " Save Answer";

    }

}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleString();

}


// ============================================================
// PAGE NAVIGATION
// ============================================================

function showPage(pageName) {

    Object.entries(
        pages
    ).forEach(
        ([name, page]) => {

            if (!page) {
                return;
            }


            page.classList.toggle(
                "active-page",
                name === pageName
            );

        }
    );


    navItems.forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.page ===
                    pageName
            );

        }
    );


    if (
        pageName ===
        "history"
    ) {

        renderHistory();

    }


    if (
        pageName ===
        "saved"
    ) {

        renderSaved();

    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ============================================================
// NAVIGATION CLICK
// ============================================================

navItems.forEach(
    item => {

        item.addEventListener(
            "click",
            () => {

                showPage(
                    item.dataset.page
                );

            }
        );

    }
);



// ============================================================
// FILE ATTACHMENT UI
// ============================================================

const fileInput = document.getElementById("fileInput");
const attachmentButton = document.getElementById("attachmentButton");
const filePreview = document.getElementById("filePreview");

let selectedFiles = [];

function renderFilePreview() {

    if (!filePreview) {
        return;
    }

    filePreview.innerHTML = "";

    if (selectedFiles.length === 0) {
        filePreview.classList.add("hidden");
        return;
    }

    filePreview.classList.remove("hidden");

    selectedFiles.forEach((file, index) => {

        const chip = document.createElement("div");
        chip.className = "file-chip";

        chip.innerHTML = `
            <span>${escapeHTML(file.name)}</span>
            <button
                type="button"
                class="file-remove"
                aria-label="Remove ${escapeHTML(file.name)}"
                data-file-index="${index}"
            >×</button>
        `;

        filePreview.appendChild(chip);
    });

    filePreview.querySelectorAll(".file-remove").forEach(button => {
        button.addEventListener("click", () => {
            const index = Number(button.dataset.fileIndex);
            selectedFiles.splice(index, 1);
            renderFilePreview();
        });
    });
}

attachmentButton?.addEventListener("click", () => {
    fileInput?.click();
});

fileInput?.addEventListener("change", event => {

    const incoming = Array.from(event.target.files || []);

    for (const file of incoming) {
        const duplicate = selectedFiles.some(
            existing =>
                existing.name === file.name &&
                existing.size === file.size &&
                existing.lastModified === file.lastModified
        );

        if (!duplicate) {
            selectedFiles.push(file);
        }
    }

    renderFilePreview();

    // Reset the input so the same file can be selected again later.
    event.target.value = "";
});


// ============================================================
// THEME
// ============================================================

function applyTheme(theme) {

    const isLight =
        theme === "light";


    document.body.classList.toggle(
        "light-theme",
        isLight
    );


    document.querySelectorAll("[data-theme]")
        .forEach(
            button => {

                button.classList.toggle(

                    "active",

                    button.dataset.theme ===
                        theme

                );

            }
        );


    try {

        localStorage.setItem(
            STORAGE_THEME,
            theme
        );

    } catch (error) {

        console.error(
            "Theme storage error:",
            error
        );

    }

}


function loadTheme() {

    let theme = "dark";


    try {

        theme =
            localStorage.getItem(
                STORAGE_THEME
            ) || "dark";

    } catch (error) {

        console.error(
            error
        );

    }


    applyTheme(
        theme
    );

}


document.querySelectorAll("[data-theme]")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    applyTheme(
                        button.dataset.theme
                    );

                }
            );

        }
    );


// ============================================================
// CLEAR HISTORY
// ============================================================

document
    .getElementById(
        "clearHistoryButton"
    )
    ?.addEventListener(
        "click",
        () => {

            if (
                !confirm(
                    "Clear all research history?"
                )
            ) {

                return;

            }


            localStorage.removeItem(
                STORAGE_HISTORY
            );


            renderHistory();


            showToast(
                "Research history cleared."
            );

        }
    );


// ============================================================
// CLEAR SAVED
// ============================================================

document
    .getElementById(
        "clearSavedButton"
    )
    ?.addEventListener(
        "click",
        () => {

            if (
                !confirm(
                    "Delete all saved answers?"
                )
            ) {

                return;

            }


            localStorage.removeItem(
                STORAGE_SAVED
            );


            renderSaved();

            updateSaveButtonState();


            showToast(
                "Saved answers deleted."
            );

        }
    );


// ============================================================
// SAVE ANSWER BUTTON
// ============================================================

saveAnswerButton?.addEventListener(
    "click",
    saveCurrentAnswer
);


// ============================================================
// HERO MOUSE EFFECT
// ============================================================

const hero =
    document.querySelector(
        ".hero"
    );


hero?.addEventListener(
    "mousemove",
    event => {

        const rect =
            hero.getBoundingClientRect();


        const x =
            event.clientX -
            rect.left;


        const y =
            event.clientY -
            rect.top;


        const rotateY =
            ((x / rect.width) - 0.5) *
            4;


        const rotateX =
            ((y / rect.height) - 0.5) *
            -4;


        hero.style.transform = `

            perspective(1000px)

            rotateX(${rotateX}deg)

            rotateY(${rotateY}deg)

            translateY(-2px)

        `;

    }
);


hero?.addEventListener(
    "mouseleave",
    () => {

        hero.style.transform =
            "";

    }
);


// ============================================================
// BACKEND HEALTH CHECK
// ============================================================

async function checkBackend() {

    try {

        const response =
            await fetch(
                `${API_URL}/`,
                {
                    method: "GET"
                }
            );


        if (!response.ok) {

            console.warn(
                "Backend health check failed."
            );

            return false;
        }


        const data =
            await response.json();


        console.log(
            "NEXUS backend online:",
            data
        );


        return true;

    } catch (error) {

        console.warn(
            "Backend health check error:",
            error
        );

        return false;
    }

}


// ============================================================
// SECONDARY UI CONTROLS
// ============================================================

const brandHomeButton = document.getElementById("brandHomeButton");
const newQuestionButton = document.getElementById("newQuestionButton");
const historyHomeButton = document.getElementById("historyHomeButton");
const savedHomeButton = document.getElementById("savedHomeButton");
const documentSupportButton = document.getElementById("documentSupportButton");
const interfaceToggle = document.getElementById("interfaceToggle");
const aboutButton = document.getElementById("aboutButton");
const aboutModal = document.getElementById("aboutModal");
const closeAboutModal = document.getElementById("closeAboutModal");

function resetResearchComposer() {
    if (questionInput) {
        questionInput.value = "";
        resizeQuestionBox();
        updateCharacterCount();
        questionInput.focus();
    }

    if (resultSection) {
        resultSection.classList.add("hidden");
    }

    currentResearch = null;
    updateSaveButtonState();
}

brandHomeButton?.addEventListener("click", () => showPage("home"));

newQuestionButton?.addEventListener("click", () => {
    resetResearchComposer();
    showPage("home");
});

historyHomeButton?.addEventListener("click", () => showPage("home"));
savedHomeButton?.addEventListener("click", () => showPage("home"));

documentSupportButton?.addEventListener("click", () => {
    showPage("home");
    requestAnimationFrame(() => fileInput?.click());
});

function setFocusMode(enabled) {
    document.body.classList.toggle("focus-mode", enabled);

    if (interfaceToggle) {
        interfaceToggle.classList.toggle("active", enabled);
        interfaceToggle.setAttribute("aria-pressed", String(enabled));
        interfaceToggle.textContent = enabled ? "Focus On" : "Focus Mode";
    }

    try {
        localStorage.setItem("nexus_focus_mode", enabled ? "1" : "0");
    } catch (error) {
        console.warn("Focus mode storage error:", error);
    }
}

function loadFocusMode() {
    let enabled = false;
    try {
        enabled = localStorage.getItem("nexus_focus_mode") === "1";
    } catch (error) {
        console.warn("Focus mode load error:", error);
    }
    setFocusMode(enabled);
}

interfaceToggle?.addEventListener("click", event => {
    event.stopPropagation();
    const enabled = !document.body.classList.contains("focus-mode");
    setFocusMode(enabled);
    showToast(enabled ? "Focus mode enabled." : "Focus mode disabled.");
});

function openAboutModal() {
    if (!aboutModal) return;
    aboutModal.classList.remove("hidden");
    aboutModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closeAbout() {
    if (!aboutModal) return;
    aboutModal.classList.add("hidden");
    aboutModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

aboutButton?.addEventListener("click", event => {
    event.stopPropagation();
    openAboutModal();
});

closeAboutModal?.addEventListener("click", closeAbout);

aboutModal?.querySelector("[data-close-about]")?.addEventListener("click", closeAbout);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeAbout();
    }
});

// Prevent clicks on action buttons from bubbling into clickable setting cards.
document.querySelectorAll(".settings-action-card button").forEach(button => {
    button.addEventListener("click", event => event.stopPropagation());
});

// ============================================================
// INITIALIZE
// ============================================================

loadTheme();

loadFocusMode();

renderHistory();

renderSaved();

updateCharacterCount();

runStartup();

checkBackend();

console.log(
    "NEXUS frontend initialized."
);

// ============================================================
// CONTINUOUS BACKGROUND POINTER PARALLAX
// ============================================================

(function initBackgroundMotion() {

    const background =
        document.querySelector(".background-system");

    if (!background) {
        return;
    }

    const reduceMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)")
            ?.matches;

    if (reduceMotion) {
        return;
    }

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;

    function animate() {

        currentX += (targetX - currentX) * 0.035;
        currentY += (targetY - currentY) * 0.035;

        background.style.transform =
            `translate3d(${currentX}px, ${currentY}px, 0)`;

        raf = requestAnimationFrame(animate);
    }

    window.addEventListener("pointermove", event => {

        targetX =
            (event.clientX / window.innerWidth - 0.5) * -10;

        targetY =
            (event.clientY / window.innerHeight - 0.5) * -8;

    }, { passive: true });

    window.addEventListener("blur", () => {
        targetX = 0;
        targetY = 0;
    });

    animate();

    window.addEventListener("pagehide", () => {
        cancelAnimationFrame(raf);
    });

})();


// ============================================================
// HERO SMOOTH 3D CONTROLLER
// ============================================================

(function initHeroMotion() {

    const heroElement =
        document.querySelector(".hero");

    if (!heroElement) {
        return;
    }

    const reduceMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)")
            ?.matches;

    if (reduceMotion) {
        return;
    }

    let targetRX = 0;
    let targetRY = 0;
    let currentRX = 0;
    let currentRY = 0;
    let frame = 0;

    function tick() {

        currentRX += (targetRX - currentRX) * 0.08;
        currentRY += (targetRY - currentRY) * 0.08;

        heroElement.style.transform =
            `perspective(1200px) rotateX(${currentRX}deg) rotateY(${currentRY}deg) translateZ(0)`;

        frame = requestAnimationFrame(tick);
    }

    heroElement.addEventListener("pointermove", event => {

        const rect =
            heroElement.getBoundingClientRect();

        const nx =
            (event.clientX - rect.left) / rect.width - 0.5;

        const ny =
            (event.clientY - rect.top) / rect.height - 0.5;

        targetRY = nx * 3.2;
        targetRX = ny * -2.6;

    }, { passive: true });

    heroElement.addEventListener("pointerleave", () => {
        targetRX = 0;
        targetRY = 0;
    });

    tick();

    window.addEventListener("pagehide", () => {
        cancelAnimationFrame(frame);
    });

})();

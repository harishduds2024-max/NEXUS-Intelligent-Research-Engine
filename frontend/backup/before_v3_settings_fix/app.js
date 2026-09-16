/* ============================================================
   NEXUS — FRONTEND CONTROLLER
   ============================================================ */

const API_URL = "http://127.0.0.1:8000";
const RESEARCH_ENDPOINT = "/ask-crag";


// ============================================================
// DOM ELEMENTS
// ============================================================

const startupScreen = document.getElementById("startupScreen");
const startupProgress = document.getElementById("startupProgress");

const questionInput = document.getElementById("question");
const askButton = document.getElementById("askButton");
const characterCount = document.getElementById("characterCount");

const loadingPanel = document.getElementById("loading");
const loadingBar = document.getElementById("loadingBar");
const loadingText = document.getElementById("loadingText");

const resultSection = document.getElementById("results");
const answerElement = document.getElementById("answer");
const sourcesElement = document.getElementById("sources");

const saveAnswerButton =
    document.getElementById("saveAnswerButton");

const historyList =
    document.getElementById("historyList");

const savedList =
    document.getElementById("savedList");

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

    startupScreen.classList.remove("hidden");

    setTimeout(() => {
        startupScreen.classList.add("hidden");
    }, 2650);
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

        "Retrieving research evidence...",

        "Running semantic retrieval...",

        "Combining dense and BM25 results...",

        "Reranking relevant evidence...",

        "Evaluating evidence and preparing answer..."

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

        const sourceType =
            String(source.type || "").toLowerCase();

        const paper =
            source.paper ||
            source.title ||
            source.document ||
            source.source ||
            "Research Source";

        const page =
            source.page ??
            source.page_number ??
            source.metadata?.page ??
            (sourceType === "web" ? "WEB" : "—");

        const score =
            source.score ??
            source.relevance_score ??
            "";

        const url =
            source.url ||
            source.link ||
            source.href ||
            "";


        const card =
            document.createElement("div");

        card.className =
            "source-card";


        card.innerHTML = `

            <div class="source-top">

                <span class="source-number">

                    ${sourceType === "web" ? "WEB SOURCE" : "SOURCE"}
                    ${String(index + 1).padStart(2, "0")}

                </span>

                <span class="source-page">

                    ${sourceType === "web" ? "WEB" : "PAGE"}
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

            ${
                url
                    ? `
                    <a
                        class="source-link"
                        href="${escapeHTML(String(url))}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open web source
                    </a>
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

function renderCragStatus(crag) {
    document.getElementById("cragStatus")?.remove();

    if (!resultSection || !crag || crag.enabled !== true) {
        return;
    }

    const decision = String(crag.evidence_decision || "").toUpperCase();
    const route = String(crag.route || "PAPER_RAG");
    const quality = Number(crag.evidence_quality);

    const qualityText = Number.isFinite(quality)
        ? `${Math.round(quality * 100)}%`
        : "—";

    const routeLabel = route === "CRAG_WEB_CORRECTION"
        ? "WEB CORRECTION"
        : "PAPER RAG";

    const searchLabel = crag.web_search_used === true
        ? "WEB SEARCH USED"
        : "PAPER EVIDENCE SUFFICIENT";

    const status = document.createElement("div");
    status.id = "cragStatus";
    status.className =
        `crag-status ${decision === "WEAK" ? "crag-weak" : "crag-good"}`;

    status.innerHTML = `
        <div class="crag-status-main">
            <div>
                <div class="crag-status-label">CRAG ROUTING</div>
                <div class="crag-status-title">${escapeHTML(routeLabel)}</div>
            </div>
            <div class="crag-badge">${escapeHTML(decision || "READY")}</div>
        </div>
        <div class="crag-status-meta">
            <span>EVIDENCE QUALITY <strong>${escapeHTML(qualityText)}</strong></span>
            <span>${escapeHTML(searchLabel)}</span>
        </div>
    `;

    resultSection.querySelector(".result-card")?.appendChild(status);
}

async function displayResult(data) {

    console.log("Displaying result:", data);

    if (!data) {
        return;
    }

    currentResearch = data;

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
    renderCragStatus(data.crag);
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
        `${API_URL}${RESEARCH_ENDPOINT}`
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
                `${API_URL}${RESEARCH_ENDPOINT}`,
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

            crag: data.crag || null,

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

        crag:
            item.crag || null,

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


    if (history.length === 0) {

        historyList.innerHTML = `

            <div class="empty-state">

                No research history yet.

            </div>

        `;

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


    if (saved.length === 0) {

        savedList.innerHTML = `

            <div class="empty-state">

                No saved answers yet.

            </div>

        `;

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
// ABOUT NEXUS MODAL
// ============================================================

const aboutButton = document.getElementById("aboutButton");
const aboutModal = document.getElementById("aboutModal");
const closeAboutModal = document.getElementById("closeAboutModal");
const aboutBackdrop = aboutModal?.querySelector("[data-close-about]");

function openAboutModal() {
    if (!aboutModal) {
        return;
    }

    aboutModal.classList.remove("hidden");
    aboutModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closeAboutModalWindow() {
    if (!aboutModal) {
        return;
    }

    aboutModal.classList.add("hidden");
    aboutModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

aboutButton?.addEventListener("click", openAboutModal);
closeAboutModal?.addEventListener("click", closeAboutModalWindow);
aboutBackdrop?.addEventListener("click", closeAboutModalWindow);

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && aboutModal && !aboutModal.classList.contains("hidden")) {
        closeAboutModalWindow();
    }
});


// ============================================================
// INITIALIZE
// ============================================================

loadTheme();

renderHistory();

renderSaved();

updateCharacterCount();

runStartup();

checkBackend();

console.log(
    "NEXUS frontend initialized."
);
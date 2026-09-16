/* ============================================================
   NEXUS
   FRONTEND CONTROLLER
   ============================================================ */


/* ============================================================
   CONFIG
   ============================================================ */

const API_URL = "http://127.0.0.1:8000";


/* ============================================================
   ELEMENTS
   ============================================================ */

const startupScreen =
    document.getElementById("startupScreen");

const startupProgress =
    document.getElementById("startupProgress");

const questionInput =
    document.getElementById("question");

const askButton =
    document.getElementById("askButton");

const characterCount =
    document.getElementById("characterCount");

const loadingPanel =
    document.getElementById("loading");

const loadingBar =
    document.getElementById("loadingBar");

const loadingText =
    document.getElementById("loadingText");

const resultSection =
    document.getElementById("result");

const answerElement =
    document.getElementById("answer");

const sourcesElement =
    document.getElementById("sources");

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


/* ============================================================
   STATE
   ============================================================ */

let currentQuestion = "";

let currentAnswer = "";

let currentSources = [];

let currentSavedId = null;

let loadingTimer = null;


/* ============================================================
   STARTUP MOTION
   ============================================================ */

window.addEventListener("load", () => {

    let progress = 0;

    const timer = setInterval(() => {

        progress += Math.random() * 7 + 3;

        if (progress >= 100) {

            progress = 100;

            clearInterval(timer);

            setTimeout(() => {

                startupScreen.classList.add("hidden");

            }, 450);

        }

        startupProgress.style.width =
            `${progress}%`;

    }, 70);

});


/* ============================================================
   THEME
   ============================================================ */

function loadTheme() {

    const savedTheme =
        localStorage.getItem("nexusTheme") || "dark";

    applyTheme(savedTheme);

}


function applyTheme(theme) {

    if (theme === "light") {

        document.body.classList.add(
            "light-theme"
        );

    } else {

        document.body.classList.remove(
            "light-theme"
        );

    }

    localStorage.setItem(
        "nexusTheme",
        theme
    );


    document
        .querySelectorAll(".theme-option")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.themeChoice === theme
            );

        });

}


document
    .querySelectorAll(".theme-option")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const theme =
                    button.dataset.themeChoice;

                applyTheme(theme);

                showToast(
                    `${theme === "dark" ? "Dark" : "Light"} theme enabled`
                );

            }
        );

    });


loadTheme();


/* ============================================================
   NAVIGATION
   ============================================================ */

const pages = {

    home:
        document.getElementById("homePage"),

    history:
        document.getElementById("historyPage"),

    saved:
        document.getElementById("savedPage"),

    settings:
        document.getElementById("settingsPage")

};


document
    .querySelectorAll(".nav-item")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const page =
                    button.dataset.page;

                switchPage(page);

            }
        );

    });


function switchPage(page) {

    Object.values(pages)
        .forEach(element => {

            element.classList.remove(
                "active-page"
            );

        });


    if (pages[page]) {

        pages[page].classList.add(
            "active-page"
        );

    }


    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === page
            );

        });


    if (page === "history") {

        renderHistory();

    }


    if (page === "saved") {

        renderSaved();

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* ============================================================
   CHARACTER COUNT
   ============================================================ */

questionInput.addEventListener(
    "input",
    () => {

        characterCount.textContent =
            `${questionInput.value.length} / 1000`;

    }
);


/* ============================================================
   LOADING
   ============================================================ */

function startLoadingAnimation() {

    loadingPanel.classList.remove(
        "hidden"
    );

    resultSection.classList.add(
        "hidden"
    );

    loadingBar.style.width = "0%";


    let progress = 0;


    const messages = [

        "Searching research documents...",

        "Running semantic retrieval...",

        "Comparing relevant passages...",

        "Reranking evidence...",

        "Preparing grounded answer..."

    ];


    loadingTimer = setInterval(() => {

        progress += Math.random() * 8;


        if (progress > 92) {

            progress = 92;

        }


        loadingBar.style.width =
            `${progress}%`;


        const index =
            Math.min(
                Math.floor(progress / 20),
                messages.length - 1
            );


        loadingText.textContent =
            messages[index];

    }, 350);

}


function stopLoadingAnimation() {

    clearInterval(
        loadingTimer
    );

    loadingBar.style.width =
        "100%";

    loadingText.textContent =
        "Response ready.";

}


/* ============================================================
   ESCAPE
   ============================================================ */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


/* ============================================================
   ASK RESEARCH AI
   ============================================================ */

async function askResearchAI() {

    const question =
        questionInput.value.trim();


    if (!question) {

        questionInput.focus();

        showToast(
            "Please enter a research question."
        );

        return;

    }


    currentQuestion =
        question;


    askButton.disabled =
        true;

    askButton.style.opacity =
        "0.55";


    startLoadingAnimation();


    try {

        const response =
            await fetch(
                `${API_URL}/ask`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            question:
                                question
                        })
                }
            );


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const data =
            await response.json();


        stopLoadingAnimation();


        setTimeout(() => {

            loadingPanel.classList.add(
                "hidden"
            );

            displayResult(data);

        }, 400);


    } catch (error) {

        clearInterval(
            loadingTimer
        );


        loadingPanel.classList.add(
            "hidden"
        );


        answerElement.innerHTML = `

            <strong style="color:var(--pink)">
                Connection Error
            </strong>

            <br><br>

            Make sure the FastAPI backend
            is running on:

            <br><br>

            <code>
                http://127.0.0.1:8000
            </code>

            <br><br>

            <small>
                ${escapeHTML(error.message)}
            </small>

        `;


        resultSection.classList.remove(
            "hidden"
        );


        console.error(error);

    }


    askButton.disabled =
        false;

    askButton.style.opacity =
        "1";

}


/* ============================================================
   DISPLAY RESULT
   ============================================================ */

function displayResult(data) {

    const answer =
        data.answer ||
        data.response ||
        data.result ||
        data.message ||
        "No answer returned.";


    const sources =
        data.sources ||
        data.documents ||
        data.context ||
        [];


    currentAnswer =
        answer;

    currentSources =
        sources;


    currentSavedId =
        null;


    answerElement.textContent =
        answer;


    renderSources(
        sources
    );


    saveAnswerButton.classList.remove(
        "saved"
    );


    saveAnswerButton.innerHTML = `
        <span>♡</span>
        Save Answer
    `;


    resultSection.classList.remove(
        "hidden"
    );


    saveHistory(
        currentQuestion,
        currentAnswer,
        currentSources
    );


    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* ============================================================
   SOURCES
   ============================================================ */

function renderSources(sources) {

    sourcesElement.innerHTML = "";


    if (
        !sources ||
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


    sources.forEach(
        (source, index) => {

            const title =
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
                document.createElement(
                    "div"
                );


            card.className =
                "source-card";


            card.innerHTML = `

                <div class="source-top">

                    <span>
                        SOURCE
                        ${String(index + 1)
                            .padStart(2, "0")}
                    </span>

                    <span>
                        PAGE
                        ${escapeHTML(
                            String(page)
                        )}
                    </span>

                </div>


                <div class="source-title">

                    ${escapeHTML(
                        String(title)
                    )}

                </div>


                ${
                    score !== ""
                    ?
                    `
                    <div class="source-score">

                        RELEVANCE SCORE:
                        ${escapeHTML(
                            String(score)
                        )}

                    </div>
                    `
                    :
                    ""
                }

            `;


            sourcesElement.appendChild(
                card
            );

        }
    );

}


/* ============================================================
   SAVE ANSWER
   ============================================================ */

saveAnswerButton.addEventListener(
    "click",
    saveCurrentAnswer
);


function saveCurrentAnswer() {

    if (
        !currentQuestion ||
        !currentAnswer
    ) {

        showToast(
            "No answer available to save."
        );

        return;

    }


    const saved =
        getSavedAnswers();


    const existing =
        saved.find(
            item =>
                item.question ===
                currentQuestion &&
                item.answer ===
                currentAnswer
        );


    if (existing) {

        showToast(
            "This answer is already saved."
        );

        saveAnswerButton.classList.add(
            "saved"
        );

        saveAnswerButton.innerHTML = `
            <span>♥</span>
            Saved
        `;

        return;

    }


    const item = {

        id:
            Date.now(),

        question:
            currentQuestion,

        answer:
            currentAnswer,

        sources:
            currentSources,

        date:
            new Date().toLocaleString()

    };


    saved.unshift(
        item
    );


    localStorage.setItem(
        "nexusSavedAnswers",
        JSON.stringify(saved)
    );


    currentSavedId =
        item.id;


    saveAnswerButton.classList.add(
        "saved"
    );


    saveAnswerButton.innerHTML = `
        <span>♥</span>
        Saved
    `;


    showToast(
        "Answer saved to Saved."
    );

}


/* ============================================================
   HISTORY
   ============================================================ */

function getHistory() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "nexusHistory"
            )
        ) || [];

    } catch {

        return [];

    }

}


function saveHistory(
    question,
    answer,
    sources
) {

    const history =
        getHistory();


    history.unshift({

        id:
            Date.now(),

        question,

        answer,

        sources,

        date:
            new Date().toLocaleString()

    });


    /*
     * Keep latest 50 searches.
     */

    const limited =
        history.slice(0, 50);


    localStorage.setItem(
        "nexusHistory",
        JSON.stringify(limited)
    );

}


function renderHistory() {

    const history =
        getHistory();


    historyList.innerHTML =
        "";


    if (
        history.length === 0
    ) {

        historyList.innerHTML = `

            <div class="empty-state">

                No research history yet.

                <br><br>

                Your future questions and
                answers will appear here.

            </div>

        `;

        return;

    }


    history.forEach(
        item => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "history-card";


            card.innerHTML = `

                <div class="history-question">

                    ${escapeHTML(
                        item.question
                    )}

                </div>


                <div class="history-date">

                    ${escapeHTML(
                        item.date
                    )}

                </div>


                <div class="history-answer">

                    ${escapeHTML(
                        item.answer
                    )}

                </div>

            `;


            historyList.appendChild(
                card
            );

        }
    );

}


/* ============================================================
   SAVED ANSWERS
   ============================================================ */

function getSavedAnswers() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "nexusSavedAnswers"
            )
        ) || [];

    } catch {

        return [];

    }

}


function renderSaved() {

    const saved =
        getSavedAnswers();


    savedList.innerHTML =
        "";


    if (
        saved.length === 0
    ) {

        savedList.innerHTML = `

            <div class="empty-state">

                No saved answers yet.

                <br><br>

                Use <strong>Save Answer</strong>
                after receiving a response.

            </div>

        `;

        return;

    }


    saved.forEach(
        item => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "saved-card";


            card.innerHTML = `

                <div class="saved-question">

                    ${escapeHTML(
                        item.question
                    )}

                </div>


                <div class="saved-date">

                    Saved:
                    ${escapeHTML(
                        item.date
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
                        data-view-id="${item.id}">

                        View

                    </button>


                    <button
                        class="small-button delete-button"
                        data-delete-id="${item.id}">

                        Delete

                    </button>

                </div>

            `;


            savedList.appendChild(
                card
            );

        }
    );


    /*
     * VIEW BUTTONS
     */

    document
        .querySelectorAll(
            "[data-view-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                button.dataset.viewId
                            );

                        viewSavedAnswer(id);

                    }
                );

            }
        );


    /*
     * DELETE BUTTONS
     */

    document
        .querySelectorAll(
            "[data-delete-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                button.dataset.deleteId
                            );

                        deleteSavedAnswer(id);

                    }
                );

            }
        );

}


function viewSavedAnswer(id) {

    const saved =
        getSavedAnswers();


    const item =
        saved.find(
            entry =>
                entry.id === id
        );


    if (!item) {

        return;

    }


    currentQuestion =
        item.question;

    currentAnswer =
        item.answer;

    currentSources =
        item.sources || [];


    switchPage(
        "home"
    );


    answerElement.textContent =
        item.answer;


    renderSources(
        item.sources || []
    );


    resultSection.classList.remove(
        "hidden"
    );


    saveAnswerButton.classList.add(
        "saved"
    );


    saveAnswerButton.innerHTML = `
        <span>♥</span>
        Saved
    `;


    setTimeout(() => {

        resultSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, 100);

}


function deleteSavedAnswer(id) {

    const saved =
        getSavedAnswers();


    const filtered =
        saved.filter(
            item =>
                item.id !== id
        );


    localStorage.setItem(
        "nexusSavedAnswers",
        JSON.stringify(
            filtered
        )
    );


    renderSaved();


    showToast(
        "Saved answer deleted."
    );

}


/* ============================================================
   SETTINGS — CLEAR DATA
   ============================================================ */

document
    .getElementById(
        "clearHistoryButton"
    )
    .addEventListener(
        "click",
        () => {

            const confirmed =
                confirm(
                    "Clear all research history?"
                );


            if (!confirmed) {

                return;

            }


            localStorage.removeItem(
                "nexusHistory"
            );


            renderHistory();


            showToast(
                "Research history cleared."
            );

        }
    );


document
    .getElementById(
        "clearSavedButton"
    )
    .addEventListener(
        "click",
        () => {

            const confirmed =
                confirm(
                    "Delete all saved answers?"
                );


            if (!confirmed) {

                return;

            }


            localStorage.removeItem(
                "nexusSavedAnswers"
            );


            renderSaved();


            showToast(
                "Saved answers deleted."
            );

        }
    );


/* ============================================================
   TOAST
   ============================================================ */

let toastTimer = null;


function showToast(message) {

    toastMessage.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );

}


/* ============================================================
   CTRL + ENTER
   ============================================================ */

questionInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            (event.ctrlKey ||
             event.metaKey)
        ) {

            event.preventDefault();

            askResearchAI();

        }

    }
);


/* ============================================================
   3D HERO MOUSE EFFECT
   ============================================================ */

const hero =
    document.querySelector(
        ".hero"
    );


if (hero) {

    hero.addEventListener(
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
                ((x / rect.width) - 0.5) * 3;


            const rotateX =
                ((y / rect.height) - 0.5) * -3;


            hero.style.transform = `

                perspective(1100px)

                rotateX(${rotateX}deg)

                rotateY(${rotateY}deg)

                translateY(-2px)

            `;

        }
    );


    hero.addEventListener(
        "mouseleave",
        () => {

            hero.style.transform =
                "";

        }
    );

}
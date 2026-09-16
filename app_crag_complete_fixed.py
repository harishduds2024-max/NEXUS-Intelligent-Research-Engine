from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document

from sentence_transformers import CrossEncoder

import requests
import re
from html import unescape
from urllib.parse import quote_plus


# ============================================================
# CONFIGURATION
# ============================================================

CHROMA_PATH = r"C:\Users\ASUS\Downloads\Research Paper Answer Bot\chroma_db"

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "gemma3"

EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Research Paper Answer Bot API",
    description="RAG API for answering questions from research papers",
    version="1.0.0"
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class QueryRequest(BaseModel):
    question: str


# ============================================================
# LOAD EMBEDDING MODEL
# ============================================================

print("=" * 70)
print("Loading embedding model...")
print("=" * 70)

embedding_model = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL
)

print("✅ Embedding model loaded!")


# ============================================================
# LOAD PERSISTENT CHROMADB
# ============================================================

print("\n" + "=" * 70)
print("Loading ChromaDB...")
print("=" * 70)

vector_store = Chroma(
    collection_name="research_papers_bge",
    embedding_function=embedding_model,
    persist_directory=CHROMA_PATH
)

document_count = vector_store._collection.count()

print(
    f"✅ ChromaDB loaded! {document_count} documents"
)


# ============================================================
# LOAD RERANKER
# ============================================================

print("\n" + "=" * 70)
print("Loading reranker...")
print("=" * 70)

reranker = CrossEncoder(
    RERANKER_MODEL
)

print("✅ Reranker loaded!")


# ============================================================
# LOAD DOCUMENTS FROM CHROMADB
# ============================================================

print("\n" + "=" * 70)
print("Loading documents for BM25...")
print("=" * 70)

data = vector_store.get(
    include=[
        "documents",
        "metadatas"
    ]
)

documents = []

for text, metadata in zip(
    data["documents"],
    data["metadatas"]
):

    documents.append(
        Document(
            page_content=text,
            metadata=metadata or {}
        )
    )

print(
    f"📄 Documents loaded: {len(documents)}"
)


# ============================================================
# CREATE BM25 RETRIEVER
# ============================================================

bm25_retriever = BM25Retriever.from_documents(
    documents
)

bm25_retriever.k = 20

print("✅ BM25 retriever created!")


# ============================================================
# PRODUCTION RETRIEVER
# ============================================================

def production_retrieve(
    query,
    top_k=3,
    candidate_k=20
):

    query_lower = query.lower().strip()

    # --------------------------------------------------------
    # QUERY EXPANSION
    # --------------------------------------------------------

    expanded_query = query
    target_paper = None
    # Always initialize this before the Transformer-specific logic.
    # Otherwise non-Transformer CRAG questions can fail during reranking.
    focused_terms = []


    # ========================================================
    # TRANSFORMER
    # ========================================================

    if "transformer" in query_lower:

        target_paper = (
            "attention_is_all_you_need"
        )

        # Preserve the user's specific intent instead of replacing
        # every Transformer question with one generic architecture query.

        if any(term in query_lower for term in [
            "positional encoding", "position encoding",
            "sequence order", "position information"
        ]):
            focused_terms = [
                "positional encoding", "sequence order", "token position",
                "position information", "sine cosine positional encoding",
                "because the model contains no recurrence or convolution"
            ]
        elif any(term in query_lower for term in [
            "scaled dot-product", "scaled dot product", "dot product attention"
        ]):
            focused_terms = [
                "scaled dot-product attention", "query key value",
                "Q K transpose", "sqrt dk", "softmax", "attention formula"
            ]
        elif any(term in query_lower for term in [
            "multi-head", "multi head", "multiple heads"
        ]):
            focused_terms = [
                "multi-head attention", "different representation subspaces",
                "parallel attention heads", "concatenate heads"
            ]
        elif any(term in query_lower for term in [
            "query", "key", "value", "qkv"
        ]):
            focused_terms = [
                "queries keys values", "attention weights",
                "compatibility function", "scaled dot-product attention"
            ]
        elif any(term in query_lower for term in [
            "trained", "training", "train the transformer",
            "sequence-to-sequence", "sequence to sequence"
        ]):
            focused_terms = [
                "training procedure", "sequence-to-sequence training",
                "training data", "batches", "optimizer Adam",
                "learning rate schedule", "warmup steps",
                "label smoothing", "dropout", "loss"
            ]
        elif any(term in query_lower for term in [
            "long sequence", "long sequences", "very long",
            "computational limitation", "computational limitations",
            "complexity"
        ]):
            focused_terms = [
                "self-attention computational complexity",
                "quadratic complexity O(n squared d)",
                "sequence length n", "computational cost",
                "attention complexity", "n squared", "n < d",
                "long sequences", "restricted self-attention",
                "neighborhood of size r"
            ]
        elif any(term in query_lower for term in [
            "encoder-decoder attention", "encoder decoder attention",
            "information from the encoder"
        ]):
            focused_terms = [
                "encoder-decoder attention", "queries from decoder",
                "keys and values from encoder output", "input sequence"
            ]
        elif any(term in query_lower for term in [
            "advantage", "advantages", "recurrence", "recurrent",
            "convolution", "convolutional", "parallelization", "parallelisation"
        ]):
            focused_terms = [
                "attention instead of recurrence and convolution",
                "parallelization", "path length",
                "long-range dependencies", "training time"
            ]
        elif any(term in query_lower for term in [
            "contribution", "contributions", "significant", "significance",
            "state of the art", "bleu"
        ]):
            focused_terms = [
                "Attention Is All You Need contributions",
                "Transformer architecture", "state of the art",
                "BLEU", "parallelization", "translation quality"
            ]

        if focused_terms:
            expanded_query = query + "\n\nFocus retrieval on: " + ", ".join(focused_terms)
        else:
            expanded_query = """
            What is the Transformer architecture?

            Explain the Transformer architecture including:
            encoder and decoder stacks,
            self-attention,
            multi-head attention,
            position-wise feed-forward networks,
            residual connections,
            and layer normalization.
            """


    # ========================================================
    # RAG
    # ========================================================

    elif (
        "retrieval augmented generation" in query_lower
        or "retrieval-augmented generation" in query_lower
        or query_lower == "what is rag"
    ):

        expanded_query = """
        What is Retrieval-Augmented Generation (RAG)?

        Explain how RAG combines pre-trained parametric
        memory and non-parametric memory for language
        generation, including retrieval of documents.
        """

        target_paper = (
            "retrieval_augmented_generation"
        )


    # ========================================================
    # GPT-3
    # ========================================================

    elif (
        "gpt-3" in query_lower
        or "gpt3" in query_lower
    ):

        expanded_query = """
        How does GPT-3 perform few-shot learning?

        Explain in-context learning, demonstrations,
        zero-shot, one-shot and few-shot settings,
        without gradient updates or fine-tuning.
        """

        target_paper = (
            "gpt3_language_models_are_few_shot_learners"
        )


    # ========================================================
    # BERT
    # ========================================================

    elif "bert" in query_lower:

        expanded_query = """
        What is the main contribution of BERT?

        Explain BERT's bidirectional pre-training,
        masked language modeling, and its contribution
        to NLP tasks.
        """

        target_paper = (
            "bert_pretraining"
        )


    # ========================================================
    # RETRO
    # ========================================================

    elif "retro" in query_lower:

        expanded_query = """
        How does RETRO use retrieval?

        Explain how RETRO retrieves small chunks of tokens,
        finds nearest neighbours from the retrieval database,
        and uses retrieved chunks through cross-attention
        while generating the sequence.

        Explain repeated retrieval and retrieval during
        pre-training.
        """

        target_paper = (
            "retro_retrieval_augmented_language_model"
        )


    # ========================================================
    # DENSE RETRIEVAL
    # ========================================================

    dense_docs = vector_store.similarity_search(
        expanded_query,
        k=candidate_k
    )


    # ========================================================
    # BM25 RETRIEVAL
    # ========================================================

    bm25_docs = bm25_retriever.invoke(
        expanded_query
    )[:candidate_k]


    # ========================================================
    # COMBINE RESULTS
    # ========================================================

    combined = []
    seen = set()

    for doc in dense_docs + bm25_docs:

        paper = doc.metadata.get(
            "paper_title",
            ""
        )


        # ----------------------------------------------------
        # PAPER-AWARE FILTERING
        # ----------------------------------------------------

        if target_paper is not None:

            if paper != target_paper:
                continue


        # ----------------------------------------------------
        # DEDUPLICATION
        # ----------------------------------------------------

        page = doc.metadata.get(
            "page_label",
            doc.metadata.get(
                "page",
                ""
            )
        )

        key = (
            paper,
            str(page),
            doc.page_content[:150]
        )


        if key not in seen:

            seen.add(key)

            combined.append(doc)


    # ========================================================
    # RERANK
    # ========================================================

    if not combined:
        return []


    # Use the intent-focused query for reranking when available.
    # This prevents the reranker from discarding the specific concept
    # that query expansion intentionally added.
    rerank_query = expanded_query if focused_terms else query

    pairs = [
        [
            rerank_query,
            doc.page_content
        ]
        for doc in combined
    ]


    scores = reranker.predict(
        pairs
    )


    ranked_results = sorted(
        zip(
            combined,
            scores
        ),
        key=lambda x: float(x[1]),
        reverse=True
    )


    # ========================================================
    # FINAL TOP K
    # ========================================================

    return ranked_results[:top_k]


# ============================================================
# FINAL RAG FUNCTION
# ============================================================

def ask_rag_final(
    query,
    top_k=3,
    candidate_k=20
):

    # --------------------------------------------------------
    # RETRIEVE
    # --------------------------------------------------------

    results = production_retrieve(
        query,
        top_k=top_k,
        candidate_k=candidate_k
    )


    # --------------------------------------------------------
    # HANDLE NO RESULTS
    # --------------------------------------------------------

    if not results:

        return {
            "query": query,
            "answer": (
                "I could not find relevant information "
                "in the provided research papers."
            ),
            "sources": []
        }


    # --------------------------------------------------------
    # BUILD CONTEXT
    # --------------------------------------------------------

    context_parts = []


    for i, (doc, score) in enumerate(
        results,
        start=1
    ):

        paper = doc.metadata.get(
            "paper_title",
            "Unknown Paper"
        )

        page = doc.metadata.get(
            "page_label",
            doc.metadata.get(
                "page",
                "Unknown"
            )
        )


        context_parts.append(
            f"""
SOURCE {i}

Paper: {paper}
Page: {page}

Content:
{doc.page_content}
"""
        )


    context = "\n".join(
        context_parts
    )


    # ========================================================
    # RAG PROMPT
    # ========================================================

    prompt = f"""
You are a research paper question-answering assistant.

Your task is to answer the user's question using ONLY
the research paper context provided below.

IMPORTANT RULES:

1. Use only the provided research paper context.
2. Do not use outside knowledge.
3. Do not invent facts.
4. Do not mention information that is not supported
   by the provided context.
5. Answer the exact USER QUESTION directly before adding
   related background.
6. Do not substitute a related Transformer concept for
   the concept explicitly asked about.
7. If the question asks for a ROLE, explain what the concept
   does and why it is needed, not merely where it is used.
8. If the question asks HOW something is done, describe the
   relevant procedure or training process, not just its results.
9. If the question asks for LIMITATIONS, state the actual
   limitation and its computational consequence before
   mentioning possible solutions.
10. Give a clear and concise answer.
8. Combine information from multiple sources when useful.
9. Do not include SOURCE labels in the answer.
10. Do not cite sources using phrases such as
    "(SOURCE 1)" unless explicitly requested.
11. If the context does not contain enough information,
    say that the answer could not be found in the
    provided research papers.

USER QUESTION:

{query}


RESEARCH PAPER CONTEXT:

{context}


ANSWER:
"""


    # ========================================================
    # CALL OLLAMA / GEMMA 3
    # ========================================================

    try:

        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )

        response.raise_for_status()


    except requests.exceptions.ConnectionError:

        raise RuntimeError(
            "Could not connect to Ollama. "
            "Make sure Ollama is running."
        )


    except requests.exceptions.Timeout:

        raise RuntimeError(
            "Ollama took too long to generate "
            "the answer."
        )


    # --------------------------------------------------------
    # EXTRACT ANSWER
    # --------------------------------------------------------

    response_json = response.json()

    answer = response_json.get(
        "response",
        ""
    ).strip()


    if not answer:

        answer = (
            "I could not generate an answer "
            "from the provided research papers."
        )


    # ========================================================
    # PREPARE SOURCES
    # ========================================================

    sources = []


    for doc, score in results:

        paper = doc.metadata.get(
            "paper_title",
            "Unknown Paper"
        )

        page = doc.metadata.get(
            "page_label",
            doc.metadata.get(
                "page",
                "Unknown"
            )
        )


        sources.append(
            {
                "paper": paper,
                "page": page,
                "score": round(
                    float(score),
                    4
                )
            }
        )


    # ========================================================
    # RETURN RESULT
    # ========================================================

    return {
        "query": query,
        "answer": answer,
        "sources": sources
    }


# ============================================================
# HOME ENDPOINT
# ============================================================

@app.get("/")
def home():

    return {
        "status": "online",
        "message": "Research Paper RAG API is running",
        "documents": document_count
    }


# ============================================================
# ASK ENDPOINT
# ============================================================

@app.post("/ask")
def ask_question(
    request: QueryRequest
):

    question = request.question.strip()


    if not question:

        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )


    try:

        return ask_rag_final(
            question
        )


    except RuntimeError as e:

        raise HTTPException(
            status_code=503,
            detail=str(e)
        )


    except Exception as e:

        print(
            "❌ Error while processing question:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the question."
        )

# ============================================================
# CRAG — CORRECTIVE RAG
# ============================================================

CRAG_MIN_EVIDENCE_SCORE = 0.25
CRAG_WEB_RESULTS = 5
CRAG_WEB_TIMEOUT = 10


def _crag_tokens(text):
    words = re.findall(r"[a-zA-Z0-9][a-zA-Z0-9\-]+", (text or "").lower())
    stop = {
        "what","which","where","when","why","how","does","do","did",
        "the","and","for","with","from","that","this","are","is","was",
        "were","into","about","used","use","using","can","could","would",
        "should","their","there","than","then","also","only","very",
        "more","most","any","some","such","its","it","of","to","in","on",
        "as","by","an","a","or","be","if"
    }
    return {w for w in words if len(w) > 2 and w not in stop}


def _crag_local_score(query, results):
    if not results:
        return 0.0

    q = _crag_tokens(query)
    if not q:
        return 0.0

    best_overlap = 0.0
    for doc, _score in results:
        d = _crag_tokens(doc.page_content)
        best_overlap = max(best_overlap, len(q & d) / len(q))

    top_score = float(results[0][1])
    rerank_quality = 1.0 / (1.0 + pow(2.71828, -top_score))
    overlap_quality = min(best_overlap * 2.0, 1.0)

    return round((0.60 * rerank_quality) + (0.40 * overlap_quality), 4)


def _crag_ollama(prompt, timeout=60):
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        },
        timeout=timeout
    )
    response.raise_for_status()
    return (response.json().get("response") or "").strip()


def evaluate_crag_evidence(query, results):
    local_score = _crag_local_score(query, results)

    if not results:
        return {
            "decision": "WEAK",
            "quality": 0.0,
            "reason": "No research-paper evidence was retrieved."
        }

    context = "\n\n".join(
        f"SOURCE {i}: {doc.page_content[:1800]}"
        for i, (doc, _score) in enumerate(results, 1)
    )

    prompt = f"""
You are the evidence evaluator in a Corrective RAG system.

USER QUESTION:
{query}

RESEARCH PAPER EVIDENCE:
{context}

Decide whether the evidence directly contains enough information
to answer the exact user question.

Return ONLY:
GOOD
or
WEAK

GOOD = directly supported and sufficient.
WEAK = missing, insufficient, or only loosely related.
"""

    try:
        verdict = _crag_ollama(prompt, timeout=45).upper()
        decision = "GOOD" if verdict.strip().startswith("GOOD") else "WEAK"
    except Exception as exc:
        print("CRAG evaluator fallback:", exc)
        decision = "GOOD" if local_score >= CRAG_MIN_EVIDENCE_SCORE else "WEAK"

    if local_score < 0.12:
        decision = "WEAK"

    return {
        "decision": decision,
        "quality": local_score,
        "reason": (
            "Research-paper evidence is sufficient."
            if decision == "GOOD"
            else "Research-paper evidence is insufficient; corrective retrieval is required."
        )
    }


def web_search_crag(query, max_results=CRAG_WEB_RESULTS):
    """
    Lightweight corrective web retrieval using DuckDuckGo HTML.
    No API key or extra Python package is required.
    """
    try:
        search_url = (
            "https://html.duckduckgo.com/html/?q="
            + quote_plus(query)
        )
        response = requests.get(
            search_url,
            headers={"User-Agent": "NEXUS-CRAG/1.0"},
            timeout=CRAG_WEB_TIMEOUT
        )
        response.raise_for_status()

        html = response.text
        found = []

        # Extract result links/titles/snippets from DuckDuckGo HTML.
        pattern = re.compile(
            r'<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>(.*?)</a>'
            r'.*?<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>(.*?)</a>',
            re.I | re.S
        )

        for match in pattern.finditer(html):
            url = unescape(match.group(1))
            title = unescape(re.sub(r"<.*?>", "", match.group(2)))
            snippet = unescape(re.sub(r"<.*?>", "", match.group(3)))

            title = re.sub(r"\s+", " ", title).strip()
            snippet = re.sub(r"\s+", " ", snippet).strip()

            if url and title:
                found.append({
                    "title": title,
                    "url": url,
                    "snippet": snippet
                })

            if len(found) >= max_results:
                break

        return found

    except Exception as exc:
        print("CRAG web search failed:", exc)
        return []


def ask_crag_final(query, top_k=3, candidate_k=20):
    # 1. Existing research-paper RAG
    results = production_retrieve(
        query,
        top_k=top_k,
        candidate_k=candidate_k
    )

    # 2. Evidence evaluation
    evaluation = evaluate_crag_evidence(query, results)

    # 3. Corrective retrieval only when evidence is weak
    web_results = []
    route = "PAPER_RAG"

    if evaluation["decision"] == "WEAK":
        route = "CRAG_WEB_CORRECTION"
        web_results = web_search_crag(query)

    paper_context = "\n\n".join(
        f"""PAPER SOURCE {i}
Paper: {doc.metadata.get("paper_title", "Unknown Paper")}
Page: {doc.metadata.get("page_label", doc.metadata.get("page", "Unknown"))}
Content:
{doc.page_content}
"""
        for i, (doc, _score) in enumerate(results, 1)
    )

    web_context = "\n\n".join(
        f"""WEB SOURCE {i}
Title: {item["title"]}
URL: {item["url"]}
Snippet: {item["snippet"]}
"""
        for i, item in enumerate(web_results, 1)
    )

    if route == "PAPER_RAG":
        instruction = """
Use the research-paper evidence only.
Do not add outside information.
"""
    else:
        instruction = """
The paper evidence was insufficient, so use the web evidence as
corrective evidence for the missing information. Do not pretend web
information came from the research paper. If both evidence sets are
insufficient, say so.
"""

    final_prompt = f"""
You are NEXUS, an intelligent research engine using Corrective RAG.

USER QUESTION:
{query}

RESEARCH-PAPER EVIDENCE:
{paper_context or "No usable paper evidence."}

WEB CORRECTIVE EVIDENCE:
{web_context or "No web evidence retrieved."}

CRAG ROUTE:
{route}

{instruction}

Rules:
1. Answer the exact question directly.
2. Prefer directly relevant evidence.
3. Do not substitute a related concept.
4. Do not invent facts.
5. Keep the answer concise and technically useful.
6. Do not include SOURCE labels or raw URLs in the answer.
7. Clearly distinguish web information from research-paper information.

ANSWER:
"""

    try:
        answer = _crag_ollama(final_prompt, timeout=120)
    except requests.exceptions.ConnectionError:
        raise RuntimeError("Could not connect to Ollama. Make sure Ollama is running.")
    except requests.exceptions.Timeout:
        raise RuntimeError("Ollama took too long to generate the answer.")
    except Exception as exc:
        raise RuntimeError(f"CRAG generation failed: {exc}")

    if not answer:
        answer = "I could not generate an answer from the available evidence."

    sources = []

    for doc, score in results:
        sources.append({
            "type": "paper",
            "paper": doc.metadata.get("paper_title", "Unknown Paper"),
            "page": doc.metadata.get(
                "page_label",
                doc.metadata.get("page", "Unknown")
            ),
            "score": round(float(score), 4)
        })

    for item in web_results:
        sources.append({
            "type": "web",
            "title": item["title"],
            "url": item["url"],
            "snippet": item["snippet"]
        })

    return {
        "query": query,
        "answer": answer,
        "sources": sources,
        "crag": {
            "enabled": True,
            "route": route,
            "evidence_quality": evaluation["quality"],
            "evidence_decision": evaluation["decision"],
            "web_search_used": bool(web_results),
            "reason": evaluation["reason"]
        }
    }


# ============================================================
# CRAG ENDPOINT
# ============================================================

@app.post("/ask-crag")
def ask_crag_question(request: QueryRequest):
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    try:
        return ask_crag_final(question)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        print("CRAG error:", exc)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the CRAG question."
        )


# ============================================================
# START FASTAPI SERVER
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000
    )

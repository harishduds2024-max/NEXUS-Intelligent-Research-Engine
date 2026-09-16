NEXUS — Intelligent Research Engine

ASK YOUR PAPERS. UNDERSTAND FASTER.

NEXUS is an AI-powered research paper question-answering system built to make it easier to understand and work with multiple research papers.

Instead of manually searching through long documents for every question, NEXUS retrieves the most relevant sections from the available papers and uses them to generate a clear, context-based answer.

The project combines Retrieval-Augmented Generation (RAG), semantic search, keyword-based retrieval, document reranking, and Corrective RAG (CRAG) to improve both answer quality and retrieval reliability.

About the Project**

Research papers often contain a large amount of information spread across many pages. Finding one specific concept, explanation, or result can take considerable time.

NEXUS was developed to make this process more convenient.

A user can simply ask a question in natural language. The system searches the indexed research papers, identifies relevant content, evaluates the retrieved evidence, and generates an answer using the available context.

Along with the answer, NEXUS also shows the relevant paper information and page references so that the user can verify the source.

What NEXUS Does**

The system follows a complete retrieval and generation workflow:

**Research Papers → Chunking → Embeddings → Vector Database → Retrieval → Reranking → Evidence Evaluation → Answer Generation**

When the retrieved research-paper evidence is sufficient, the answer is generated directly from the papers.

If the evidence is not sufficient, NEXUS uses a corrective retrieval process to search for additional information from the web.

Key Features**

Natural-language question answering

Retrieval-Augmented Generation (RAG)

Research paper indexing with ChromaDB

Semantic vector search

BM25 keyword retrieval

Hybrid retrieval

Cross-encoder reranking

Top-3 relevant source retrieval

Paper and page-level source information

Local answer generation using Gemma3

Ollama-based LLM integration

Corrective RAG (CRAG)

Web-search fallback when paper evidence is insufficient

Search history and saved responses

Custom web interface

Light and dark interface support

Focus Mode for distraction-free reading

How the System Works**

NEXUS uses several stages to process a question.

1. Research Paper Processing**

The research papers are loaded and divided into smaller text chunks.

This makes it possible to search specific sections instead of processing an entire paper for every question.

2. Embedding Generation**

The document chunks are converted into vector representations using an embedding model.

The primary embedding model used in the system is:

BAAI/bge-small-en-v1.5

These vectors are stored in ChromaDB.

3. Document Retrieval**

When a user asks a question, NEXUS retrieves relevant chunks using two approaches:

Dense semantic retrieval

BM25 keyword retrieval

Semantic retrieval helps identify content with similar meaning, while BM25 helps match important terms from the question.

4. Reranking**

The retrieved candidates are passed through a cross-encoder reranker:

cross-encoder/ms-marco-MiniLM-L-6-v2

The reranker evaluates the relevance between the question and the retrieved content and helps select the most useful passages.

5. Evidence Evaluation**

Before generating the final answer, NEXUS checks whether the retrieved research-paper evidence is sufficient.

The system can classify the evidence as:

GOOD

WEAK

6. Answer Generation**

If the evidence is sufficient, the retrieved paper content is provided to Gemma3 through Ollama.

The model then generates an answer based on the retrieved context.

7. Corrective RAG**

If the evidence is considered weak, NEXUS activates its Corrective RAG workflow.

Additional information is retrieved from the web and used along with the available paper evidence before generating the final response.

System Architecture**


                    User Question

                         |

                         v

                 Query Processing

                         |

              +----------+----------+

              |                     |

              v                     v

       Dense Retrieval          BM25 Retrieval

              |                     |

              +----------+----------+

                         |

                         v

                Candidate Documents

                         |

                         v

                 Cross-Encoder

                   Reranking

                         |

                         v

                    Top-3 Chunks

                         |

                         v

                 Evidence Evaluation

                    /           \\

                   /             \\

                GOOD             WEAK

                 |                 |

                 v                 v

             Paper RAG       Web Correction

                 |                 |

                 +--------+--------+

                          |

                          v

                       Gemma3

                          |

                          v

                    Final Answer

                          |

                          v

              Paper / Page / Score

Embedding Experiment

As part of the project, more than one embedding model was experimented with to understand how different models affect retrieval.

BGE

BAAI/bge-small-en-v1.5

This is the primary embedding model used in the production RAG pipeline.

MiniLM

sentence-transformers/all-MiniLM-L6-v2

A separate ChromaDB collection was used for the MiniLM experiment:

research\_papers\_minilm

The same set of questions was used to compare the retrieved results from the two embedding models.

Retrieval Approach

NEXUS uses a combination of semantic and lexical retrieval rather than depending on a single search method.

Dense Retrieval

Dense embeddings are useful when the wording of the question and the wording in the paper are different but their meaning is similar.

BM25

BM25 provides keyword-based retrieval and helps when specific terms from the question are important.

Reranking

The results from retrieval are further evaluated using a cross-encoder to identify the most relevant chunks.

This produces the final top-3 evidence used by the answer generation stage.

Corrective RAG

One of the main extensions implemented in NEXUS is Corrective RAG.

The idea is simple:

Question

   |

   v

Research Paper Retrieval

   |

   v

Evidence Evaluation

   |

   +---- GOOD ----> Paper RAG ----> Answer

   |

   +---- WEAK ----> Web Search ---> Corrective Retrieval

                              |

                              v

                           Gemma3

                              |

                              v

                           Answer

This allows the system to handle questions where the available research-paper collection does not contain enough useful evidence.

The CRAG workflow was tested using both:

Paper evidence sufficient → PAPER\_RAG

Paper evidence insufficient → CRAG\_WEB\_CORRECTION

Technology Stack

| Technology    | Purpose                      |

| ------------- | ---------------------------- |

| Python        | Backend development          |

| FastAPI       | API development              |

| LangChain     | Retrieval and RAG components |

| ChromaDB      | Vector database              |

| Hugging Face  | Embedding models             |

| BGE           | Primary embedding model      |

| MiniLM        | Embedding experiment         |

| BM25          | Keyword retrieval            |

| Cross-Encoder | Document reranking           |

| Ollama        | Local LLM runtime            |

| Gemma3        | Answer generation            |

| HTML          | Frontend structure           |

| CSS           | Frontend styling             |

| JavaScript    | Frontend functionality       |

| Wikipedia API | Corrective retrieval         |

| DuckDuckGo    | Web-search fallback          |

| Bing          | Web-search fallback          |

Project Structure

Research Paper Answer Bot/

│

├── app.py

│

├── chroma\_db/

│   └── ChromaDB vector database

│

├── data/

│   └── Research papers

│

├── frontend/

│   ├── index.html

│   ├── style.css

│   ├── app.js

│   │

│   └── fonts/

│       └── Aquire-BW0ox.otf

│

├── notebooks/

│   └── Embedding experiments

│

├── outputs/

│   └── Evaluation outputs

│

└── README.md

Running the Project

Backend

Open a terminal and move to the project folder:

cd "C:\Users\ASUS\Downloads\Research Paper Answer Bot"

Start the FastAPI backend:

python app.py

The backend runs at:

http\://127.0.0.1:8000

Ollama

NEXUS uses Gemma3 through Ollama.

Make sure Ollama is installed and the model is available:

ollama pull gemma3

Ollama runs locally and is accessed by the backend.

Frontend

Open another terminal:

cd "C:\Users\ASUS\Downloads\Research Paper Answer Bot\frontend"

Start the frontend server:

python -m http.server 5500

Then open:

http\://127.0.0.1:5500

API Endpoints

Health Check

GET /

Used to check whether the backend is running.

Standard RAG

POST /ask

Handles research-paper question answering using the main RAG pipeline.

Corrective RAG

POST /ask-crag

Runs the complete RAG + evidence evaluation + corrective retrieval workflow.

Example Questions

Some example questions that can be asked using NEXUS:

What is the main objective of BERT's pre-training approach?

What are the two pre-training tasks used in BERT?

What is the main idea behind GPT-3's few-shot learning approach?

What are the limitations of GPT-3's few-shot learning?

What problem does Retrieval-Augmented Generation solve?

How does RAG combine parametric and non-parametric memory?

What is the main idea behind the RETRO model?

How does RETRO use retrieved text during prediction?

Why does the Transformer use self-attention instead of recurrence?

How does GPT-3 perform tasks without gradient updates?

Evaluation

The system was tested using 10 questions covering different research papers.

The evaluation included papers related to:

BERT

GPT-3

Retrieval-Augmented Generation

RETRO

Transformer

The responses were reviewed based on:

Relevance

Accuracy

Groundedness

Retrieval quality

Source information

Evaluation Summary

| Result  | Count |

| ------- | ----: |

| PASS    |     9 |

| PARTIAL |     1 |

| FAIL    |     0 |

| Total   |    10 |

The system successfully provided substantially useful answers for all 10 questions.

The one partial case occurred when the answer included information that was not fully supported by the retrieved context.

This was documented as a limitation rather than treating the generated answer as completely grounded.

Limitations

NEXUS is designed to improve research-paper exploration, but it still has some limitations.

Retrieval Quality

The system may sometimes retrieve information that is related to the question but does not contain enough detail to answer every part of it.

Grounding

An LLM can occasionally add information beyond the retrieved context. This is why source information and evidence evaluation are included in the system.

Dataset Dependency

The quality of paper-based answers depends on the research papers available in the indexed dataset.

Web Retrieval

When CRAG is triggered, the quality of the final answer can also depend on the availability and relevance of external web results.

Evaluation Size

The current evaluation uses 10 questions. A larger test set would provide a broader view of system performance.

Future Improvements

Some areas that could be explored in future versions include:

Larger research-paper collections

Better query rewriting

More advanced retrieval strategies

Automated evaluation using DeepEval

LLM-as-a-judge evaluation

Improved conversational memory

Research-paper comparison

Citation verification

Paper summarization

User-specific paper collections

Improved web retrieval

Cloud deployment

Why I Built NEXUS

The main idea behind NEXUS was to make research-paper exploration feel less like searching through hundreds of pages and more like having a conversation with the material.

The project gave me an opportunity to work with different parts of a modern GenAI application — from document processing and embeddings to vector databases, retrieval, reranking, LLM-based generation, and corrective retrieval.

More importantly, it helped me understand that building a useful RAG system is not only about connecting an LLM to a vector database. Retrieval quality, evidence grounding, evaluation, and failure handling are equally important.

Project Status

Research Paper Processing       Completed

ChromaDB Vector Storage         Completed

BGE Embeddings                  Completed

MiniLM Experiment               Completed

Dense Retrieval                 Completed

BM25 Retrieval                  Completed

Cross-Encoder Reranking         Completed

Top-3 Source Retrieval          Completed

Gemma3 + Ollama                 Completed

FastAPI Backend                 Completed

Custom Frontend                 Completed

Corrective RAG                  Completed

CRAG Web Correction             Tested

10-Question Evaluation          Completed

Failure Case Documentation      Completed

Author

Harish D

B.Sc. Computer Science

Data Science & Visualization

NEXUS

ASK YOUR PAPERS. UNDERSTAND FASTER.
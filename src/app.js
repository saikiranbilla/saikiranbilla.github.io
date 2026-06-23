export function render() {
  const root = document.getElementById('root')
  root.innerHTML = `
    <!-- Pull-string theme toggle -->
    <canvas id="pull-canvas" width="120" height="300"
            role="button" tabindex="0"
            aria-pressed="false"
            aria-label="Toggle light or dark mode"></canvas>

    <main class="page">

      <header class="header">
        <h1 class="name">Sai Kiran Billa</h1>
        <p class="status">📍 chicago, il</p>

        <div class="bio">
          <p>I'm Sai. I'm a forward deployed engineer. Previously, I went to UIUC and did my masters in Information Management. I like building things and I like talking to people — FDE lets me do both.</p>
          <p>Before this, I spent most of my time on multi-agent pipelines, RAG, and data engineering. A lot of my projects started as hackathons or class assignments that I couldn't stop working on. I'm happiest when I'm in a room with a customer figuring out what they actually need, then going back and building it.</p>
        </div>

        <div class="verse">
          <p class="verse-sanskrit" lang="sa">अनुगच्छतु प्रवाहः</p>
          <p class="verse-roman">let the current carry you</p>
        </div>
      </header>

      <!-- Work -->
      <section class="section" data-section>
        <h2 class="section-label">work</h2>

        <div class="entry">
          <p class="entry-body"><span class="entry-title"><span class="hover-trigger" data-hover-img="/images/story/cohort.png">Business Intelligence Group, UIUC</span></span> — technical consultant, spring 2026. Built Compass, a RAG chatbot for aviation staff. Shipped it to 200+ users on GCP. Spent most of my time figuring out how to get messy institutional PDFs into a form an LLM could actually reason over.</p>
        </div>

        <div class="entry">
          <p class="entry-body"><span class="entry-title"><span class="hover-trigger" data-hover-img="/images/story/team.jpg">University of Illinois Foundation</span></span> — data analyst, may 2025 to may 2026. Internal analytics and reporting for fundraising across 37 campus teams. SQL, pipelines, dashboards. The kind of infrastructure nobody notices until it breaks.</p>
        </div>
      </section>

      <!-- Projects -->
      <section class="section" data-section>
        <h2 class="section-label">projects</h2>

        <div class="entry">
          <p class="entry-body"><span class="entry-title">Netra</span> — Chrome extension that puts an AI companion on every webpage. Hold Space, ask a question out loud, and it responds with voice and visual guidance — flies a cursor to the exact element, draws hand-sketched highlights with Rough.js, and dims the rest of the page with a spotlight. Claude Vision sees your screen, ElevenLabs reads the answer back, and a Cloudflare Worker routes fact-check queries through Exa search. No buttons, no popups, just hold and talk.</p>
          <p class="entry-meta">Chrome Extension · Claude Vision · ElevenLabs · Rough.js · Cloudflare Workers · Exa — <a href="https://github.com/saikiranbilla/netra" target="_blank" rel="noopener">code</a></p>
        </div>

        <div class="entry">
          <p class="entry-body"><span class="entry-title">CropMindAI</span> — 7-agent pipeline that processes federal crop insurance claims in 18–25 seconds (adjusters normally take 3–5 business days). Three perception agents fan out concurrently — Claude Vision for field photos, weather API, soil moisture — then feed into a deterministic FCIC flood classifier. No LLM in the routing path, every decision maps to a handbook section. <span class="hover-trigger" data-hover-img="/images/story/win.png">2nd place, UIUC AgTech Hackathon.</span></p>
          <p class="entry-meta">React · FastAPI · LangGraph · Claude 3.5 Sonnet · pgvector — <a href="https://github.com/saikiranbilla/cropmindai" target="_blank" rel="noopener">code</a></p>
        </div>

        <div class="entry">
          <p class="entry-body"><span class="entry-title">Aura</span> — post-surgical recovery assistant. Three agents: one reads prescriptions with Qwen2-VL, one checks drug interactions against OpenFDA, one explains everything in plain english. Pose estimation runs client-side via MediaPipe WASM so joint-angle feedback is sub-200ms without a server roundtrip. Fine-tuned Mistral-7B on 20K medical flashcards.</p>
          <p class="entry-meta">Next.js · FastAPI · LangGraph · Modal · Mistral-7B · Qwen2-VL · MediaPipe — <a href="https://github.com/saikiranbilla/aura" target="_blank" rel="noopener">code</a></p>
        </div>

        <div class="entry">
          <p class="entry-body"><span class="entry-title">CLAI</span> — automates Canvas LMS with 3 agents and 15+ MCP tools. Put a FAISS semantic cache in front of every agent because most student queries are repeats. Cache hits skip the LLM entirely.</p>
          <p class="entry-meta">Python · LangGraph · FastAPI · React · FAISS · MCP — <a href="https://github.com/saikiranbilla/canvas-lms-agent" target="_blank" rel="noopener">code</a></p>
        </div>

        <div class="entry">
          <p class="entry-body"><span class="entry-title">Quill</span> — text-to-SQL that corrects itself. A Critic agent reads DuckDB error traces and retries with targeted fixes, up to 3 times. Fuzzy-matches columns across tables to auto-detect foreign keys so you don't need to define a schema. Runs local on DuckDB, no cloud.</p>
          <p class="entry-meta">Python · FastAPI · DuckDB · React · SSE — <a href="https://github.com/saikiranbilla/quill" target="_blank" rel="noopener">code</a></p>
        </div>


      </section>

      <!-- Education -->
      <section class="section" data-section>
        <h2 class="section-label">education</h2>
        <div class="entry">
          <p class="entry-body"><span class="entry-title">MS Information Management</span> at UIUC (2024–26, 3.97 GPA). ML systems, data engineering, AI.</p>
        </div>
        <div class="entry">
          <p class="entry-body"><span class="entry-title">B.Tech Computer Science</span> at GRIET (2020–24).</p>
        </div>
      </section>

      <!-- Notes -->
      <section class="section" data-section>
        <h2 class="section-label">notes</h2>

        <details class="note">
          <summary class="note-summary">Why I stopped using raw async for multi-agent pipelines</summary>
          <div class="note-body">
            <p>When I started building Aura, I had three async coroutines passing messages through a queue. It worked. Then I kept adding special cases — agent A waits for B only if confidence > 0.7, agent C runs in parallel but its output needs merging before A sees it. Each rule was another if-statement bolted onto a function that was never meant to carry that weight.</p>
            <p>LangGraph doesn't do anything magic. It just gives you a place to put the state machine you were already building by accident. Nodes are agents, edges are routing logic, one state object is the source of truth. The <code>conditional_edges</code> API made routing visible at a glance instead of scattered across coroutines.</p>
            <p>Trade-off: cold starts are slower, debugging means understanding the framework's state management too. For a two-step pipeline it's overkill. For Aura — three agents reasoning about patient state in real time with conditional branches on vision output — the explicitness was worth it.</p>
            <p>If your agent logic fits in one function, use one function. When you catch yourself writing state management code around your agent code, that's the signal.</p>
          </div>
        </details>

        <details class="note">
          <summary class="note-summary">The blocking database call that cost 800ms per request</summary>
          <div class="note-body">
            <p>The RAG chatbot had SSE streaming from day one. Words appeared progressively. But there was always a pause before the first word — ~800ms. Testers kept asking if it was loading.</p>
            <p>I assumed LLM cold start. Added a keepalive ping — no change. Then I assumed vector search latency. Logged Pinecone — consistently under 120ms. Then I checked what I should have checked first: a database insert that ran before the stream started.</p>
            <pre><code>// this was the problem
await db.insert(conversations).values({ userId, query, timestamp })
// ...then start streaming</code></pre>
            <p>A synchronous write blocking the entire response. 800ms gone, every single request. Fix: Next.js <code>after()</code> to defer the write until after the stream begins. TTFB dropped from ~850ms to under 300ms.</p>
          </div>
        </details>
      </section>

      <!-- Contact -->
      <section class="section" data-section>
        <h2 class="section-label">contact</h2>
        <p class="contact-text">if any of this is interesting to you, let's talk.</p>
        <p class="contact-links">
          <a href="mailto:sbilla21@outlook.com">email</a>
          <a href="https://github.com/saikiranbilla" target="_blank" rel="noopener">github</a>
          <a href="https://linkedin.com/in/saikiranbilla" target="_blank" rel="noopener">linkedin</a>
          <a href="https://leetcode.com/u/saikiranb_21/" target="_blank" rel="noopener">leetcode</a>
        </p>
      </section>

    </main>

    <!-- Hover image popover -->
    <div class="hover-img" id="hover-img" aria-hidden="true">
      <img id="hover-img-el" src="" alt="" />
    </div>
  `
}

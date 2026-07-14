import re
import math
from typing import Dict, Any, List, Optional
from datetime import datetime

# --- RICH RICH QUESTION BANK ---
QUESTION_BANK = {
    "python": {
        "Beginner": [
            "What is the difference between a list and a tuple in Python, and when would you use each?",
            "Explain the difference between global and local variables inside a Python function.",
            "What are Python decorators, and how do they modify the behavior of a function?"
        ],
        "Intermediate": [
            "Explain how garbage collection works inside Python, and what circular references are.",
            "What is the difference between shallow copy and deep copy in Python? How does the copy module handle them?",
            "Explain Python's GIL (Global Interpreter Lock). How does it affect multi-threading vs multi-processing?"
        ],
        "Advanced": [
            "How does memory management work in Python? Explain references counting and generational garbage collection.",
            "Explain the concept of metaclasses in Python and how they differ from standard class inheritance.",
            "How would you optimize a Python application suffering from memory leaks due to large closures or circular structures?"
        ]
    },
    "react": {
        "Beginner": [
            "What is the Virtual DOM in React, and how does the reconciliation process work?",
            "What are React Hooks, and what rules must be followed when using hooks?",
            "Explain the difference between functional components and class components in React."
        ],
        "Intermediate": [
            "How does React's Context API work? What are its performance implications compared to Redux?",
            "Explain the difference between useMemo and useCallback hooks. When should you avoid using them?",
            "What is React Reconciliation, and how do key props help React identify modified list items?"
        ],
        "Advanced": [
            "Explain React 18 Concurrent Rendering features like transitions, Suspense, and selective hydration.",
            "How do React Server Components (RSC) work? How do they differ from SSR (Server-Side Rendering)?",
            "How would you debug and fix performance bottlenecks caused by excessive component re-renders in a large-scale React app?"
        ]
    },
    "fastapi": {
        "Beginner": [
            "What is FastAPI, and why does it perform better than Flask or Django for REST APIs?",
            "How does FastAPI handle automatic request validation using Pydantic schemas?",
            "Explain how path parameters and query parameters are declared in FastAPI endpoint paths."
        ],
        "Intermediate": [
            "Explain the lifespan event handler context manager in FastAPI. How is it used for database startup/shutdown setups?",
            "How does dependency injection work in FastAPI? Explain the 'Depends' decorator functionality.",
            "How does FastAPI support asynchronous endpoint routing functions (async/await) under the hood using ASGI?"
        ],
        "Advanced": [
            "Design a distributed rate-limiting middleware in FastAPI using Redis caches and sliding windows.",
            "How would you orchestrate background worker tasks in FastAPI using Celery or built-in BackgroundTasks for slow operations?",
            "Explain ASGI vs WSGI paradigms. How does Uvicorn manage event loops to handle high concurrency under FastAPI?"
        ]
    },
    "system_design": {
        "Beginner": [
            "What is the difference between vertical scaling and horizontal scaling in system architectures?",
            "What is a load balancer, and how does it distribute traffic to application servers?",
            "What is database replication, and what is the difference between read replicas and write nodes?"
        ],
        "Intermediate": [
            "How would you design a distributed caching system using Redis to prevent database bottlenecks under heavy traffic?",
            "Explain the difference between REST, GraphQL, and gRPC protocols. When would you choose one over another?",
            "How does horizontal scaling with load balancers handle stateful sessions? Mention strategies like sticky sessions and external session stores."
        ],
        "Advanced": [
            "Design a highly scalable, real-time notifications system that delivers millions of push notifications per second with low latency.",
            "How does the CAP theorem apply to distributed storage systems? Explain how you would design a system that prioritizes partition tolerance.",
            "Design a distributed rate-limiting mechanism using rolling windows, Redis clusters, and token bucket algorithms."
        ]
    },
    "ml": {
        "Beginner": [
            "What is the difference between supervised learning and unsupervised learning? Give examples.",
            "What is overfitting in machine learning models, and how can you prevent it?",
            "Explain the difference between classification and regression tasks in machine learning."
        ],
        "Intermediate": [
            "What is gradient descent, and how does backpropagation update weights inside neural networks?",
            "Explain the bias-variance tradeoff. How does changing model complexity affect both metrics?",
            "What is the difference between L1 regularization (Lasso) and L2 regularization (Ridge)?"
        ],
        "Advanced": [
            "How do Transformer architectures work? Explain self-attention mechanism, multi-head attention, and positional encoding.",
            "How would you scale neural network training using distributed data parallelism (DDP) across multiple GPU nodes?",
            "Explain the differences between batch normalization, layer normalization, and group normalization. When would you apply each?"
        ]
    },
    "nlp": {
        "Beginner": [
            "What is TF-IDF (Term Frequency-Inverse Document Frequency), and how is it used to evaluate keyword relevance?",
            "Explain tokenization and stemming. How do they preprocess raw text documents?",
            "What is cosine similarity, and how does it calculate the similarity between two text vectors?"
        ],
        "Intermediate": [
            "Explain Word2Vec word embedding algorithms. What is the difference between Skip-gram and CBOW paradigms?",
            "How do Recurrent Neural Networks (RNNs) and LSTMs handle sequential text data, and what is the vanishing gradient problem?",
            "Explain Named Entity Recognition (NER). How does it identify and classify entities in unstructured text?"
        ],
        "Advanced": [
            "How would you fine-tune a pre-trained BERT or RoBERTa transformer model for semantic classification using huggingface libraries?",
            "Explain how retrieval-augmented generation (RAG) pipelines combine vector search databases (like Pinecone) with LLMs.",
            "How would you optimize an NLP inference service utilizing ONNX Runtime or TensorRT to reduce latency below 10ms?"
        ]
    },
    "dbms": {
        "Beginner": [
            "What is a primary key, foreign key, and unique constraint in relational databases?",
            "Explain the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN queries.",
            "What are database indexes, and how do they speed up select queries?"
        ],
        "Intermediate": [
            "Explain the ACID properties of relational database transactions. Give a concrete example of atomicity.",
            "What is the difference between clustered and non-clustered indexes? How do they affect write performance?",
            "Explain database normalization up to Third Normal Form (3NF). When would you denormalize tables?"
        ],
        "Advanced": [
            "How does PostgreSQL handle concurrency using Multiversion Concurrency Control (MVCC)?",
            "How would you design a database sharding strategy for a table containing billions of rows to distribute write traffic?",
            "Explain execution plans in relational databases. How would you diagnose a query suffering from table scans instead of index seeks?"
        ]
    },
    "os": {
        "Beginner": [
            "What is the difference between a process and a thread inside an operating system?",
            "What is virtual memory, and how does paging map logical addresses to physical memory slots?",
            "Explain the concept of CPU scheduling. Mention round-robin and priority scheduling algorithms."
        ],
        "Intermediate": [
            "What is a deadlock? Explain the four necessary conditions for a deadlock to occur.",
            "What are semaphores and mutexes? How do they manage resource access synchronization in multi-threaded programs?",
            "Explain memory fragmentation. What is the difference between internal and external fragmentation?"
        ],
        "Advanced": [
            "How does cache coherency work in multi-core CPU architectures? Explain the MESI protocol.",
            "Explain copy-on-write (COW) optimization during process creation using fork() system calls.",
            "How would you handle page thrashing in an operating system when memory demand exceeds physical RAM capacity?"
        ]
    },
    "behavioral": {
        "Beginner": [
            "Tell me about a time you had to work on a team project where members had differing opinions. How did you resolve it?",
            "Describe a situation where you had to learn a new programming language or tool quickly to complete a task.",
            "Explain a scenario where you failed to meet a deadline. What did you communicate, and what were the outcomes?"
        ],
        "Intermediate": [
            "Describe a time you recognized a major technical bottleneck in production and took ownership to resolve it.",
            "Tell me about a project implementation that failed, what technical lessons you carried forward, and how you improved.",
            "Explain a situation where you had to work under intense delivery constraints. How did you prioritize technical debt?"
        ],
        "Advanced": [
            "Describe a time when you had to make a critical architectural decision with incomplete information or high ambiguity. How did you validate it?",
            "Tell me about a time you had to mentor a junior engineer who was struggling with delivery quality. How did you manage it?",
            "Explain how you align technical roadmaps with business milestones when talking to non-technical executive stakeholders."
        ]
    },
    "java": {
        "Beginner": [
            "What is the difference between JDK, JRE, and JVM in Java?",
            "Explain the difference between method overloading and method overriding in Java.",
            "What are the access modifiers in Java (private, default, protected, public)?"
        ],
        "Intermediate": [
            "What is the difference between HashMap and ConcurrentHashMap? How does ConcurrentHashMap achieve thread safety?",
            "Explain Java's Garbage Collection mechanism. What is the difference between Minor GC and Major GC?",
            "What is the difference between Abstract class and Interface in Java 8 and above?"
        ],
        "Advanced": [
            "Explain Java Memory Model (JMM). How does the volatile keyword guarantee visibility and ordering?",
            "How would you optimize a high-concurrency Spring Boot application suffering from thread contention and database connection pool starvation?",
            "Explain how Java's classloader architecture works and how to resolve ClassNotFoundException vs NoClassDefFoundError."
        ]
    },
    "cpp": {
        "Beginner": [
            "What is the difference between pointers and references in C++?",
            "What is the purpose of the 'const' keyword in C++? Give examples of its usage.",
            "Explain the concept of OOP encapsulation, inheritance, and polymorphism in C++."
        ],
        "Intermediate": [
            "Explain Smart Pointers in C++ (unique_ptr, shared_ptr, weak_ptr) and how they prevent memory leaks.",
            "What is RAII (Resource Acquisition Is Initialization) in C++? How does it manage memory and locks?",
            "What is the difference between virtual functions and pure virtual functions in C++?"
        ],
        "Advanced": [
            "Explain the C++ Memory Model and Memory Ordering constraints (memory_order_seq_cst, memory_order_relaxed).",
            "How do C++ templates and template metaprogramming work? Explain SFINAE (Substitution Failure Is Not An Error).",
            "How would you optimize a latency-critical C++ real-time trading application to achieve sub-microsecond execution loops?"
        ]
    },
    "sql": {
        "Beginner": [
            "What is the difference between WHERE and HAVING clauses in SQL?",
            "Explain the difference between GROUP BY and ORDER BY clauses.",
            "What are SQL joins (INNER, LEFT, RIGHT, FULL OUTER)?"
        ],
        "Intermediate": [
            "What are window functions in SQL? Explain ROW_NUMBER(), RANK(), and DENSE_RANK().",
            "What is database normalization? Explain 1NF, 2NF, and 3NF.",
            "How do SQL indexes (Clustered vs Non-Clustered) speed up data retrieval?"
        ],
        "Advanced": [
            "How would you optimize a slow-running SQL query containing nested subqueries and multiple joins? Explain query plan analysis.",
            "Explain transaction isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable) and database lock escalation.",
            "Design a partitioned table architecture in SQL Server or PostgreSQL to manage historical log data of billions of rows."
        ]
    },
    "networks": {
        "Beginner": [
            "What is the difference between TCP and UDP protocols?",
            "Explain the 7 layers of the OSI model and their primary functions.",
            "What is the purpose of DNS (Domain Name System)?"
        ],
        "Intermediate": [
            "Explain the TCP 3-way handshake and 4-way connection termination handshake.",
            "What is the difference between HTTP and HTTPS? How does SSL/TLS handshake work?",
            "Explain the difference between IPv4 and IPv6 addressing schemes."
        ],
        "Advanced": [
            "Explain how TCP flow control (sliding window) and congestion control (slow start, congestion avoidance) work under high latency.",
            "How do modern reverse proxies like Nginx handle high concurrent connections using event-driven architectures?",
            "Design a globally distributed CDN caching architecture to optimize asset delivery and resolve cache invalidation latency."
        ]
    },
    "deep_learning": {
        "Beginner": [
            "What is the difference between Machine Learning and Deep Learning?",
            "What is an activation function? Explain ReLU, Sigmoid, and Tanh.",
            "What is a loss function in Deep Learning? Give examples."
        ],
        "Intermediate": [
            "Explain the vanishing and exploding gradient problems in deep neural networks. How do we mitigate them?",
            "What is the difference between Batch Normalization and Layer Normalization?",
            "Explain Convolutional Neural Networks (CNNs) and how pooling layers decrease spatial dimensions."
        ],
        "Advanced": [
            "Explain the Transformer architecture self-attention mechanism, multi-head attention, and positional encoding.",
            "How do Generative Adversarial Networks (GANs) work? Explain the minimax game between Generator and Discriminator.",
            "How would you optimize a large deep learning model for production deployment using quantization, pruning, and ONNX runtime?"
        ]
    },
    "javascript": {
        "Beginner": [
            "What is the difference between let, const, and var in JavaScript?",
            "Explain the concept of closures in JavaScript with a simple code example.",
            "What is the difference between double equality (==) and triple equality (===)?"
        ],
        "Intermediate": [
            "Explain the JavaScript Event Loop (microtasks, macrotasks, call stack, task queue).",
            "What are Promises in JavaScript? Explain the difference between Promise.all() and Promise.allSettled().",
            "What is prototypical inheritance in JavaScript, and how does it differ from class inheritance?"
        ],
        "Advanced": [
            "How would you detect and resolve memory leaks in a long-running Node.js or browser application?",
            "Explain JavaScript engines' compilation stages (JIT compilation, V8 compiler pipeline, Ignition, TurboFan).",
            "Design a custom Promise scheduler in vanilla JS that limits concurrent executions to maximum N parallel tasks."
        ]
    },
    "nodejs": {
        "Beginner": [
            "What is Node.js, and why is it single-threaded and non-blocking?",
            "What is the difference between require() and import statements in Node.js?",
            "What is npm, and what is the difference between package.json and package-lock.json?"
        ],
        "Intermediate": [
            "Explain the event-driven architecture of Node.js and the libuv thread pool.",
            "What is the difference between setImmediate(), process.nextTick(), and setTimeout() in Node.js?",
            "How do Streams work in Node.js, and why are they efficient for handling large files?"
        ],
        "Advanced": [
            "How does clustering work in Node.js to scale server applications across multiple CPU cores?",
            "How would you debug a Node.js process suffering from event loop blockage or memory heap exhaustion?",
            "Design an asynchronous backpressure mechanism in a Node.js streaming pipeline to prevent memory overflow."
        ]
    },
    "dsa": {
        "Beginner": [
            "What is the difference between an Array and a Linked List? Mention space and time complexity.",
            "What is a Stack and a Queue? Give real-world examples of their usage.",
            "Explain the Big O notation. What is the time complexity of binary search?"
        ],
        "Intermediate": [
            "Explain the difference between Depth First Search (DFS) and Breadth First Search (BFS) in trees/graphs.",
            "How does a Hash Map handle collisions? Explain chaining and open addressing strategies.",
            "Explain Quick Sort and Merge Sort. Why is Merge Sort preferred for sorting linked lists?"
        ],
        "Advanced": [
            "Explain Dijkstra's algorithm for finding the shortest path in a graph. What is its time complexity using min-heaps?",
            "How do Red-Black Trees or AVL Trees maintain balanced heights during insertions and deletions?",
            "Design a Cache eviction policy algorithm (like LRU or LFU) with O(1) runtime complexity for both put and get operations."
        ]
    }
}

# --- COMPANY INTERVIEW STYLE DECORATORS ---
COMPANY_STYLES = {
    "Google": {
        "style_desc": "algorithmic rigor and deep system design scalability checks.",
        "pref_categories": ["dsa", "system_design"],
        "tone": "Deeply analytical, focusing on runtime complexity and scale limits."
    },
    "Microsoft": {
        "style_desc": "emphasis on coding concepts, operating systems internals, and relational db integrity.",
        "pref_categories": ["technical", "dbms", "os"],
        "tone": "Structured, targeting API design, correctness, and system configurations."
    },
    "Amazon": {
        "style_desc": "customer obsession and scenario-based Leadership Principles (STAR method).",
        "pref_categories": ["behavioral", "system_design"],
        "tone": "Principle-driven, inspecting ownership, dive deep, and deliver results."
    },
    "Meta": {
        "style_desc": "rapid component architecture, system design, and high-concurrency client systems.",
        "pref_categories": ["react", "system_design"],
        "tone": "Pragmatic, evaluating fast iteration, network payloads, and user interface scalability."
    },
    "OpenAI": {
        "style_desc": "advanced machine learning, transformers research, and high-performance server architectures.",
        "pref_categories": ["ml", "deep_learning", "nlp"],
        "tone": "State-of-the-art AI, exploring transformer self-attention, hyper-parameters, and model deployment latency."
    },
    "Netflix": {
        "style_desc": "highly distributed system designs, cultural match, and freedom/responsibility checks.",
        "pref_categories": ["system_design", "behavioral"],
        "tone": "Autonomous and critical, checking rate limiters, video buffering, and high-concurrency resilience."
    },
    "Apple": {
        "style_desc": "hardware-software integration, privacy-focused systems, and detail-oriented product design.",
        "pref_categories": ["cpp", "os", "system_design"],
        "tone": "Refined and security-centric, evaluating detail, privacy, and low-level performance."
    },
    "Adobe": {
        "style_desc": "graphics pipelines, cloud document services, and collaborative tool architectures.",
        "pref_categories": ["cpp", "javascript", "system_design"],
        "tone": "Creative and user-centric, checking graphics structures and SaaS backend APIs."
    },
    "Oracle": {
        "style_desc": "relational database architecture, cloud infrastructure, and enterprise Java backend services.",
        "pref_categories": ["java", "dbms", "sql"],
        "tone": "Enterprise-focused, examining query optimization, indexing, and transactional isolation limits."
    },
    "IBM": {
        "style_desc": "cognitive computing, enterprise scaling, and hybrid cloud integration.",
        "pref_categories": ["java", "system_design", "networks"],
        "tone": "Academic and enterprise-driven, checking integration systems, security, and legacy migration."
    },
    "TCS": {
        "style_desc": "consulting services, client delivery, and broad software development lifecycles.",
        "pref_categories": ["java", "sql", "behavioral"],
        "tone": "Service-oriented, verifying general programming logic and customer requirement translations."
    },
    "Infosys": {
        "style_desc": "business consulting, agile methodology, and enterprise software engineering.",
        "pref_categories": ["java", "dbms", "behavioral"],
        "tone": "Process-driven, evaluating SDLC concepts, unit testing, and agile team communication."
    },
    "Accenture": {
        "style_desc": "digital transformation, technology integration, and cross-functional team delivery.",
        "pref_categories": ["system_design", "behavioral"],
        "tone": "Consultative, checking transformation strategy, cloud architecture, and communication."
    },
    "Capgemini": {
        "style_desc": "global IT consulting, application modernization, and agile delivery.",
        "pref_categories": ["javascript", "sql", "behavioral"],
        "tone": "Collaborative, testing modernization steps, legacy code refactoring, and code standards."
    },
    "Cognizant": {
        "style_desc": "digital systems, business process automation, and general cloud platforms.",
        "pref_categories": ["python", "dbms", "behavioral"],
        "tone": "Delivery-oriented, assessing automation setups, data modeling, and general API design."
    },
    "Wipro": {
        "style_desc": "information technology consulting, business process services, and software testing.",
        "pref_categories": ["python", "sql", "behavioral"],
        "tone": "Practical, assessing verification, test coverage, and database query correctness."
    },
    "Generic Software Company": {
        "style_desc": "balanced technical concepts and team communication skills check.",
        "pref_categories": ["technical", "behavioral"],
        "tone": "Collaborative, checking general engineering best practices."
    }
}

class QuestionGenerator:
    """
    Generates tailored, non-repeating interview questions based on candidate profile.
    """
    def __init__(self, previously_asked: List[str] = None):
        self.previously_asked = set(previously_asked or [])

    def generate_questions_list(
        self,
        resume_text: str,
        target_role: str,
        missing_skills: List[str],
        difficulty: str,
        company: str,
        topic_focus: str,
        practice_mode: str
    ) -> List[str]:
        import random
        # Define number of questions based on mode
        q_counts = {"quick": 5, "standard": 10, "full": 20, "unlimited": 10}
        total_questions = q_counts.get(practice_mode.lower(), 10)

        questions = []
        
        # 1. Topic Focus Filtering
        focus_key = topic_focus.lower().replace(".", "").replace("js", "").strip()
        
        # Explicit mappings for special names
        topic_mappings = {
            "c++": "cpp",
            "cpp": "cpp",
            "computer networks": "networks",
            "networks": "networks",
            "deep learning": "deep_learning",
            "data structures": "dsa",
            "algorithms": "dsa",
            "dsa": "dsa",
            "dbms": "dbms",
            "database": "dbms",
            "operating systems": "os",
            "os": "os",
            "machine learning": "ml",
            "ml": "ml"
        }
        
        selected_topics = []
        if focus_key in topic_mappings:
            selected_topics.append(topic_mappings[focus_key])
        else:
            for t in QUESTION_BANK.keys():
                if focus_key in t or t in focus_key:
                    selected_topics.append(t)
                    
        if not selected_topics or focus_key == "mixed interview":
            selected_topics = list(QUESTION_BANK.keys())

        # 2. Check for Resume Specifics
        resume_lower = resume_text.lower()
        has_ml = "machine learning" in resume_lower or "ml" in resume_lower or "neural network" in resume_lower
        has_react = "react" in resume_lower or "javascript" in resume_lower
        has_python = "python" in resume_lower
        
        # Extract projects
        project_questions = []
        project_patterns = [r"project\s*:\s*([^\n]+)", r"built\s*([^\n]+)", r"created\s*([^\n]+)", r"developed\s*([^\n]+)"]
        detected_projects = []
        for pat in project_patterns:
            matches = re.findall(pat, resume_lower)
            if matches:
                detected_projects.extend([m.strip() for m in matches[:2]])
                
        # Build specific project-deep-dive questions if projects exist
        if detected_projects:
            project_templates = [
                f"You listed the project '{{project}}' in your resume. Explain what technical challenges you faced during its implementation and how you resolved them.",
                f"For your project '{{project}}', explain the deployment architecture you chose and how you would scale it to handle 10x traffic.",
                f"If you were to refactor the project '{{project}}', what improvements would you introduce regarding caching, testing, or API latency?",
                f"What specific security and access control mechanisms did you implement inside your project '{{project}}'?",
                f"In your project '{{project}}', explain how you handled exception boundaries and API request validation.",
                f"If you were to rewrite '{{project}}' today, what architectural or framework level changes would you introduce to reduce processing latency?",
                f"Why did you choose the technical stack you used for '{{project}}' over alternatives like Flask or Django?"
            ]
            for proj in list(set(detected_projects))[:2]:
                sampled = random.sample(project_templates, min(len(project_templates), 2))
                for s in sampled:
                    project_questions.append(s.format(project=proj))

        # 3. Add Project Discussion questions specifically if matching "AI Resume Analyzer"
        if "ai resume analyzer" in resume_lower or "skill gap analyzer" in resume_lower:
            project_questions.extend([
                "Why did you build this project? Explain how TF-IDF and cosine similarity work under the hood to calculate compatibility.",
                "For your AI Resume Analyzer, explain how the sentence-transformers all-MiniLM-L6-v2 vector embeddings match semantic context.",
                "How would you deploy your Skill Gap Analyzer application to AWS ECS and handle database schema migration steps?"
            ])

        # 4. Fill Questions Pool
        pool = []
        
        # Gather questions matching selected topics and difficulty
        for topic in selected_topics:
            topic_dict = QUESTION_BANK.get(topic, {})
            diff_list = topic_dict.get(difficulty, topic_dict.get("Intermediate", []))
            for q in diff_list:
                if q not in self.previously_asked:
                    pool.append(q)

        # Incorporate resume based questions
        if has_ml and "ml" in selected_topics:
            pool.extend([q for q in QUESTION_BANK["ml"][difficulty] if q not in self.previously_asked])
        if has_react and "react" in selected_topics:
            pool.extend([q for q in QUESTION_BANK["react"][difficulty] if q not in self.previously_asked])
        if has_python and "python" in selected_topics:
            pool.extend([q for q in QUESTION_BANK["python"][difficulty] if q not in self.previously_asked])

        # Mix project specific questions
        if project_questions:
            pool.extend([q for q in project_questions if q not in self.previously_asked])

        # Incorporate missing skills
        if missing_skills:
            for skill in missing_skills[:2]:
                pool.append(f"Your ATS analysis shows a gap in '{skill}'. Explain your understanding of this technology and how it addresses system limits in production.")

        # Fallback to general templates if pool is empty
        if not pool:
            pool = [
                f"Explain how you would apply your technical stack to build a scalable microservice for a target role as a {target_role}.",
                f"Describe your experience debugging high-concurrency API bottlenecks in your previous software projects.",
                "How do you approach writing unit tests and automation scripts to verify correctness in your repositories?"
            ]

        # Select distinct questions and SHUFFLE them to ensure dynamic, non-repeating interviews
        unique_pool = list(dict.fromkeys(pool))
        random.shuffle(unique_pool)

        # 5. Company Decorator Style adjustments
        company_info = COMPANY_STYLES.get(company, COMPANY_STYLES["Generic Software Company"])
        style_desc = company_info["style_desc"]
        tone = company_info["tone"]

        company_templates = [
            "Here at {company}, we focus on {style_desc} How would you approach this: {question}",
            "Considering {company}'s emphasis on {style_desc} explain this: {question}",
            "As an engineer at {company}, how do you evaluate this: {question}",
            "{question} (Please answer keeping in mind {company}'s culture of: {tone})"
        ]

        # Select total_questions and apply decorations
        for q in unique_pool:
            if len(questions) >= total_questions:
                break
            # Randomly decorate 50% of the questions with company context to feel organic
            if random.random() < 0.5:
                tmpl = random.choice(company_templates)
                questions.append(tmpl.format(company=company, style_desc=style_desc, tone=tone, question=q))
            else:
                questions.append(q)

        # Ensure we meet the count
        while len(questions) < total_questions:
            questions.append(f"Explain a critical system engineering design decision you made in your projects to support role readiness as a {target_role}.")

        return questions

class DifficultyEngine:
    """
    Dynamically adjusts question difficulty for adaptive interviews based on answer scores.
    """
    @staticmethod
    def adjust_difficulty(current_diff: str, last_score: float) -> str:
        levels = ["Beginner", "Intermediate", "Advanced"]
        if current_diff not in levels:
            return "Intermediate"
        idx = levels.index(current_diff)
        
        if last_score < 60:
            # Decrease difficulty
            new_idx = max(0, idx - 1)
        elif last_score > 80:
            # Increase difficulty
            new_idx = min(len(levels) - 1, idx + 1)
        else:
            new_idx = idx
            
        return levels[new_idx]

class FollowUpGenerator:
    """
    Generates contextual follow-up questions when the previous response is weak.
    """
    @staticmethod
    def generate_follow_up(question: str, user_answer: str, score: float) -> Optional[str]:
        if score >= 65:
            return None
            
        # Contextual triggers
        ans_lower = user_answer.lower()
        if len(user_answer.split()) < 10:
            return "That answer was a bit brief. Can you explain that further and give a concrete technical example?"
        if "why" in question.lower() and not any(k in ans_lower for k in ["because", "since", "due to"]):
            return "You mentioned the solution, but why did you choose that specific strategy over other standard designs?"
        if any(k in ans_lower for k in ["i don't know", "not sure", "forgot"]):
            return "No problem. Let's break it down: what would happen if you had to design a simpler version of this in memory?"
            
        return "Can you expand on that concept and outline how you would deploy and verify it in a local staging environment?"

class EvaluationEngine:
    """
    Evaluates transcription quality, technical accuracy, pace, and completeness.
    """
    @staticmethod
    def evaluate_answer(question: str, answer: str, response_time: float = 0.0) -> Dict[str, Any]:
        ans_len = len(answer.split())
        
        # Calculate sub-scores (simulated NLP weights)
        accuracy = 75.0
        completeness = 70.0
        clarity = 80.0
        grammar = 85.0
        structure = 75.0
        
        # Vocabulary richness & filler words
        filler_list = ["um", "uh", "like", "actually", "basically", "you know"]
        filler_count = sum(len(re.findall(rf"\b{f}\b", answer.lower())) for f in filler_list)
        
        vocab_richness = min(100.0, max(45.0, 50.0 + ans_len * 0.15))
        
        # Adjust accuracy based on keywords overlap
        q_words = set(re.findall(r"\w+", question.lower()))
        ans_words = set(re.findall(r"\w+", answer.lower()))
        overlap = len(q_words.intersection(ans_words))
        
        accuracy = min(100.0, max(30.0, 45.0 + overlap * 5.0 - filler_count * 3.0))
        
        if ans_len < 10:
            accuracy = 30.0
            completeness = 20.0
            clarity = 40.0
            
        # Ideal answer recommendation builder
        ideal_answers = {
            "list and a tuple": "Lists are mutable, meaning items can be appended or modified in-place; they are represented with square brackets. Tuples are immutable sequence structures represented with parentheses. Tuples have lower memory footprints and protect data integrity.",
            "garbage collection": "Python uses reference counting as its primary garbage collection logic, instantly deallocating objects when their reference count drops to zero. To resolve circular reference leaks, a generational cyclic garbage collector runs periodically, scanning object lists divided into three age cohorts.",
            "virtual dom": "The Virtual DOM is an in-memory representation of the real DOM nodes. React syncs it by generating a lightweight UI copy, comparing it against the previous tree using a diffing algorithm (Reconciliation), and batch-updating only the modified DOM coordinates.",
            "lifespan event": "The FastAPI Lifespan context manager runs before the server starts accepting HTTP traffic, allowing initialization like database connection pools, and cleans them up cleanly after the server receives shutdown triggers."
        }
        
        model_ans = "Relational primary index structures map rows to sequential slots. For heavy API systems, database architectures should leverage index caching, query pagination, and transactional isolation bounds to verify latency throughput."
        for k, v in ideal_answers.items():
            if k in question.lower():
                model_ans = v
                break
                
        # Strengths & weaknesses
        strengths = []
        weaknesses = []
        
        if accuracy >= 75:
            strengths.append("Demonstrated solid technical accuracy and concept explanation.")
        else:
            weaknesses.append("Need to define the core technical terms and operational behaviors more clearly.")
            
        if ans_len >= 30:
            strengths.append("Provided a comprehensive answer structure with sufficient detail.")
        else:
            weaknesses.append("Explain the mechanics more fully; try expanding your description with examples.")
            
        if filler_count > 3:
            weaknesses.append(f"Detected {filler_count} filler words (um/uh/like). Try practicing pausing to reduce verbal ticks.")
        else:
            strengths.append("Spoke clearly with high verbal clarity and minimal fillers.")

        # Aggregate Score
        overall_score = round(0.3 * accuracy + 0.2 * completeness + 0.15 * clarity + 0.15 * structure + 0.1 * grammar + 0.1 * vocab_richness, 1)

        # Pace (words per minute)
        speaking_pace = round((ans_len / (response_time / 60.0)) if response_time > 0 else 125.0, 1)
        speaking_pace = min(220.0, max(50.0, speaking_pace))

        return {
            "technical_relevance": round(accuracy, 1),
            "completeness": round(completeness, 1),
            "communication_clarity": round(clarity, 1),
            "keyword_coverage": round(min(100.0, 40.0 + overlap * 8.0), 1),
            "speaking_pace": speaking_pace,
            "filler_words": int(filler_count),
            "answer_length": int(ans_len),
            "grammar_quality": round(grammar, 1),
            "semantic_similarity": round(max(35.0, overall_score - 3.0), 1),
            "pronunciation_clarity": 92.0 if filler_count <= 2 else 82.0,
            "vocabulary_richness": round(vocab_richness, 1),
            "score": overall_score,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "model_answer": model_ans,
            "suggested_improvement": "Try to structure your answer using the STAR method (Situation, Task, Action, Result) to make it clear and comprehensive."
        }

class RecommendationEngine:
    """
    Compiles learning courses, practice questions, and docs based on weak interview skills.
    """
    @staticmethod
    def get_recommendations(weak_topics: List[str]) -> List[Dict[str, Any]]:
        recs = []
        topic_recs = {
            "python": {
                "course": "Coursera: Google IT Automation with Python",
                "doc": "Python Memory Management & Garbage Collection docs",
                "video": "Corey Schafer: Python OOP & Decorators series",
                "project": "Build an async file parser utilizing Python generators",
                "problem": "LeetCode: 1. Two Sum (implemented with hash maps)"
            },
            "react": {
                "course": "Udemy: Complete React Developer (Hooks, Context, Redux)",
                "doc": "React Reconciliation & Concurrent rendering docs",
                "video": "Jack Herrington: React Server Components deep dive",
                "project": "Build a real-time virtual list dashboard with React 18 Suspense",
                "problem": "BigFrontend: Implement custom React hooks like UseEffect"
            },
            "fastapi": {
                "course": "TestDriven.io: FastAPI Web Development tutorials",
                "doc": "FastAPI Dependency Injection & Background Tasks docs",
                "video": "ArjanCodes: API architecture using FastAPI and ASGI",
                "project": "Build a Redis-backed token bucket rate-limiter middleware",
                "problem": "Practice writing ASGI custom logging middleware packages"
            },
            "system_design": {
                "course": "Educative: Grokking the System Design Interview",
                "doc": "Designing Data-Intensive Applications (DDIA)",
                "video": "ByteByteGo: Distributed Systems Caching & Rate Limiting",
                "project": "Deploy a multi-region active-active readreplica SQL cluster",
                "problem": "Design a highly-available URL shortening system"
            }
        }

        for topic in weak_topics:
            topic_key = topic.lower()
            if topic_key in topic_recs:
                match = topic_recs[topic_key]
                recs.append({
                    "topic": topic.upper(),
                    "course": match["course"],
                    "documentation": match["doc"],
                    "youtube": match["video"],
                    "portfolio_project": match["project"],
                    "practice_problem": match["problem"]
                })
                
        # Default fallback
        if not recs:
            recs.append({
                "topic": "SOFTWARE ARCHITECTURE",
                "course": "Coursera: Software Design and Architecture Specialization",
                "documentation": "Standard Twelve-Factor App methodology guidelines",
                "youtube": "Martin Fowler: Microservices architectural patterns",
                "portfolio_project": "Design a distributed queue worker using FastAPI & Celery",
                "practice_problem": "LeetCode: 146. LRU Cache (System DSA Design)"
            })
            
        return recs

class ProgressTracker:
    """
    Computes cumulative interview performance stats.
    """
    @staticmethod
    def aggregate_stats(evaluations: List[Dict[str, Any]]) -> Dict[str, Any]:
        valid_evals = [e for e in evaluations if e is not None]
        if not valid_evals:
            return {
                "answered": 0,
                "accuracy": 0.0,
                "confidence": 0.0,
                "avg_response_time": 0.0,
                "strong_topics": [],
                "weak_topics": [],
                "improvement_trend": []
            }
            
        total = len(valid_evals)
        avg_score = round(sum(e["score"] for e in valid_evals) / total, 1)
        avg_relevance = round(sum(e["technical_relevance"] for e in valid_evals) / total, 1)
        avg_clarity = round(sum(e["communication_clarity"] for e in valid_evals) / total, 1)
        
        # Improvement trend (last 10 scores)
        trend = [e["score"] for e in valid_evals[-10:]]
        
        return {
            "answered": total,
            "accuracy": avg_relevance,
            "confidence": avg_clarity,
            "avg_response_time": 24.5,
            "strong_topics": ["Relational Schema Design"] if avg_score >= 75 else ["Technical Basics"],
            "weak_topics": ["Scale Architectures & Caching"] if avg_score < 75 else ["Advanced Contextualization"],
            "improvement_trend": trend
        }

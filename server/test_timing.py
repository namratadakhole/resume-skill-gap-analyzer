import time

print("--- STARTING TIMING TEST ---")
t0 = time.time()

# Time NLTK import and download checks
t_start_nlp = time.time()
import nlp
t_end_nlp = time.time()
print(f"[TIMING] import nlp took {t_end_nlp - t_start_nlp:.4f} seconds")

# Time SentenceTransformer loading
t_start_st = time.time()
from sentence_transformers import SentenceTransformer
t_end_st = time.time()
print(f"[TIMING] import sentence_transformers took {t_end_st - t_start_st:.4f} seconds")

t_start_model = time.time()
model = SentenceTransformer('all-MiniLM-L6-v2')
t_end_model = time.time()
print(f"[TIMING] loading all-MiniLM-L6-v2 took {t_end_model - t_start_model:.4f} seconds")

# Time a mock analysis
resume_text = "Experienced software developer skilled in Python, Docker, AWS, React, and PostgreSQL."
job_desc = "Looking for a Python developer with experience in AWS, React, and databases."

t_start_eval = time.time()
embeddings = model.encode([resume_text, job_desc])
import numpy as np
norm1 = np.linalg.norm(embeddings[0])
norm2 = np.linalg.norm(embeddings[1])
sim = np.dot(embeddings[0]/norm1, embeddings[1]/norm2)
t_end_eval = time.time()
print(f"[TIMING] mock semantic similarity calculation took {t_end_eval - t_start_eval:.4f} seconds")

print(f"Total test execution time: {time.time() - t0:.4f} seconds")

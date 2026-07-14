import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Setup NLTK resources on import
def download_nltk_resources():
    """
    Downloads required NLTK resources silently, catching any exceptions.
    Uses a socket timeout to prevent long hangs on network blocks.
    """
    import socket
    old_timeout = socket.getdefaulttimeout()
    try:
        socket.setdefaulttimeout(2.0)
        required_packages = {
            'punkt': 'tokenizers/punkt',
            'stopwords': 'corpora/stopwords',
            'wordnet': 'corpora/wordnet',
            'omw-1.4': 'corpora/omw-1.4'
        }
        
        for package, path in required_packages.items():
            try:
                nltk.data.find(path)
            except (LookupError, AttributeError):
                try:
                    nltk.download(package, quiet=True)
                except Exception as e:
                    print(f"Warning: Failed to download NLTK package '{package}': {str(e)}")
    except Exception as e:
        print(f"Warning: NLTK resources setup encountered error: {str(e)}")
    finally:
        socket.setdefaulttimeout(old_timeout)

# Perform downloading
download_nltk_resources()

def clean_text(text: str) -> str:
    """
    Cleans raw text by lowercasing and removing special characters, keeping alphanumeric and spaces.
    """
    if not text:
        return ""
    # Convert to lowercase
    text = text.lower()
    # Replace newlines/tabs with space
    text = re.sub(r'[\r\n\t]+', ' ', text)
    # Remove special characters except alphanumeric, spaces, and hyphens (helpful for skills like C++, C#, ReactJS)
    text = re.sub(r'[^a-zA-Z0-9\s\+\#\-\.]', ' ', text)
    # Collapse multiple spaces
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def preprocess_text(text: str) -> list:
    """
    Preprocesses text:
    1. Cleans the text
    2. Tokenizes it
    3. Removes stopwords
    4. Lemmatizes terms
    Returns a list of clean tokens.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return []
        
    try:
        tokens = word_tokenize(cleaned)
    except Exception:
        # Fallback to simple split if nltk tokenization fails
        tokens = cleaned.split()
        
    try:
        stop_words = set(stopwords.words('english'))
    except Exception:
        # Minimal fallback stopwords if download failed
        stop_words = {'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should', "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't", 'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"}
        
    try:
        lemmatizer = WordNetLemmatizer()
        processed_tokens = [lemmatizer.lemmatize(token) for token in tokens if token not in stop_words and len(token) > 1]
    except Exception:
        # Fallback without lemmatization
        processed_tokens = [token for token in tokens if token not in stop_words and len(token) > 1]
        
    return processed_tokens

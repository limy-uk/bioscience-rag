import os
import json
import psycopg
import sys
from tqdm import tqdm
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
import torch

os.environ["TOKENIZERS_PARALLELISM"] = "false"
DB_NAME = "postgres" 
DB_USER = "postgres"    
DB_PASSWORD = "password" 
DB_HOST = "localhost"
DB_PORT = 5432

MODEL_ID = "intfloat/multilingual-e5-large"

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
JSON_FILE_PATH = "./nasa_data.json"
BATCH_SIZE = 32

def load_embedding_model(model_id: str) -> SentenceTransformer:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    model = SentenceTransformer(model_id, device=device)
    
    embedding_dim = model.get_sentence_embedding_dimension()
    
    print(f"✅ Model loaded successfully!")
    print(f"   Device: {device}")
    print(f"   Embedding dimensions: {embedding_dim}")
    print(f"   Max sequence length: {model.max_seq_length}")
    
    return model

def create_connection_string() -> str:
    return f"dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} host={DB_HOST} port={DB_PORT}"

def load_json_data(file_path: str) -> list:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"JSON file not found at: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if not isinstance(data, list):
        raise ValueError("JSON file must contain a list of documents (an array) at the top level.")
        
    return data

def prepare_texts_for_e5(texts: list, task_type: str = "passage") -> list:
    if "e5" in MODEL_ID.lower():
        prefix = f"{task_type}: "
        return [prefix + text.strip() for text in texts]
    return texts

def generate_embeddings_batch(model: SentenceTransformer, texts: list) -> list:
    prepared_texts = prepare_texts_for_e5(texts, task_type="passage")
    
    embeddings = model.encode(
        prepared_texts,
        batch_size=BATCH_SIZE,
        show_progress_bar=False,
        normalize_embeddings=True,
        convert_to_tensor=False,
        device=model.device
    )
    
    return embeddings.tolist()

def ingest_documents(model: SentenceTransformer, conn_string: str, documents: list):
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
        length_function=len,
        is_separator_regex=False
    )
    
    print(f"\nFound {len(documents)} documents for ingestion.")
    print(f"Chunk size: {CHUNK_SIZE} chars, Overlap: {CHUNK_OVERLAP} chars\n")

    try:
        with psycopg.connect(conn_string) as conn:
            
            with conn.cursor() as cur:
                total_chunks = 0
                
                for doc_data in tqdm(documents, desc="Processing Documents"):
                    
                    publication_id = doc_data.get("pmc_id", doc_data.get("source_link", "UNKNOWN_ID")) 
                    document_title = doc_data.get("title", "No Title")
                    abstract = doc_data.get("abstract", "")
                    content = doc_data.get("content", "")
                    
                    if not publication_id or not content:
                        tqdm.write(f"Skipping document (ID: {publication_id}): Missing PMC ID or content.")
                        continue
                    
                    full_text_to_chunk = f"Title: {document_title}\n\nAbstract: {abstract}\n\nContent: {content}"
                    
                    tqdm.write(f"--- Document: {publication_id} ---")

                    try:
                        chunks = text_splitter.split_text(full_text_to_chunk)
                        
                        tqdm.write(f"-> Chunked into {len(chunks)} segments. Generating embeddings...")
                        
                        embeddings = generate_embeddings_batch(model, chunks)
                        
                        tqdm.write(f"-> ✅ Embeddings generated successfully.")

                        insert_query = """
                        INSERT INTO documents (publication_id, title, chunk_text, chunk_metadata, embedding)
                        VALUES (%s, %s, %s, %s, %s);
                        """
                        
                        insert_data = []
                        base_metadata = {
                            "source_pmc_id": publication_id,
                            "citation": doc_data.get("citation"),
                            "source_link": doc_data.get("source_link"),
                            "full_abstract": abstract,
                            "word_count": doc_data.get("word_count"),
                            "char_count": doc_data.get("char_count"),
                            "embedding_model": MODEL_ID,
                            "embedding_dimensions": model.get_sentence_embedding_dimension()
                        }

                        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                            chunk_metadata = base_metadata.copy()
                            chunk_metadata["chunk_index"] = i
                            chunk_metadata["chunk_length"] = len(chunk)
                            
                            insert_data.append((
                                publication_id,    
                                document_title,    
                                chunk,             
                                json.dumps(chunk_metadata), 
                                embedding          
                            ))
                        
                        cur.executemany(insert_query, insert_data)
                        
                        tqdm.write(f"-> Batch execution successful. ({len(insert_data)} records prepared)")

                        conn.commit()
                        total_chunks += len(insert_data)
                        tqdm.write(f"-> ✅ COMMITTED. {len(insert_data)} chunks saved. Total: {total_chunks}")
                    
                    except psycopg.Error as e:
                        conn.rollback() 
                        tqdm.write(f"\n[DB ERROR] Failed to insert/commit document {publication_id}: {e}")
                    
                    except Exception as e:
                        tqdm.write(f"\n[PROC ERROR] General error processing document {publication_id}: {e}")
                        
            print("\n" + "="*60)
            print(f"✅ FINAL INGESTION COMPLETE")
            print(f"   Total committed chunks: {total_chunks}")
            print(f"   Model used: {MODEL_ID}")
            print("="*60)

    except psycopg.Error as e:
        print(f"\n[CRITICAL DB CONNECTION ERROR]: {e}")
        print("Please check your DB_HOST, DB_PORT, and credentials. Is the PostgreSQL server running?")
    except Exception as e:
        print(f"\n[CRITICAL SCRIPT ERROR]: {e}")


if __name__ == "__main__":
    try:
        embedding_model = load_embedding_model(MODEL_ID)
        all_documents = load_json_data(JSON_FILE_PATH)
        conn_str = create_connection_string()
        ingest_documents(embedding_model, conn_str, all_documents)
        
    except FileNotFoundError as e:
        print(f"\n❌ {e}")
    except Exception as e:
        print(f"\n❌ [CRITICAL SCRIPT INITIALIZATION ERROR]: {e}")
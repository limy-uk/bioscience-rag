import os
import torch
import psycopg
from sentence_transformers import SentenceTransformer
from typing import List, Dict

os.environ["TOKENIZERS_PARALLELISM"] = "false"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = "password"
DB_HOST = "localhost"
DB_PORT = 5432
MODEL_ID = "intfloat/multilingual-e5-large"

def create_connection_string() -> str:
    return f"dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} host={DB_HOST} port={DB_PORT}"

def load_embedding_model(model_id: str) -> SentenceTransformer:
    print(f"Loading embedding model: {model_id}...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = SentenceTransformer(model_id, device=device)
    print(f"✅ Model loaded successfully on device: {device}")
    print(f"   Embedding dimensions: {model.get_sentence_embedding_dimension()}")
    return model

def retrieve_similar_vectors(
    model: SentenceTransformer,
    conn_string: str,
    query_text: str,
    k: int = 5
) -> List[Dict]:
    print(f"\n{'='*80}")
    print(f"🔍 Starting Retrieval")
    print(f"   Query: '{query_text[:70]}...'")
    print(f"   Top K: {k}")
    print(f"{'='*80}\n")

    query_with_prefix = f"query: {query_text}" if "e5" in MODEL_ID.lower() else query_text
    
    query_embedding = model.encode(
        query_with_prefix,
        normalize_embeddings=True,
        convert_to_tensor=False,
        device=model.device
    ).tolist()
    
    print(f"✅ Query embedded successfully (Vector dimension: {len(query_embedding)})")

    query_vector_literal = '[' + ','.join(map(str, query_embedding)) + ']'

    retrieval_query = f"""
    SELECT
        1 - (embedding <=> '{query_vector_literal}'::vector) AS similarity_score,
        chunk_text,
        title,
        publication_id,
        chunk_metadata
    FROM
        documents
    ORDER BY
        embedding <=> '{query_vector_literal}'::vector
    LIMIT {k};
    """
    
    print(f"🎯 Searching for top {k} similar chunks...\n")

    results = []
    try:
        with psycopg.connect(conn_string) as conn:
            with conn.cursor() as cur:
                cur.execute(retrieval_query)
                rows = cur.fetchall()
                column_names = [desc[0] for desc in cur.description]

                for row in rows:
                    result = dict(zip(column_names, row))
                    results.append(result)
        
        print(f"✅ Found {len(results)} results.\n")
        return results

    except psycopg.Error as e:
        print(f"\n❌ [DB ERROR] Failed to execute retrieval query: {e}")
        return []
    except Exception as e:
        print(f"\n❌ [ERROR] An unexpected error occurred: {e}")
        return []


def print_results(results: List[Dict]):
    if not results:
        print("❌ No matching documents found.")
        return

    print(f"{'='*80}")
    print(f"📊 SEARCH RESULTS")
    print(f"{'='*80}\n")

    for i, res in enumerate(results, 1):
        print(f"{'─'*80}")
        print(f"RESULT #{i}")
        print(f"  ↪ Similarity Score: {res['similarity_score']:.4f} (Max is 1.0)")
        print(f"  ↪ Title: {res['title']}")
        print(f"  ↪ Source ID: {res['publication_id']}")
        
        metadata = res.get('chunk_metadata', {})
        if isinstance(metadata, dict):
            chunk_idx = metadata.get('chunk_index', 'N/A')
            print(f"  ↪ Chunk Index: {chunk_idx}")
        
        print(f"\n📄 [CHUNK CONTENT]")
        chunk_preview = res['chunk_text'].strip()
        if len(chunk_preview) > 500:
            chunk_preview = chunk_preview[:500] + "..."
        print(f"{chunk_preview}\n")


if __name__ == "__main__":
    try:
        print("\n" + "="*80)
        print("🚀 VECTOR SIMILARITY SEARCH")
        print("="*80 + "\n")
        
        model = load_embedding_model(MODEL_ID)
        conn_str = create_connection_string()

        query = "Spaceflight plant growth gene expression"
        top_k = 5

        results = retrieve_similar_vectors(model, conn_str, query, top_k)

        print_results(results)

    except Exception as e:
        print(f"\n❌ [CRITICAL SCRIPT ERROR]: {e}")

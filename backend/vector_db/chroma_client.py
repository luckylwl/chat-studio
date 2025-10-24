"""
ChromaDB Vector Database Client
Provides semantic search and RAG (Retrieval-Augmented Generation) capabilities
"""

import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
from typing import List, Dict, Any, Optional, Tuple
import logging
import os
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

# Configuration
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma")
CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8000"))
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
USE_REMOTE_CHROMA = os.getenv("USE_REMOTE_CHROMA", "false").lower() == "true"


class ChromaVectorDB:
    """
    ChromaDB vector database client

    Features:
    - Document storage with embeddings
    - Semantic similarity search
    - Metadata filtering
    - Collection management
    - RAG support
    """

    def __init__(
        self,
        collection_name: str = "conversations",
        embedding_model: str = EMBEDDING_MODEL
    ):
        """
        Initialize ChromaDB client

        Args:
            collection_name: Default collection name
            embedding_model: Sentence transformer model for embeddings
        """
        self.collection_name = collection_name
        self.client: Optional[chromadb.Client] = None
        self.collection: Optional[chromadb.Collection] = None

        # Initialize embedding function
        self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=embedding_model
        )

    def initialize(self):
        """Initialize ChromaDB client and collection"""
        try:
            if USE_REMOTE_CHROMA:
                # Connect to remote ChromaDB server
                self.client = chromadb.HttpClient(
                    host=CHROMA_HOST,
                    port=CHROMA_PORT
                )
                logger.info(f"Connected to remote ChromaDB at {CHROMA_HOST}:{CHROMA_PORT}")
            else:
                # Use local persistent ChromaDB
                self.client = chromadb.PersistentClient(
                    path=CHROMA_PERSIST_DIR,
                    settings=Settings(
                        anonymized_telemetry=False,
                        allow_reset=True
                    )
                )
                logger.info(f"Initialized local ChromaDB at {CHROMA_PERSIST_DIR}")

            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                embedding_function=self.embedding_function,
                metadata={"description": "AI Chat Studio conversation vectors"}
            )

            logger.info(f"Collection '{self.collection_name}' ready")

        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            raise

    def add_documents(
        self,
        documents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None
    ) -> List[str]:
        """
        Add documents to collection

        Args:
            documents: List of document texts
            metadatas: Optional list of metadata dicts
            ids: Optional list of document IDs

        Returns:
            List of document IDs
        """
        if not self.collection:
            raise RuntimeError("ChromaDB not initialized")

        # Generate IDs if not provided
        if ids is None:
            ids = [str(uuid.uuid4()) for _ in documents]

        # Add timestamp to metadata
        if metadatas:
            for metadata in metadatas:
                metadata["indexed_at"] = datetime.utcnow().isoformat()
        else:
            metadatas = [
                {"indexed_at": datetime.utcnow().isoformat()}
                for _ in documents
            ]

        try:
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )

            logger.info(f"Added {len(documents)} documents to '{self.collection_name}'")
            return ids

        except Exception as e:
            logger.error(f"Failed to add documents: {e}")
            raise

    def add_message(
        self,
        message_id: str,
        content: str,
        conversation_id: str,
        user_id: str,
        role: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Add chat message to vector database

        Args:
            message_id: Message ID
            content: Message content
            conversation_id: Conversation ID
            user_id: User ID
            role: Message role (user/assistant/system)
            metadata: Additional metadata

        Returns:
            Document ID
        """
        base_metadata = {
            "message_id": message_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": role,
            "type": "message"
        }

        if metadata:
            base_metadata.update(metadata)

        return self.add_documents(
            documents=[content],
            metadatas=[base_metadata],
            ids=[message_id]
        )[0]

    def add_conversation(
        self,
        conversation_id: str,
        messages: List[Dict[str, Any]],
        user_id: str,
        title: Optional[str] = None
    ) -> List[str]:
        """
        Add entire conversation to vector database

        Args:
            conversation_id: Conversation ID
            messages: List of message dictionaries
            user_id: User ID
            title: Conversation title

        Returns:
            List of document IDs
        """
        documents = []
        metadatas = []
        ids = []

        for message in messages:
            message_id = message.get("id", str(uuid.uuid4()))
            content = message.get("content", "")
            role = message.get("role", "user")

            if not content:
                continue

            documents.append(content)
            metadatas.append({
                "message_id": message_id,
                "conversation_id": conversation_id,
                "user_id": user_id,
                "role": role,
                "title": title or "Untitled",
                "type": "message"
            })
            ids.append(message_id)

        if documents:
            return self.add_documents(documents, metadatas, ids)

        return []

    def search(
        self,
        query: str,
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None,
        where_document: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Semantic search for similar documents

        Args:
            query: Search query
            n_results: Number of results to return
            where: Metadata filter
            where_document: Document content filter

        Returns:
            Search results dictionary
        """
        if not self.collection:
            raise RuntimeError("ChromaDB not initialized")

        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where,
                where_document=where_document
            )

            return {
                "ids": results["ids"][0] if results["ids"] else [],
                "documents": results["documents"][0] if results["documents"] else [],
                "metadatas": results["metadatas"][0] if results["metadatas"] else [],
                "distances": results["distances"][0] if results["distances"] else [],
            }

        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise

    def search_by_conversation(
        self,
        query: str,
        conversation_id: str,
        n_results: int = 5
    ) -> Dict[str, Any]:
        """
        Search within specific conversation

        Args:
            query: Search query
            conversation_id: Conversation ID to search within
            n_results: Number of results

        Returns:
            Search results
        """
        return self.search(
            query=query,
            n_results=n_results,
            where={"conversation_id": conversation_id}
        )

    def search_by_user(
        self,
        query: str,
        user_id: str,
        n_results: int = 10
    ) -> Dict[str, Any]:
        """
        Search across all conversations for a user

        Args:
            query: Search query
            user_id: User ID
            n_results: Number of results

        Returns:
            Search results
        """
        return self.search(
            query=query,
            n_results=n_results,
            where={"user_id": user_id}
        )

    def find_similar_messages(
        self,
        message_content: str,
        user_id: str,
        n_results: int = 5,
        exclude_conversation: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Find similar messages across user's conversations

        Args:
            message_content: Message to find similar messages for
            user_id: User ID
            n_results: Number of similar messages
            exclude_conversation: Conversation ID to exclude

        Returns:
            Similar messages
        """
        where = {"user_id": user_id}

        # Can't exclude conversation with ChromaDB where clause directly
        # Would need to filter results after retrieval

        results = self.search(
            query=message_content,
            n_results=n_results * 2,  # Get more to account for filtering
            where=where
        )

        # Filter out excluded conversation if specified
        if exclude_conversation:
            filtered_results = {
                "ids": [],
                "documents": [],
                "metadatas": [],
                "distances": []
            }

            for i, metadata in enumerate(results["metadatas"]):
                if metadata.get("conversation_id") != exclude_conversation:
                    filtered_results["ids"].append(results["ids"][i])
                    filtered_results["documents"].append(results["documents"][i])
                    filtered_results["metadatas"].append(results["metadatas"][i])
                    filtered_results["distances"].append(results["distances"][i])

                    if len(filtered_results["ids"]) >= n_results:
                        break

            return filtered_results

        return results

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Get specific document by ID

        Args:
            doc_id: Document ID

        Returns:
            Document data or None
        """
        if not self.collection:
            raise RuntimeError("ChromaDB not initialized")

        try:
            results = self.collection.get(ids=[doc_id])

            if results["ids"]:
                return {
                    "id": results["ids"][0],
                    "document": results["documents"][0] if results["documents"] else None,
                    "metadata": results["metadatas"][0] if results["metadatas"] else None,
                }

            return None

        except Exception as e:
            logger.error(f"Failed to get document: {e}")
            return None

    def delete_document(self, doc_id: str) -> bool:
        """
        Delete document by ID

        Args:
            doc_id: Document ID

        Returns:
            True if deleted successfully
        """
        if not self.collection:
            raise RuntimeError("ChromaDB not initialized")

        try:
            self.collection.delete(ids=[doc_id])
            logger.info(f"Deleted document: {doc_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete document: {e}")
            return False

    def delete_conversation(self, conversation_id: str) -> int:
        """
        Delete all documents for a conversation

        Args:
            conversation_id: Conversation ID

        Returns:
            Number of documents deleted
        """
        if not self.collection:
            raise RuntimeError("ChromaDB not initialized")

        try:
            self.collection.delete(
                where={"conversation_id": conversation_id}
            )
            logger.info(f"Deleted conversation: {conversation_id}")
            return 1  # ChromaDB doesn't return count

        except Exception as e:
            logger.error(f"Failed to delete conversation: {e}")
            return 0

    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get collection statistics

        Returns:
            Statistics dictionary
        """
        if not self.collection:
            raise RuntimeError("ChromaDB not initialized")

        try:
            count = self.collection.count()

            return {
                "name": self.collection_name,
                "count": count,
                "embedding_model": EMBEDDING_MODEL
            }

        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {"error": str(e)}

    def reset_collection(self):
        """Reset (clear) the collection"""
        if not self.client:
            raise RuntimeError("ChromaDB not initialized")

        try:
            self.client.delete_collection(name=self.collection_name)
            self.collection = self.client.create_collection(
                name=self.collection_name,
                embedding_function=self.embedding_function
            )
            logger.warning(f"Collection '{self.collection_name}' reset")

        except Exception as e:
            logger.error(f"Failed to reset collection: {e}")
            raise

    def health_check(self) -> bool:
        """
        Check if ChromaDB is healthy

        Returns:
            True if healthy
        """
        try:
            if not self.client:
                return False

            # Try to get collection count
            if self.collection:
                self.collection.count()

            return True

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Global ChromaDB client instance
chroma_client = ChromaVectorDB()

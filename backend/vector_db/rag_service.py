"""
RAG (Retrieval-Augmented Generation) Service
Combines vector database retrieval with AI generation
"""

from typing import List, Dict, Any, Optional
import logging
from .chroma_client import chroma_client

logger = logging.getLogger(__name__)


class RAGService:
    """
    RAG service for context-aware AI responses

    Features:
    - Context retrieval from conversation history
    - Relevant document injection
    - Cross-conversation context
    - Knowledge base integration
    """

    def __init__(self, vector_db=None):
        """
        Initialize RAG service

        Args:
            vector_db: Vector database client (defaults to global chroma_client)
        """
        self.vector_db = vector_db or chroma_client

    async def retrieve_context(
        self,
        query: str,
        user_id: str,
        conversation_id: Optional[str] = None,
        n_results: int = 5,
        include_cross_conversation: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant context for query

        Args:
            query: User query
            user_id: User ID
            conversation_id: Current conversation ID
            n_results: Number of context pieces to retrieve
            include_cross_conversation: Include results from other conversations

        Returns:
            List of context documents with metadata
        """
        contexts = []

        try:
            # Search within current conversation if specified
            if conversation_id:
                conv_results = self.vector_db.search_by_conversation(
                    query=query,
                    conversation_id=conversation_id,
                    n_results=min(n_results, 3)
                )

                contexts.extend(self._format_results(conv_results))

            # Search across user's conversations if enabled
            if include_cross_conversation:
                cross_results = self.vector_db.find_similar_messages(
                    message_content=query,
                    user_id=user_id,
                    n_results=n_results - len(contexts),
                    exclude_conversation=conversation_id
                )

                contexts.extend(self._format_results(cross_results))

            # Sort by relevance (distance)
            contexts.sort(key=lambda x: x.get("distance", 1.0))

            return contexts[:n_results]

        except Exception as e:
            logger.error(f"Failed to retrieve context: {e}")
            return []

    def _format_results(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Format search results into context documents

        Args:
            results: Raw search results from vector DB

        Returns:
            Formatted context documents
        """
        contexts = []

        for i in range(len(results.get("ids", []))):
            context = {
                "id": results["ids"][i],
                "content": results["documents"][i],
                "metadata": results["metadatas"][i],
                "distance": results["distances"][i],
                "relevance_score": 1.0 - results["distances"][i]  # Convert distance to score
            }
            contexts.append(context)

        return contexts

    async def build_augmented_prompt(
        self,
        user_message: str,
        user_id: str,
        conversation_id: Optional[str] = None,
        system_prompt: Optional[str] = None,
        max_context_length: int = 2000
    ) -> Dict[str, Any]:
        """
        Build augmented prompt with retrieved context

        Args:
            user_message: User's message
            user_id: User ID
            conversation_id: Conversation ID
            system_prompt: System prompt
            max_context_length: Maximum context length in characters

        Returns:
            Dictionary with augmented prompt and metadata
        """
        # Retrieve relevant context
        contexts = await self.retrieve_context(
            query=user_message,
            user_id=user_id,
            conversation_id=conversation_id,
            n_results=5
        )

        # Build context string
        context_parts = []
        current_length = 0

        for ctx in contexts:
            content = ctx["content"]
            metadata = ctx["metadata"]

            # Format context piece
            context_piece = f"[From {metadata.get('role', 'unknown')}]: {content}"

            # Check if adding this would exceed limit
            if current_length + len(context_piece) > max_context_length:
                break

            context_parts.append(context_piece)
            current_length += len(context_piece)

        # Build augmented system prompt
        if context_parts:
            context_str = "\n\n".join(context_parts)
            augmented_system = (
                f"{system_prompt}\n\n"
                f"### Relevant Context\n"
                f"Here is relevant context from previous conversations:\n\n"
                f"{context_str}\n\n"
                f"Use this context to provide a more informed and consistent response."
            )
        else:
            augmented_system = system_prompt

        return {
            "system_prompt": augmented_system,
            "user_message": user_message,
            "contexts_used": len(context_parts),
            "contexts": contexts[:len(context_parts)]
        }

    async def find_related_conversations(
        self,
        query: str,
        user_id: str,
        n_results: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find conversations related to query

        Args:
            query: Search query
            user_id: User ID
            n_results: Number of conversations to return

        Returns:
            List of related conversation IDs with metadata
        """
        try:
            results = self.vector_db.search_by_user(
                query=query,
                user_id=user_id,
                n_results=n_results * 3  # Get more for aggregation
            )

            # Group by conversation
            conversation_map: Dict[str, Dict[str, Any]] = {}

            for i in range(len(results.get("ids", []))):
                metadata = results["metadatas"][i]
                conv_id = metadata.get("conversation_id")

                if conv_id not in conversation_map:
                    conversation_map[conv_id] = {
                        "conversation_id": conv_id,
                        "title": metadata.get("title", "Untitled"),
                        "matches": 0,
                        "total_relevance": 0.0,
                        "best_match": None
                    }

                relevance = 1.0 - results["distances"][i]
                conversation_map[conv_id]["matches"] += 1
                conversation_map[conv_id]["total_relevance"] += relevance

                if (not conversation_map[conv_id]["best_match"] or
                    relevance > conversation_map[conv_id]["best_match"]["relevance"]):
                    conversation_map[conv_id]["best_match"] = {
                        "content": results["documents"][i],
                        "relevance": relevance
                    }

            # Sort by total relevance
            conversations = sorted(
                conversation_map.values(),
                key=lambda x: x["total_relevance"],
                reverse=True
            )

            return conversations[:n_results]

        except Exception as e:
            logger.error(f"Failed to find related conversations: {e}")
            return []

    async def suggest_followup_questions(
        self,
        conversation_id: str,
        user_id: str,
        n_suggestions: int = 3
    ) -> List[str]:
        """
        Suggest follow-up questions based on conversation context

        Args:
            conversation_id: Conversation ID
            user_id: User ID
            n_suggestions: Number of suggestions

        Returns:
            List of suggested questions
        """
        # In a real implementation, this would:
        # 1. Analyze conversation flow
        # 2. Find similar conversation patterns
        # 3. Generate contextual questions

        # Placeholder implementation
        suggestions = [
            "Can you explain that in more detail?",
            "What are the alternatives?",
            "How can I apply this?"
        ]

        return suggestions[:n_suggestions]

    async def get_conversation_summary(
        self,
        conversation_id: str,
        max_length: int = 500
    ) -> Optional[str]:
        """
        Generate conversation summary using vector search

        Args:
            conversation_id: Conversation ID
            max_length: Maximum summary length

        Returns:
            Conversation summary
        """
        try:
            # Get representative messages from conversation
            results = self.vector_db.search_by_conversation(
                query="summary main points topics discussed",
                conversation_id=conversation_id,
                n_results=5
            )

            if not results["documents"]:
                return None

            # Combine top messages as summary
            summary_parts = []
            current_length = 0

            for doc in results["documents"]:
                if current_length + len(doc) > max_length:
                    break
                summary_parts.append(doc[:200])  # Truncate each to 200 chars
                current_length += len(summary_parts[-1])

            summary = " [...] ".join(summary_parts)
            return summary

        except Exception as e:
            logger.error(f"Failed to generate summary: {e}")
            return None

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get RAG service statistics

        Returns:
            Statistics dictionary
        """
        return {
            "vector_db_stats": self.vector_db.get_collection_stats(),
            "vector_db_healthy": self.vector_db.health_check()
        }


# Global RAG service instance
rag_service = RAGService()

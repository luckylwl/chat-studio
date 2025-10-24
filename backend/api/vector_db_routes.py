"""
API Routes for Vector Database and RAG
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel

from backend.vector_db.chroma_client import chroma_client
from backend.vector_db.rag_service import rag_service

router = APIRouter(prefix="/api/vector", tags=["vector-db"])


# Request Models
class DocumentAdd(BaseModel):
    documents: List[str]
    metadatas: Optional[List[dict]] = None
    ids: Optional[List[str]] = None


class MessageAdd(BaseModel):
    message_id: str
    content: str
    conversation_id: str
    user_id: str
    role: str
    metadata: Optional[dict] = None


class ConversationAdd(BaseModel):
    conversation_id: str
    messages: List[dict]
    user_id: str
    title: Optional[str] = None


class SearchRequest(BaseModel):
    query: str
    n_results: int = 5
    where: Optional[dict] = None


class RAGRequest(BaseModel):
    user_message: str
    user_id: str
    conversation_id: Optional[str] = None
    system_prompt: Optional[str] = None
    max_context_length: int = 2000


# Vector DB Routes
@router.post("/documents")
async def add_documents(request: DocumentAdd):
    """
    Add documents to vector database

    Args:
        request: Documents with optional metadata and IDs

    Returns:
        Document IDs
    """
    try:
        ids = chroma_client.add_documents(
            documents=request.documents,
            metadatas=request.metadatas,
            ids=request.ids
        )

        return {
            "success": True,
            "ids": ids,
            "count": len(ids)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages")
async def add_message(request: MessageAdd):
    """
    Add single message to vector database

    Args:
        request: Message data

    Returns:
        Document ID
    """
    try:
        doc_id = chroma_client.add_message(
            message_id=request.message_id,
            content=request.content,
            conversation_id=request.conversation_id,
            user_id=request.user_id,
            role=request.role,
            metadata=request.metadata
        )

        return {
            "success": True,
            "id": doc_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations")
async def add_conversation(request: ConversationAdd):
    """
    Add entire conversation to vector database

    Args:
        request: Conversation data

    Returns:
        List of document IDs
    """
    try:
        ids = chroma_client.add_conversation(
            conversation_id=request.conversation_id,
            messages=request.messages,
            user_id=request.user_id,
            title=request.title
        )

        return {
            "success": True,
            "ids": ids,
            "count": len(ids)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def search_documents(request: SearchRequest):
    """
    Search for similar documents

    Args:
        request: Search parameters

    Returns:
        Search results
    """
    try:
        results = chroma_client.search(
            query=request.query,
            n_results=request.n_results,
            where=request.where
        )

        return {
            "success": True,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search/conversation/{conversation_id}")
async def search_conversation(
    conversation_id: str,
    query: str = Query(..., description="Search query"),
    n_results: int = Query(5, description="Number of results")
):
    """
    Search within specific conversation

    Args:
        conversation_id: Conversation ID
        query: Search query
        n_results: Number of results

    Returns:
        Search results
    """
    try:
        results = chroma_client.search_by_conversation(
            query=query,
            conversation_id=conversation_id,
            n_results=n_results
        )

        return {
            "success": True,
            "conversation_id": conversation_id,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search/user/{user_id}")
async def search_user_conversations(
    user_id: str,
    query: str = Query(..., description="Search query"),
    n_results: int = Query(10, description="Number of results")
):
    """
    Search across user's conversations

    Args:
        user_id: User ID
        query: Search query
        n_results: Number of results

    Returns:
        Search results
    """
    try:
        results = chroma_client.search_by_user(
            query=query,
            user_id=user_id,
            n_results=n_results
        )

        return {
            "success": True,
            "user_id": user_id,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/{doc_id}")
async def get_document(doc_id: str):
    """
    Get specific document

    Args:
        doc_id: Document ID

    Returns:
        Document data
    """
    try:
        doc = chroma_client.get_document(doc_id)

        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        return {
            "success": True,
            "document": doc
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """
    Delete document

    Args:
        doc_id: Document ID

    Returns:
        Success message
    """
    try:
        success = chroma_client.delete_document(doc_id)

        if not success:
            raise HTTPException(status_code=404, detail="Document not found")

        return {
            "success": True,
            "message": f"Document {doc_id} deleted"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """
    Delete all documents for conversation

    Args:
        conversation_id: Conversation ID

    Returns:
        Number of documents deleted
    """
    try:
        count = chroma_client.delete_conversation(conversation_id)

        return {
            "success": True,
            "conversation_id": conversation_id,
            "deleted_count": count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# RAG Routes
@router.post("/rag/augment")
async def augment_prompt(request: RAGRequest):
    """
    Build RAG-augmented prompt with context

    Args:
        request: RAG request parameters

    Returns:
        Augmented prompt with context
    """
    try:
        result = await rag_service.build_augmented_prompt(
            user_message=request.user_message,
            user_id=request.user_id,
            conversation_id=request.conversation_id,
            system_prompt=request.system_prompt,
            max_context_length=request.max_context_length
        )

        return {
            "success": True,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rag/related-conversations")
async def find_related_conversations(
    query: str = Query(..., description="Search query"),
    user_id: str = Query(..., description="User ID"),
    n_results: int = Query(5, description="Number of results")
):
    """
    Find conversations related to query

    Args:
        query: Search query
        user_id: User ID
        n_results: Number of results

    Returns:
        Related conversations
    """
    try:
        conversations = await rag_service.find_related_conversations(
            query=query,
            user_id=user_id,
            n_results=n_results
        )

        return {
            "success": True,
            "conversations": conversations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rag/summary/{conversation_id}")
async def get_conversation_summary(
    conversation_id: str,
    max_length: int = Query(500, description="Maximum summary length")
):
    """
    Generate conversation summary

    Args:
        conversation_id: Conversation ID
        max_length: Maximum summary length

    Returns:
        Conversation summary
    """
    try:
        summary = await rag_service.get_conversation_summary(
            conversation_id=conversation_id,
            max_length=max_length
        )

        if not summary:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return {
            "success": True,
            "conversation_id": conversation_id,
            "summary": summary
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Statistics and Health
@router.get("/stats")
async def get_vector_db_stats():
    """
    Get vector database statistics

    Returns:
        Statistics
    """
    try:
        stats = chroma_client.get_collection_stats()

        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def vector_db_health():
    """
    Check vector database health

    Returns:
        Health status
    """
    try:
        healthy = chroma_client.health_check()

        return {
            "success": True,
            "healthy": healthy,
            "stats": chroma_client.get_collection_stats() if healthy else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rag/stats")
async def get_rag_stats():
    """
    Get RAG service statistics

    Returns:
        RAG statistics
    """
    try:
        stats = rag_service.get_statistics()

        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

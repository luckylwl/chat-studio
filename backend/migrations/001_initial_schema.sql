-- Initial Database Schema for AI Chat Studio
-- PostgreSQL Migration Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),

    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,

    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index on email and username for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title VARCHAR(500) NOT NULL DEFAULT 'New Conversation',
    model VARCHAR(100) NOT NULL DEFAULT 'gpt-3.5-turbo',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    message_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,

    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for conversations
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    token_count INTEGER DEFAULT 0,
    model VARCHAR(100)
);

-- Create indexes for messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- API Keys table (for storing encrypted API keys)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    provider VARCHAR(50) NOT NULL,  -- 'openai', 'anthropic', 'google'
    encrypted_key TEXT NOT NULL,
    key_hash VARCHAR(64) NOT NULL,  -- SHA256 hash for validation

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,

    UNIQUE(user_id, provider)
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for conversations table
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update message count in conversations
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE conversations
        SET message_count = message_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.conversation_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE conversations
        SET message_count = GREATEST(message_count - 1, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.conversation_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for message count
CREATE TRIGGER update_message_count
    AFTER INSERT OR DELETE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_message_count();

-- Create views for analytics
CREATE OR REPLACE VIEW user_statistics AS
SELECT
    u.id,
    u.username,
    u.email,
    COUNT(DISTINCT c.id) as total_conversations,
    COUNT(m.id) as total_messages,
    SUM(c.total_tokens) as total_tokens_used,
    MAX(c.updated_at) as last_activity
FROM users u
LEFT JOIN conversations c ON u.id = c.user_id
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY u.id, u.username, u.email;

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts and authentication';
COMMENT ON TABLE conversations IS 'Chat conversations with AI models';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE api_keys IS 'Encrypted API keys for various AI providers';

COMMENT ON COLUMN users.hashed_password IS 'Password hashed with bcrypt';
COMMENT ON COLUMN api_keys.encrypted_key IS 'AES encrypted API key';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA256 hash for quick validation';

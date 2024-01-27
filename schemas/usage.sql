-- Modification de la table usage pour utiliser directement la clé API comme référence
CREATE TABLE usage (
                       usage_id SERIAL PRIMARY KEY,
                       api_key VARCHAR(255) NOT NULL,
                       endpoint VARCHAR(255) NOT NULL,
                       timestamp TIMESTAMPTZ NOT NULL,
                       count INTEGER NOT NULL
);

CREATE INDEX idx_usage_endpoint ON usage(endpoint);

CREATE INDEX idx_usage_timestamp ON usage(timestamp);
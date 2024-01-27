-- Création de la table api_key
CREATE TABLE api_key (
                         key VARCHAR(255) PRIMARY KEY,
                         status VARCHAR(255) NOT NULL, -- Statut de la clé API : actif, résilié, etc.
                         machine_id VARCHAR(255) NOT NULL, -- Identifiant de la machine
                         user_id INTEGER NOT NULL
);


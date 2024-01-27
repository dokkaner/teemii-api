-- Création de la table rate_plan
CREATE TABLE rate_plan (
                           rate_plan_id SERIAL PRIMARY KEY,
                           name VARCHAR(255) NOT NULL,
                           rate_limit_months INTEGER NOT NULL
);

-- Création d'un index sur la colonne name (si nécessaire pour les requêtes de recherche)
CREATE INDEX idx_rate_plan_name ON rate_plan(name);

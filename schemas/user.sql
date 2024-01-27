-- Création de la table user
CREATE TABLE "user" (
                        user_id SERIAL PRIMARY KEY,
                        username VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NOT NULL,
                        rate_plan_id INTEGER,
                        password_hash VARCHAR(255),            -- Colonne pour le hash du mot de passe
                        password_salt VARCHAR(255),            -- Colonne pour la sel du mot de passe
                        sso_enabled BOOLEAN DEFAULT false,     -- Authentification unique activée ou désactivée
                        two_factor_enabled BOOLEAN DEFAULT false, -- Double authentification activée ou désactivée
                        two_factor_secret_key VARCHAR(255)
);

CREATE INDEX idx_user_username ON "user"(username);


CREATE INDEX idx_user_rate_plan_id ON "user"(rate_plan_id);

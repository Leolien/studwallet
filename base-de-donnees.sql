-- Table des transactions
create table transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  montant numeric(10,2) not null check (montant > 0),
  categorie text not null,
  date date not null,
  libelle text not null,
  type text not null check (type in ('revenu', 'depense'))
);

-- Table des plafonds
create table plafonds (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  categorie text not null,
  montant_max_semaine numeric(10,2) check (montant_max_semaine >= 0),
  montant_max_mois numeric(10,2) check (montant_max_mois >= 0),
  unique (user_id, categorie)
);

-- Règles pour la table transactions
create policy "Lire ses transactions"
  on transactions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Ajouter ses transactions"
  on transactions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Modifier ses transactions"
  on transactions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Supprimer ses transactions"
  on transactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- Règles pour la table plafonds
create policy "Lire ses plafonds"
  on plafonds for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Ajouter ses plafonds"
  on plafonds for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Modifier ses plafonds"
  on plafonds for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Supprimer ses plafonds"
  on plafonds for delete
  to authenticated
  using (auth.uid() = user_id);

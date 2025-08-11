# 🔧 Configuration Supabase pour le système multi-villes

## 📋 **Tables à modifier**

Votre application utilise maintenant un système de villes pour séparer les données. Voici les modifications nécessaires dans Supabase :

### **1. Accéder à Supabase**
- Allez sur [supabase.com](https://supabase.com)
- Connectez-vous et sélectionnez votre projet
- Cliquez sur **"SQL Editor"** dans le menu de gauche

### **2. Exécuter le script SQL**

Copiez et exécutez ce script complet :

```sql
-- ========================================
-- AJOUT DES COLONNES CITY À TOUTES LES TABLES
-- ========================================

-- 1. Table profiles (utilisateurs)
ALTER TABLE profiles ADD COLUMN city TEXT;

-- 2. Table announcements (annonces)
ALTER TABLE announcements ADD COLUMN city TEXT;

-- 3. Table comments (évaluations)
ALTER TABLE comments ADD COLUMN city TEXT;

-- 4. Table chats (conversations)
ALTER TABLE chats ADD COLUMN city TEXT;

-- 5. Table messages (messages)
ALTER TABLE messages ADD COLUMN city TEXT;

-- ========================================
-- CRÉATION DES INDEX POUR LES PERFORMANCES
-- ========================================

CREATE INDEX idx_profiles_city ON profiles(city);
CREATE INDEX idx_announcements_city ON announcements(city);
CREATE INDEX idx_comments_city ON comments(city);
CREATE INDEX idx_chats_city ON chats(city);
CREATE INDEX idx_messages_city ON messages(city);

-- ========================================
-- MISE À JOUR DES DONNÉES EXISTANTES (OPTIONNEL)
-- ========================================

-- Si vous avez des données existantes, assignez une ville par défaut
UPDATE profiles SET city = 'İzmir' WHERE city IS NULL;
UPDATE announcements SET city = 'İzmir' WHERE city IS NULL;
UPDATE comments SET city = 'İzmir' WHERE city IS NULL;
UPDATE chats SET city = 'İzmir' WHERE city IS NULL;
UPDATE messages SET city = 'İzmir' WHERE city IS NULL;
```

### **3. Vérification**

Après l'exécution, vérifiez que :
- ✅ Toutes les tables ont maintenant une colonne `city`
- ✅ Les index ont été créés
- ✅ Les données existantes ont été mises à jour (si applicable)

## 🏙️ **Fonctionnalités par ville**

Une fois configuré, votre application séparera automatiquement :

### **✅ Annonces**
- Chaque utilisateur ne voit que les annonces de sa ville
- Les nouvelles annonces sont automatiquement marquées avec la ville de l'utilisateur

### **✅ Évaluations/Commentaires**
- Les évaluations sont filtrées par ville
- Chaque ville a ses propres commentaires

### **✅ Messages/Chats**
- Les conversations sont séparées par ville
- Les utilisateurs ne peuvent communiquer qu'avec des personnes de leur ville

### **✅ Profils utilisateurs**
- Chaque utilisateur est associé à une ville et région
- Les données sont automatiquement filtrées

## 🚀 **Résultat**

Après ces modifications :
- **Utilisateur d'İstanbul** : Voit seulement les annonces, messages et évaluations d'İstanbul
- **Utilisateur d'Ankara** : Voit seulement les annonces, messages et évaluations d'Ankara
- **Utilisateur de Bursa** : Voit seulement les annonces, messages et évaluations de Bursa

Chaque ville devient une communauté locale séparée ! 🎉

# Scraper Dashboard

Une interface web moderne pour piloter un scraper d'entreprises locales (Google Maps & LinkedIn) avec extraction d'emails et téléphones.

## 🚀 Structure du Projet

- `/backend` : API FastAPI (Python) wrapée autour du scraper Playwright.
- `/frontend` : Application React (Vite + Tailwind CSS).

## 🛠 Installation Locale

### Backend
1. Naviguer dans le dossier backend : `cd backend`
2. Créer un environnement virtuel : `python -m venv venv`
3. Activer l'environnement : `source venv/bin/activate` (Mac/Linux) ou `venv\Scripts\activate` (Windows)
4. Installer les dépendances : `pip install -r requirements.txt`
5. Installer Playwright : `playwright install chromium`
6. Lancer le serveur : `uvicorn main:app --reload`

Le backend sera disponible sur `http://localhost:8000`.

### Frontend
1. Naviguer dans le dossier frontend : `cd frontend`
2. Installer les dépendances : `npm install`
3. Lancer le serveur de développement : `npm run dev`

Le frontend sera disponible sur `http://localhost:5173`.

## 🌐 Déploiement

### Backend (Render.com)
- Créer un "Web Service" sur Render.
- Pointer vers votre repo GitHub.
- Render détectera automatiquement le fichier `backend/render.yaml`.
- **Variable d'env :** `FRONTEND_URL` pour la config CORS.

### Frontend (Vercel)
- Importer le projet sur Vercel.
- Définir le "Root Directory" sur `frontend`.
- **Variable d'env :** `VITE_API_URL` pointant vers l'URL de votre backend Render.

## 📋 Fonctionnalités
- Choix de la source (Maps / LinkedIn).
- Logs en temps réel via Server-Sent Events (SSE).
- Tableau de résultats dynamique.
- Export CSV direct depuis l'interface.
- Design Premium (UI UX Pro Max compatible).

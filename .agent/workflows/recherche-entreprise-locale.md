---
description: recherche entreprise locale - Scraper Google Maps pour trouver des emails de contact
---

# Recherche Entreprise Locale

Ce workflow permet de rechercher des entreprises par secteur et par ville sur Google Maps, puis d'extraire automatiquement leurs adresses email depuis leurs sites web.

## Prérequis
- Python 3.10+
- Dépendances installées : `pip install httpx beautifulsoup4 playwright tenacity h2`
- Navigateurs installés : `python -m playwright install chromium`

## Utilisation

Pour lancer une recherche, exécutez la commande suivante dans le terminal :

```powershell
$env:HOME = $env:USERPROFILE; python src/maps_scraper.py --sector "[Secteur]" --city "[Ville]" --limit [Nombre d'emails]
```

### Exemples :

1. **Rechercher des boulangeries à Lyon (trouver 5 emails) :**
```powershell
$env:HOME = $env:USERPROFILE; python src/maps_scraper.py --sector "Boulangerie" --city "Lyon" --limit 5
```

2. **Rechercher des dentistes à Nantes (trouver 2 emails) :**
```powershell
$env:HOME = $env:USERPROFILE; python src/maps_scraper.py --sector "Dentiste" --city "Nantes" --limit 2
```

## Résultats
Les emails trouvés sont sauvegardés en temps réel dans le fichier `liste_email.csv` à la racine du projet.

## Contraintes
- Le scraper fonctionne en mode "headless" (invisible).
- Si une entreprise n'a pas de site web ou si aucun email n'est trouvé, elle est ignorée automatiquement.
- Le script s'arrête dès que l'objectif (--limit) est atteint.

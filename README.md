# SenClinic Frontend

Application frontend Angular de gestion medicale multi-cliniques pour le Senegal.

## Apercu

- Nom UI: **SenClinic**
- Langue: **francais**
- Stack: **Angular 21+, standalone components, routing lazy-loaded, TypeScript strict**
- Architecture: **core / shared / features**
- Authentification: **mock locale (sans backend)** avec roles:
  - `administrateur`
  - `medecin`
  - `secretaire`

## Fonctionnalites incluses

- Login avec roles + session locale
- Guards:
  - `auth guard`
  - `role guard`
- Layout principal responsive:
  - Sidebar
  - Header
- Pages metier:
  - Tableau de bord
  - Patients (CRUD + recherche + filtres + pagination)
  - Rendez-vous (CRUD + recherche + filtres + pagination)
  - Consultations (CRUD + recherche + filtres + pagination)
  - Medecins (CRUD + recherche + filtres + pagination)
  - Gestion Utilisateurs (CRUD + recherche + filtres + pagination)
- Services mock locaux avec donnees de demonstration Senegal
- Formulaires reactive forms avec validations
- Etats UI de chargement et erreurs

## Installation

```bash
npm install
```

## Lancement local

```bash
npm start
```

Application disponible sur `http://localhost:4200`.

## Build production

```bash
npm run build
```

Build genere dans `dist/senclinic-frontend`.

## Comptes de demonstration

- `admin@senclinic.sn / admin123`
- `medecin@senclinic.sn / medecin123`
- `secretaire@senclinic.sn / secretaire123`

## Deploiement sur Vercel (pas a pas)

1. Pousser le projet sur GitHub/GitLab/Bitbucket.
2. Se connecter a Vercel et cliquer sur **Add New Project**.
3. Importer le repository `senclinic-frontend`.
4. Verifier les parametres:
   - Build Command: `npm run build`
   - Output Directory: `dist/senclinic-frontend`
5. Lancer le deploiement.
6. Vercel utilisera `vercel.json` pour la redirection SPA vers `index.html`.

## Structure principale

```text
src/app
  core/
    data/
    guards/
    layout/
    models/
    services/
  shared/
    components/
  features/
    auth/
    dashboard/
    medecins/
    patients/
    rendez-vous/
    consultations/
    utilisateurs/
```

## Notes techniques

- Les champs metier suivent strictement la convention `snake_case` dans les modeles TypeScript.
- `patient_id` et `medecin_id` sont geres comme relations par identifiants dans les formulaires et les listes.
- Aucune API backend n'est requise pour ce prototype: tout passe par des services Angular mockes.

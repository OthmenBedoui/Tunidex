# Tunidex - Installation rapide

## Prerequis

- Node.js 18+
- npm
- PostgreSQL pour l'environnement serveur
- Un fichier `.env` configure a la racine du projet

## Installation locale

```bash
npm install
npm run build
npm run dev
```

L'application demarre sur :

```text
http://localhost:3000
```

## Base de donnees

Verifiez que `DATABASE_URL` est configure dans `.env`, puis appliquez les migrations :

```bash
npx prisma migrate deploy --schema server/schema.prisma
npx prisma generate --schema server/schema.prisma
```

## Deploiement serveur

```bash
npm install
npm run build
npx prisma migrate deploy --schema server/schema.prisma
npx prisma generate --schema server/schema.prisma
npm run dev
```

Pour la production, lancez le process avec un gestionnaire comme PM2 ou le service manager du serveur.

## Notes

- Les assets uploades en base64 augmentent la taille des requetes API.
- Le dashboard admin contient la gestion des produits, variants, packages, slides, import/export Excel et nettoyage de donnees.
- Le theme clair/sombre est sauvegarde dans le navigateur.

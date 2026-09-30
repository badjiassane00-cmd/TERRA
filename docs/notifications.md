# Notifications TERRA

Les notifications dans l'application sont toujours enregistrées. Les envois par e-mail, SMS et WhatsApp sont facultatifs, réglables par compte, et restent désactivés tant que le membre ne les active pas.

## Configuration des fournisseurs

Copier les variables de notification de .env.example dans .env.local ou dans l'environnement de déploiement. Garder les clés secrètes uniquement côté serveur.

- **E-mail** : créer une clé d'envoi Resend et vérifier le domaine utilisé dans RESEND_FROM_EMAIL.
- **SMS** : configurer un expéditeur SMS Twilio autorisé dans le compte et renseigner son numéro international dans TWILIO_SMS_FROM.
- **WhatsApp** : connecter un expéditeur WhatsApp Business approuvé à Twilio et créer un modèle approuvé contenant {{1}} (titre) et {{2}} (texte court). Renseigner son SID dans TWILIO_WHATSAPP_CONTENT_SID. Utiliser le bac à sable Twilio uniquement pour les tests.

TERRA demande le consentement explicite pour SMS et WhatsApp et le retire quand l'utilisateur désactive le canal. Les préférences et numéros sont stockés avec le compte. Chaque notification sociale (nouveau commentaire, appréciation, nouvel abonné) est d'abord conservée dans la boîte de réception de l'application; les envois externes activés sont ensuite tentés sans faire échouer l'action sociale.

La page /notifications affiche la boîte de réception, les disponibilités des fournisseurs, les préférences et des boutons de test. Sans configuration d'un fournisseur, son bouton de test reste désactivé et aucune livraison externe n'est simulée.

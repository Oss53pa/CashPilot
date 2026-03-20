# CashPilot — Guide Utilisateur

Bienvenue sur **CashPilot**, votre plateforme de gestion de tresorerie pour l'immobilier commercial.

Ce guide vous explique comment naviguer et utiliser chaque fonctionnalite de l'application.

---

## Sommaire

1. [Premiers pas](#1-premiers-pas)
2. [Navigation](#2-navigation)
3. [Dashboard](#3-dashboard)
4. [Tresorerie](#4-tresorerie)
5. [Comptes](#5-comptes)
6. [Gestion](#6-gestion)
7. [Financement](#7-financement)
8. [Risques](#8-risques)
9. [Workflows d'approbation](#9-workflows-dapprobation)
10. [Proph3t — Intelligence Artificielle](#10-proph3t--intelligence-artificielle)
11. [Administration](#11-administration)
12. [Astuces et raccourcis](#12-astuces-et-raccourcis)

---

## 1. Premiers pas

### Connexion

1. Accedez a l'application via votre navigateur
2. Sur la page de connexion, entrez votre **email** et **mot de passe**
3. Cliquez sur **Se connecter**

> Si vous avez oublie votre mot de passe, cliquez sur **Mot de passe oublie** pour recevoir un lien de reinitialisation par email.

### Selection de la societe

Si votre organisation gere plusieurs societes, un **selecteur de societe** apparait en haut de l'ecran. Selectionnez la societe sur laquelle vous souhaitez travailler. Toutes les donnees affichees seront filtrees selon cette societe.

### Langue

L'application est disponible en **francais** et **anglais**. Changez la langue dans les parametres.

---

## 2. Navigation

### Barre laterale (Sidebar)

La barre laterale a gauche est votre menu principal. Elle est organisee en sections :

| Section | Contenu |
|---|---|
| **Tresorerie** | Encaissements, Decaissements, Previsions |
| **Comptes** | Comptes bancaires, Caisse & Mobile Money |
| **Gestion** | Budget, Contreparties, Transferts internes |
| **Financement** | CAPEX, Dette, Placements, Lignes de credit |
| **Risques** | Contentieux, Fiscal |
| **Workflows** | Approbations de paiements |
| **Administration** | Rapports, Audit Trail, Parametres |

Vous pouvez **reduire** la sidebar en cliquant sur la fleche en bas pour gagner de l'espace.

### Bouton Proph3t (boule flottante)

En bas a droite de chaque page, un **bouton rond avec une icone cerveau** donne acces rapide aux 6 modules d'intelligence artificielle :
- Previsions IA
- Alertes
- Scoring
- Narratifs
- What-If
- Fraude

---

## 3. Dashboard

Le tableau de bord est la premiere page apres connexion. Il s'adapte a votre role :

- **Directeur General (CEO)** : Vue strategique — position globale, KPI cles, alertes critiques
- **Directeur Financier (CFO)** : Vue financiere — tresorerie consolidee, previsions, ratios
- **Tresorier** : Vue operationnelle — soldes du jour, encaissements attendus, echeances
- **Gestionnaire de centre** : Vue par site — performance du centre, locataires, recouvrements

### Cartes de synthese

En haut du dashboard, des **cartes KPI** affichent :
- Position de tresorerie globale
- Encaissements du mois
- Decaissements du mois
- Solde previsionnel

---

## 4. Tresorerie

### Encaissements

**Menu : Tresorerie > Encaissements**

Cette page liste tous les encaissements (loyers recus, paiements clients, etc.).

- **Ajouter** : Cliquez sur le bouton **+ Nouvel encaissement** pour saisir un flux entrant
- **Filtrer** : Utilisez la barre de recherche et les filtres par date, categorie, ou statut
- **Trier** : Cliquez sur les en-tetes de colonnes pour trier par montant, date, etc.
- **Exporter** : Bouton d'export Excel disponible

### Decaissements

**Menu : Tresorerie > Decaissements**

Meme principe que les encaissements, pour les flux sortants (paiements fournisseurs, charges, etc.).

> Les decaissements au-dessus d'un certain seuil necessitent une **validation** via le workflow d'approbation.

### Previsions

**Menu : Tresorerie > Previsions**

Visualisez les previsions de tresorerie sur differents horizons. Cette page utilise des methodes statistiques classiques.

> Pour les previsions IA avancees (7 modeles, intervalles de confiance), utilisez **Proph3t > Previsions IA**.

---

## 5. Comptes

### Comptes bancaires

**Menu : Comptes > Comptes bancaires**

Gerez vos comptes bancaires :

- **Liste** : Tous les comptes avec banque, numero, type, solde, statut
- **Ajouter un compte** : Bouton **+ Ajouter** en haut a droite
- **Detail** : Cliquez sur un compte pour voir l'historique, les releves et les alertes
- **Cartes de solde** : En haut, les soldes totaux par devise sont affiches

### Caisses & Mobile Money

**Menu : Comptes > Caisse & Mobile Money**

Suivi des caisses physiques et comptes Mobile Money :

- **Comptage de caisse** : Saisissez les montants par coupure
- **Validation des retraits** : Double validation requise pour les retraits
- **Ecarts** : Les ecarts entre comptage et solde theorique sont detectes automatiquement

---

## 6. Gestion

### Budget

**Menu : Gestion > Budget**

- Saisissez le **budget previsionnel** par categorie et par mois
- Visualisez la **comparaison previsionnel / realise** avec les ecarts
- **Import** : Importez un budget depuis un fichier Excel

### Contreparties (Locataires / Fournisseurs)

**Menu : Gestion > Contreparties**

Gerez votre repertoire de locataires et fournisseurs :

- **Fiche contrepartie** : Nom, IBAN, coordonnees, conditions de paiement
- **Profil de paiement** : Historique des paiements, delai moyen, taux de recouvrement
- **Classification de certitude** : Les contreparties sont classees par fiabilite de paiement
- **Indexation des loyers** : Suivi des revalorisations automatiques

### Transferts internes

**Menu : Gestion > Transferts internes**

Effectuez des virements entre vos propres comptes bancaires pour equilibrer la tresorerie.

---

## 7. Financement

### CAPEX

**Menu : Financement > CAPEX**

Suivi des projets d'investissement :

- **Tableau de bord CAPEX** : Budget engage vs realise par projet
- **Echeanciers** : Calendrier des paiements prevus
- **Fiches projet** : Detail par operation (renovation, equipement, etc.)

### Dette

**Menu : Financement > Dette**

Gestion des contrats de pret et emprunts :

- **Liste des contrats** : Banque, montant, taux, duree, solde restant
- **Tableau d'amortissement** : Echeancier de remboursement automatique
- **Ratios** : Suivi du ratio dette/EBITDA

### Placements

**Menu : Financement > Placements**

Suivi des placements financiers :

- **DAT** (Depots a Terme) : Montant, taux, echeance, rendement
- **Bons du tresor**, OPCVM, et autres instruments

### Lignes de credit

**Menu : Financement > Lignes de credit**

- Suivi des lignes revolving et spot
- **Disponible vs utilise** : Visualisation du montant encore mobilisable
- **Cout** : Taux d'interet et agios

---

## 8. Risques

### Contentieux

**Menu : Risques > Contentieux**

Suivi des dossiers juridiques :

- **Timeline** : Historique des evenements par dossier
- **Statut** : En cours, Gagne, Perdu, Transige
- **Provisions** : Montants provisionnes

### Fiscal

**Menu : Risques > Fiscal**

- **Calendrier fiscal** : Echeances TVA, IS, taxes communales
- **Flux TVA** : Suivi de la TVA collectee et deductible
- **Regularisation de charges** : Gestion des appels de charges locataires
- **Cautionnements** : Suivi des depots de garantie

---

## 9. Workflows d'approbation

**Menu : Workflows > Approbations**

Les paiements au-dessus du seuil de delegation (DOA) passent par un circuit de validation :

1. **Demande** : Le tresorier cree une demande de paiement
2. **Validation N1** : Le gestionnaire approuve (ou rejette)
3. **Validation N2** : Le directeur financier approuve les montants eleves
4. **Execution** : Le paiement est execute apres validation complete

### Tableau de bord des approbations

- **En attente** : Paiements qui attendent votre validation
- **Approuves** : Historique des validations
- **Rejetes** : Demandes refusees avec motif

> Le seuil de delegation est configurable dans les **Parametres > DOA**.

---

## 10. Proph3t — Intelligence Artificielle

Proph3t est le moteur d'IA integre a CashPilot. Accedez-y via le **bouton flottant** (icone cerveau) en bas a droite, ou via les routes `/proph3t/*`.

### 10.1 Previsions IA

**Acces : Proph3t > Previsions IA**

Des previsions de tresorerie generees automatiquement par 7 modeles d'IA.

- **4 horizons** : J+7, J+30, J+90, J+365
- **3 scenarios** : Base, Optimiste, Pessimiste
- **Graphique** : Courbe avec intervalles de confiance a 80% et 95%
- **Modele** : Le moteur choisit automatiquement le meilleur modele selon votre historique

**Comment lire le graphique :**
- La **ligne noire continue** = donnees reelles (historique)
- La **ligne bleue en pointilles** = prevision centrale
- Les **bandes bleues claires** = intervalles de confiance (plus la bande est large, plus l'incertitude est grande)

Cliquez sur **Recalculer** pour forcer un nouveau calcul.

### 10.2 Alertes predictives

**Acces : Proph3t > Alertes**

Le moteur IA genere automatiquement des alertes quand il detecte :

| Alerte | Signification |
|---|---|
| **Tension de liquidite** | Votre tresorerie risque de passer en negatif |
| **Risque de recouvrement** | Plusieurs locataires ont des scores degrades |
| **Desequilibre comptes** | Trop de liquidite concentree sur un seul compte |
| **Covenant en risque** | Ratio dette proche du seuil bancaire |
| **Excedent placable** | Opportunite de placement detectee |
| **Tension CAPEX** | Les investissements pesent trop sur la tresorerie |
| **Score locataire critique** | Un locataire est en chute libre |
| **Anomalie critique** | Transactions suspectes non resolues |

**Gestion des alertes :**
1. Cliquez sur une alerte pour voir les details et les causes
2. **Acquitter** : Vous avez pris connaissance de l'alerte
3. **Action en cours** : Vous etes en train de resoudre le probleme
4. **Resoudre** : Le probleme est regle
5. **Rejeter** : Fausse alerte

Chaque alerte est accompagnee de **recommandations** avec des actions concretes, un cout estime, et des etapes a suivre.

### 10.3 Scoring locataires

**Acces : Proph3t > Scoring**

Chaque locataire recoit un **score de 0 a 100** calcule automatiquement chaque semaine :

| Score | Classification | Couleur | Action |
|---|---|---|---|
| 80-100 | Excellent | Vert | Aucune action |
| 65-79 | Bon | Vert clair | Surveillance standard |
| 50-64 | A surveiller | Jaune | Contact preventif |
| 35-49 | A risque | Orange | Mise en demeure |
| 0-34 | Critique | Rouge | Procedure judiciaire |

**Le score est base sur :**
- Ponctualite de paiement (3 derniers mois)
- Taux de paiement complet vs partiel vs impaye
- Tendance des retards (en amelioration ou degradation)
- Montant des arrieres
- Regularite des paiements
- Anciennete de la derniere transaction

**Fleches de tendance :**
- Fleche verte vers le haut = le locataire s'ameliore
- Tiret gris = stable
- Fleche orange vers le bas = degradation
- Fleche rouge vers le bas = chute critique

Cliquez sur un locataire pour voir le **detail** : historique du score, facteurs de risque, et recommandations.

### 10.4 Analyses narratives

**Acces : Proph3t > Narratifs**

Un **rapport hebdomadaire** genere automatiquement par l'IA, en francais ou en anglais.

Le rapport contient 6 sections :

1. **Situation generale** : Position de tresorerie, flux de la semaine, ratio de liquidite
2. **Points d'attention** : Alertes critiques, anomalies, risques identifies
3. **Prevision semaine** : Ce que le moteur anticipe pour les 30 prochains jours
4. **Bonnes nouvelles** : Locataires en amelioration, encaissements superieurs aux previsions
5. **Vigilance CAPEX** : Poids des investissements sur la tresorerie
6. **Performance modele** : Precision des previsions (MAPE)

Chaque section a un **indicateur de sentiment** (point colore) :
- Vert = positif
- Gris = neutre
- Orange = attention
- Rouge = critique

Utilisez le **selecteur de date** pour consulter les rapports precedents.

### 10.5 Simulation What-If

**Acces : Proph3t > What-If**

Simulez l'impact de differentes hypotheses sur votre tresorerie.

**Utilisation avec les curseurs :**
- Ajustez le **taux de recouvrement** (ex: que se passe-t-il si seulement 70% des loyers sont payes ?)
- Modifiez le **delai de paiement moyen** (ex: si les locataires paient 30 jours plus tard)
- Changez les **revenus** ou les **depenses** (ex: +15% de revenus grace a de nouveaux baux)
- Decalez les **CAPEX** (ex: reporter 50% des investissements)

Le graphique se met a jour en **temps reel** pour comparer le scenario de base avec votre scenario modifie.

Les **cartes d'impact** en haut montrent :
- Impact net total sur la periode
- Pire mois (le mois le plus impacte negativement)
- Meilleur mois

### 10.6 Detection de fraude

**Acces : Proph3t > Fraude**

Le moteur analyse chaque transaction pour detecter des patterns suspects :

| Regle | Ce que ca detecte |
|---|---|
| **Doublon de paiement** | Meme montant + meme beneficiaire en 30 jours |
| **Montant inhabituel** | Montant tres different de l'historique du fournisseur |
| **Fournisseur non autorise** | Paiement vers un beneficiaire inconnu |
| **Anomalie horaire** | Transaction en dehors des heures de bureau (22h-6h) |
| **Montant rond suspect** | Serie de montants ronds juste sous le seuil d'approbation |
| **Modification RIB + paiement** | Changement de coordonnees bancaires suivi d'un paiement |
| **Fractionnement** | Plusieurs petits paiements pour eviter le seuil de validation |
| **Exces de caisse** | Solde caisse trop eleve sans reversement bancaire |

**Gestion des alertes de fraude :**
1. Consultez les **elements de preuve** (details de la transaction, comparaisons)
2. Consultez les **actions recommandees**
3. Choisissez :
   - **Investiguer** : Marquer comme en cours d'investigation
   - **Faux positif** : L'alerte n'est pas justifiee
   - **Confirmer fraude** : La fraude est averee

> Les transactions de severite **critique** sont automatiquement bloquees.

### 10.7 Performance du moteur

**Acces : Proph3t > Performance**

Tableau de bord de suivi de la precision de l'IA :

- **MAPE** : Erreur moyenne de prevision (plus c'est bas, mieux c'est)
  - Vert (< 5%) : Excellent
  - Jaune (5-10%) : Bon
  - Rouge (> 10%) : A ameliorer
- **Graphique d'evolution** : Le MAPE au fil du temps (il devrait baisser)
- **Comparaison des modeles** : Quel modele est le plus precis par categorie
- **Historique d'entrainement** : Quand les modeles ont ete recalibres

---

## 11. Administration

### Rapports

**Menu : Administration > Rapports**

10 types de rapports disponibles :

- Position de tresorerie
- Flux de tresorerie
- Creances agees
- Recouvrement
- Ecart budgetaire
- CAPEX
- Multi-banques
- Fiscal
- Contentieux
- Rapport hebdomadaire

Chaque rapport peut etre **exporte en Excel**.

### Audit Trail

**Menu : Administration > Audit Trail**

Journal complet de toutes les actions dans l'application :

- Qui a fait quoi, quand, sur quelle donnee
- **Filtres** par utilisateur, action, table, date
- **Cloture de periode** : Verrouillez une periode pour empecher les modifications retroactives

### Parametres

**Menu : Administration > Parametres**

- **Societe** : Nom, devise, exercice fiscal
- **Utilisateurs** : Gestion des acces et des roles
- **Securite** : Authentification, MFA
- **Notifications** : Alertes email, seuils

---

## 12. Astuces et raccourcis

### Navigation rapide
- Utilisez le **bouton Proph3t** (cerveau flottant) pour acceder rapidement a l'IA depuis n'importe quelle page
- **Reduisez la sidebar** pour gagner de l'espace sur les ecrans etroits

### Tableaux de donnees
- **Recherche** : Tapez dans la barre de recherche au-dessus des tableaux pour filtrer
- **Tri** : Cliquez sur un en-tete de colonne pour trier croissant/decroissant
- **Pagination** : Naviguez entre les pages en bas du tableau

### Devises
- Tous les montants sont affiches en **FCFA** (Franc CFA / XOF)
- Le systeme stocke les montants en centimes pour la precision

### Actualisation des donnees
- Les donnees se mettent a jour automatiquement grace au **temps reel Supabase**
- Pour forcer un rafraichissement, rechargez la page (F5)

### Multi-societe
- Changez de societe via le selecteur en haut de page
- Les donnees de **consolidation** (vue groupe) sont accessibles dans Administration > Consolidation

---

## Besoin d'aide ?

Contactez votre administrateur CashPilot ou consultez les **info-bulles** (icones ?) presentes dans l'application.

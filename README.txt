====================================
MIF37 - Alignement d'entités entre
        Géonames et Open Street Map
------------------------------------
Jordan Martin & Jules Sauvinet
====================================


1. Présentation
----------------

Cette application a été réalisé avec des technos web.
La partie client est une single-page application réalisé
avec Backbone. La partie serveur est assuré par le serveur
NodeJS et une base de données MongoDB.


2. Installation
----------------

 1. Installer NodeJS (version > 5.x.x)
    Cela installera en même temps "npm".
    (sur ubuntu, ne pas faire apt-get install node car version trop vielle)

 2. Installer MongoDB

 3. Compilation de l'application et téléchargement des dépendances
    $ npm run build


3. Exécution
-------------

 1. Démarrage du serveur MongoDB
    $ mongod

 2. Lancement du serveur NodeJS
    $ npm start

 3. Si tout c'est bien passer l'application est disponible à l'adresse:
    > http://localhost:3000/


4. Fonctionnalités
-------------------

 L'application permet de fusionner des entités provenant des deux bases de données géographiques d'OpenStreetMap et de Geonames.
 Les entités fusionnése sont issues d'un processus d'intégration fait par l'utilisateur ou par grâce à un algorithme de recherche de correspondances.
 
 Tout d'abord, l'utilisateur peut taper sa requête dans la barre disponible à tout moment sur l'interface de l'application ou bien directement 
 saisir l'URL #map/<requete>.  
 Ensuite en fonction du bouton radio saisi en dessous de la barre de recherche,deux orientations dans l'utilisation de notre application 
 d'intégration sont à distinguer :
 
 1. Le choix de la fusion "manuelle" en cliquant sur le bouton radio "Fusion manuelle". 
	
	Ensuite, deux listes apparaissent lui affichant les entités géographiques provenant d'OpenStreetMap et de Geonames.
	Puis, une fois qu'il a cliqué sur deux entités, une de chaque listes, il peut les fusionner en cliquant sur "fusionner les entités". 
	Un formulaire s'ouvre à lui proposant un liste de champs préremplies avec la possibilité de personnaliser certaines valeurs. 
	L'utilisateur peut également rajouter autant de champs personnalisés qu'il le veut en cliquant sur le bouton "ajouter un attribut".
	
	Un fois l'entité géographique personnalisée construite, il lui suffit de cliquer sur sauvegarder pour enregistrer l'entité dans la base 
	de donnée.
	
 2. Le choix de la fusion "automatique"	en cliquant sur le bouton radio "Fusion automatique".
	
	Les entités géographiques sont fusionnées automatiquement selon un algorithme d'auto-apprentissage. 
	La liste des entités fusionnées sont affichées à l'utilisateur.
	Celui-ci peut consulter les informations relatives à celles-ci en cliquant sur une entité.  
	
	Une fois qu'il a cliqué sur une entité, il peut également décider d'annuler l'enregistrement de l'entité en base en cliquant sur le bouton
	"annuler la fusion".
		
 
 
 A tout moment, l'utilisateur peut consulter la liste des entités qui ont déjà été enregistrées dans la base en cliquant sur le 
 lien "entités déjà fusionnées" qui lui affichera une liste des entités présentes dans la base. Il peut également voir les informations 
 relatives à ces entités en cliquant sur chaque entité. Cliquer sur une entité sur lui donne également la possibilité de supprimer l'entité fusionnée
 de la base.
 
 En outre, le fait de cliquer sur une entité, qu'elle proviennent de notre base de donnée ou bien de celle de Geonames ou d'OpenStreetMap
 affichera des informations relatives à cette entité.
 
 Enfin, l'application a été internationalisée et est ainsi disponible en français comme en anglais.
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
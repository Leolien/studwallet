// ===== 1. SÉLECTION DES ÉLÉMENTS DU DOM =====
const formulaire = document.getElementById("formulaire");
const montantInput = document.getElementById("montant");
const categorieInput = document.getElementById("categorie");
const dateInput = document.getElementById("date");
const libelleInput = document.getElementById("libelle");

const soldeElement = document.getElementById("solde");
const revenusMoisElement = document.getElementById("revenus-mois");
const depensesMoisElement = document.getElementById("depenses-mois");

const listeTransactions = document.getElementById("liste-transactions");
const messageVide = document.getElementById("message-vide");

// ===== 2. INITIALISATION DES DONNÉES =====
// On récupère les transactions stockées dans localStorage, ou un tableau vide si rien n'existe encore
let transactions = JSON.parse(localStorage.getItem("studwallet_transactions")) || [];

// ===== 3. FONCTIONS DE STOCKAGE ET DE GESTION =====

// Sauvegarde le tableau dans localStorage
function sauvegarder() {
  localStorage.setItem("studwallet_transactions", JSON.stringify(transactions));
}

// Gestion de la soumission du formulaire
formulaire.addEventListener("submit", function (e) {
  e.preventDefault();

  // Récupération de la valeur du bouton radio coché (revenu ou depense)
  const typeInput = document.querySelector('input[name="type"]:checked');

  // Création de l'objet transaction
  const nouvelleTransaction = {
    id: Date.now(),
    montant: parseFloat(montantInput.value),
    categorie: categorieInput.value,
    date: dateInput.value,
    libelle: libelleInput.value,
    type: typeInput.value
  };

  // Ajout au tableau et sauvegarde
  transactions.push(nouvelleTransaction);
  sauvegarder();

  // Reinitialisation du formulaire
  formulaire.reset();
  // On remet "Dépense" par défaut après reset
  document.querySelector('input[name="type"][value="depense"]').checked = true;

  // Mise à jour de l'affichage (fonction qu'on va écrire à l'étape suivante)
  mettreAJourAffichage();
});

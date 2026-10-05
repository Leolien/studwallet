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

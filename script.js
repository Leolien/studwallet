// ===== 1. SÉLECTION DES ÉLÉMENTS HTML =====
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

// ===== 2. CHARGEMENT INITIAL DES DONNÉES =====
// On récupère les données dans localStorage. Si c'est vide, on initialise un tableau vide.
let transactions = [];
const donneesSauvegardees = localStorage.getItem("studwallet_transactions");

if (donneesSauvegardees !== null) {
  transactions = JSON.parse(donneesSauvegardees);
}

// ===== 3. FONCTIONS DE SAUVEGARDE ET MISE À JOUR =====

// Sauvegarde dans le navigateur
function sauvegarder() {
  localStorage.setItem("studwallet_transactions", JSON.stringify(transactions));
}

// Transforme un nombre en texte formaté avec la virgule (ex: 12.50 -> "12,50 €")
function formaterPrix(montant) {
  return montant.toFixed(2).replace(".", ",") + " €";
}

// Transforme "2026-10-05" en "05/10/2026"
function formaterDate(dateTexte) {
  const parties = dateTexte.split("-");
  const annee = parties[0];
  const mois = parties[1];
  const jour = parties[2];
  return jour + "/" + mois + "/" + annee;
}

// ===== 4. AFFICHAGE DE LA LISTE ET CALCULS =====

function mettreAJourAffichage() {
  // A. Vider la liste actuelle
  listeTransactions.innerHTML = "";

  // B. Afficher ou masquer le message "Aucune transaction"
  if (transactions.length === 0) {
    messageVide.style.display = "block";
  } else {
    messageVide.style.display = "none";
  }

  // C. Récupérer le mois et l'année actuels pour les calculs de synthèse
  const dateAujourdhui = new Date();
  const moisActuel = (dateAujourdhui.getMonth() + 1).toString().padStart(2, "0");
  const anneeActuelle = dateAujourdhui.getFullYear().toString();

  let totalSolde = 0;
  let totalRevenusMois = 0;
  let totalDepensesMois = 0;

  // D. Parcourir chaque transaction avec une boucle for classique
  for (let i = 0; i < transactions.length; i = i + 1) {
    const item = transactions[i];

    // 1. Calcul du solde global
    if (item.type === "revenu") {
      totalSolde = totalSolde + item.montant;
    } else {
      totalSolde = totalSolde - item.montant;
    }

    // 2. Calcul des totaux du mois en cours
    const partiesDate = item.date.split("-");
    const anneeTransac = partiesDate[0];
    const moisTransac = partiesDate[1];

    if (anneeTransac === anneeActuelle && moisTransac === moisActuel) {
      if (item.type === "revenu") {
        totalRevenusMois = totalRevenusMois + item.montant;
      } else {
        totalDepensesMois = totalDepensesMois + item.montant;
      }
    }

    // 3. Création de l’élément HTML <li> pour la liste
    const li = document.createElement("li");

    let classeCouleur = "montant-depense";
    let signe = "-";
    if (item.type === "revenu") {
      classeCouleur = "montant-revenu";
      signe = "+";
    }

    li.innerHTML = `
      <div>
        <strong>${item.libelle}</strong>
        <small style="display: block; color: var(--gris); text-transform: capitalize;">
          ${item.categorie} • ${formaterDate(item.date)}
        </small>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="${classeCouleur}">
          ${signe} ${formaterPrix(item.montant)}
        </span>
        <button class="bouton-supprimer" onclick="supprimerTransaction(${item.id})" title="Supprimer">
          🗑
        </button>
      </div>
    `;

    listeTransactions.appendChild(li);
  }

  // E. Mettre à jour les textes des cartes d'affichage
  soldeElement.textContent = formaterPrix(totalSolde);
  revenusMoisElement.textContent = "+ " + formaterPrix(totalRevenusMois);
  depensesMoisElement.textContent = "- " + formaterPrix(totalDepensesMois);
}

// ===== 5. AJOUT D'UNE TRANSACTION =====

formulaire.addEventListener("submit", function (evenement) {
  evenement.preventDefault();

  // On récupère quel bouton radio est coché
  const typeCoche = document.querySelector('input[name="type"]:checked').value;

  // Création de la transaction
  const nouvelleTransaction = {
    id: Date.now(),
    montant: parseFloat(montantInput.value),
    categorie: categorieInput.value,
    date: dateInput.value,
    libelle: libelleInput.value,
    type: typeCoche
  };

  // On l'ajoute au début du tableau avec unshift (comme ça les plus récentes sont en haut)
  transactions.unshift(nouvelleTransaction);

  // Sauvegarde et mise à jour
  sauvegarder();
  formulaire.reset();
  document.querySelector('input[name="type"][value="depense"]').checked = true;

  mettreAJourAffichage();
});

// ===== 6. SUPPRESSION D'UNE TRANSACTION =====

function supprimerTransaction(id) {
  let nouveauTableau = [];

  // On conserve uniquement les transactions qui n'ont pas l'id supprimé
  for (let i = 0; i < transactions.length; i = i + 1) {
    if (transactions[i].id !== id) {
      nouveauTableau.push(transactions[i]);
    }
  }

  transactions = nouveauTableau;
  sauvegarder();
  mettreAJourAffichage();
}

// ===== 7. LANCEMENT AU CHARGEMENT DE LA PAGE =====
mettreAJourAffichage();

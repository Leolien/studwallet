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

// ===== 4. AFFICHAGE ET CALCULS =====

function mettreAJourAffichage() {
  // --- A. Affichage du message vide ou de la liste ---
  if (transactions.length === 0) {
    messageVide.style.display = "block";
    listeTransactions.innerHTML = "";
  } else {
    messageVide.style.display = "none";
    listeTransactions.innerHTML = "";

    // On parcourt les transactions (de la plus récente à la plus ancienne)
    [...transactions].reverse().forEach((item) => {
      const li = document.createElement("li");

      const dateFormatee = new Date(item.date).toLocaleDateString("fr-FR");
      const classeMontant = item.type === "revenu" ? "montant-revenu" : "montant-depense";
      const signe = item.type === "revenu" ? "+" : "-";

      li.innerHTML = `
        <div>
          <strong>${item.libelle}</strong>
          <small style="display: block; color: var(--gris); text-transform: capitalize;">
            ${item.categorie} • ${dateFormatee}
          </small>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="${classeMontant}">
            ${signe} ${item.montant.toFixed(2).replace(".", ",")} €
          </span>
          <button 
            type="button" 
            onclick="supprimerTransaction(${item.id})" 
            style="background: none; border: none; color: var(--rouge); cursor: pointer; font-size: 16px;" 
            title="Supprimer">
            🗑️️
          </button>
        </div>
      `;

      listeTransactions.appendChild(li);
    });
  }

  // --- B. Calculs (Solde, Revenus du mois, Dépenses du mois) ---
  const dateActuelle = new Date();
  const moisActuel = dateActuelle.getMonth();
  const anneeActuelle = dateActuelle.getFullYear();

  let totalSolde = 0;
  let totalRevenusMois = 0;
  let totalDepensesMois = 0;

  transactions.forEach((item) => {
    // Calcul du solde global
    if (item.type === "revenu") {
      totalSolde += item.montant;
    } else {
      totalSolde -= item.montant;
    }

    // Calcul de la synthèse du mois
    const dateTransac = new Date(item.date);
    if (dateTransac.getMonth() === moisActuel && dateTransac.getFullYear() === anneeActuelle) {
      if (item.type === "revenu") {
        totalRevenusMois += item.montant;
      } else {
        totalDepensesMois += item.montant;
      }
    }
  });

  // Mise à jour des textes HTML
  soldeElement.textContent = `${totalSolde.toFixed(2).replace(".", ",")} €`;
  revenusMoisElement.textContent = `+ ${totalRevenusMois.toFixed(2).replace(".", ",")} €`;
  depensesMoisElement.textContent = `- ${totalDepensesMois.toFixed(2).replace(".", ",")} €`;
}

// ===== 5. SUPPRESSION D'UNE TRANSACTION =====
function supprimerTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  sauvegarder();
  mettreAJourAffichage();
}

// ===== 6. CHARGEMENT INITIAL =====
mettreAJourAffichage();

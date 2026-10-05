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
let transactions = JSON.parse(localStorage.getItem("studwallet_transactions")) || [];

// ===== 3. FONCTIONS DE STOCKAGE ET DE GESTION =====
function sauvegarder() {
  localStorage.setItem("studwallet_transactions", JSON.stringify(transactions));
}

formulaire.addEventListener("submit", function (e) {
  e.preventDefault();

  const typeInput = document.querySelector('input[name="type"]:checked');

  const nouvelleTransaction = {
    id: Date.now(),
    montant: parseFloat(montantInput.value),
    categorie: categorieInput.value,
    date: dateInput.value,
    libelle: libelleInput.value,
    type: typeInput.value
  };

  transactions.push(nouvelleTransaction);
  sauvegarder();

  formulaire.reset();
  document.querySelector('input[name="type"][value="depense"]').checked = true;

  mettreAJourAffichage();
});

// ===== 4. AFFICHAGE ET CALCULS =====
function mettreAJourAffichage() {
  if (transactions.length === 0) {
    messageVide.style.display = "block";
    listeTransactions.innerHTML = "";
  } else {
    messageVide.style.display = "none";
    listeTransactions.innerHTML = "";

    [...transactions].reverse().forEach((item) => {
      const li = document.createElement("li");

      // Decoupage propre de AAAA-MM-JJ sans decalage de fuseau horaire
      const [annee, mois, jour] = item.date.split("-");
      const dateFormatee = `${jour}/${mois}/${annee}`;

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
            🗑
          </button>
        </div>
      `;

      listeTransactions.appendChild(li);
    });
  }

  // Calculs (Solde global et mois en cours)
  const dateActuelle = new Date();
  const moisActuel = (dateActuelle.getMonth() + 1).toString().padStart(2, "0");
  const anneeActuelle = dateActuelle.getFullYear().toString();

  let totalSolde = 0;
  let totalRevenusMois = 0;
  let totalDepensesMois = 0;

  transactions.forEach((item) => {
    // Solde global
    if (item.type === "revenu") {
      totalSolde += item.montant;
    } else {
      totalSolde -= item.montant;
    }

    // Synthese du mois (comparaison directe des chaines "AAAA" et "MM")
    const [transacAnnee, transacMois] = item.date.split("-");
    if (transacAnnee === anneeActuelle && transacMois === moisActuel) {
      if (item.type === "revenu") {
        totalRevenusMois += item.montant;
      } else {
        totalDepensesMois += item.montant;
      }
    }
  });

  soldeElement.textContent = `${totalSolde.toFixed(2).replace(".", ",")} €`;
  revenusMoisElement.textContent = `+ ${totalRevenusMois.toFixed(2).replace(".", ",")} €`;
  depensesMoisElement.textContent = `- ${totalDepensesMois.toFixed(2).replace(".", ",")} €`;
}

// ===== 5. SUPPRESSION D'UNE TRANSACTION =====
window.supprimerTransaction = function (id) {
  transactions = transactions.filter((t) => t.id !== id);
  sauvegarder();
  mettreAJourAffichage();
};

// ===== 6. CHARGEMENT INITIAL =====
mettreAJourAffichage();

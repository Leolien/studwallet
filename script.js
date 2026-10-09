// CONNEXION À SUPABASE

// Adresse de notre projet et clé publique (publishable)
const SUPABASE_URL = "https://ncxayktkblpsuvirnsnj.supabase.co/";
const SUPABASE_CLE = "sb_publishable__xm3IKCaSwoZ-EkPfVVr7Q_fqM1hpQB";

// Le client sert à parler à Supabase (connexion, lecture et écriture des données)
const clientSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_CLE);

// SÉLECTION DES ÉLÉMENTS HTML 
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

// FONCTIONS UTILES

// Arrondit un nombre à 2 décimales (évite les erreurs comme 0.1 + 0.2 = 0.30000000000000004)
function arrondirMontant(montant) {
  return Math.round(montant * 100) / 100;
}

// Transforme un nombre en texte avec la virgule (ex : 12.5 -> "12,50 €")
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

// Renvoie la date d'aujourd'hui au format "2026-10-05" (format attendu par le champ date)
function obtenirDateDuJour() {
  const aujourdhui = new Date();
  const annee = aujourdhui.getFullYear();
  const mois = (aujourdhui.getMonth() + 1).toString().padStart(2, "0");
  const jour = aujourdhui.getDate().toString().padStart(2, "0");
  return annee + "-" + mois + "-" + jour;
}

// Remplace les caractères spéciaux du HTML pour qu'un texte tapé par l'utilisateur
// s'affiche tel quel au lieu d'être interprété comme du code
function nettoyerTexte(texte) {
  let resultat = String(texte);
  resultat = resultat.replaceAll("&", "&amp;");
  resultat = resultat.replaceAll("<", "&lt;");
  resultat = resultat.replaceAll(">", "&gt;");
  resultat = resultat.replaceAll('"', "&quot;");
  return resultat;
}

// CHARGEMENT ET SAUVEGARDE (localStorage) 

let transactions = [];

// Lit les transactions enregistrées. Si les données sont absentes ou abîmées,
// on repart avec une liste vide au lieu de faire planter le site.
function chargerTransactions() {
  const donneesSauvegardees = localStorage.getItem("studwallet_transactions");

  if (donneesSauvegardees === null) {
    return [];
  }

  try {
    const tableau = JSON.parse(donneesSauvegardees);
    if (Array.isArray(tableau)) {
      return tableau;
    }
    return [];
  } catch (erreur) {
    return [];
  }
}

// Enregistre les transactions dans le navigateur
function sauvegarder() {
  localStorage.setItem("studwallet_transactions", JSON.stringify(transactions));
}

// TRI PAR DATE 

// Trie les transactions de la plus récente à la plus ancienne.
// Si deux transactions ont la même date, la dernière ajoutée passe en premier.
function trierParDate() {
  transactions.sort(function (a, b) {
    if (a.date < b.date) {
      return 1;
    }
    if (a.date > b.date) {
      return -1;
    }
    return b.id - a.id;
  });
}

// AFFICHAGE DE LA LISTE ET CALCULS 

function mettreAJourAffichage() {
  // A. Vider la liste actuelle
  listeTransactions.innerHTML = "";

  // B. Afficher ou masquer le message "Aucune transaction"
  if (transactions.length === 0) {
    messageVide.style.display = "block";
  } else {
    messageVide.style.display = "none";
  }

  // C. Récupérer le mois et l'année actuels pour la synthèse du mois
  const dateAujourdhui = new Date();
  const moisActuel = (dateAujourdhui.getMonth() + 1).toString().padStart(2, "0");
  const anneeActuelle = dateAujourdhui.getFullYear().toString();

  let totalSolde = 0;
  let totalRevenusMois = 0;
  let totalDepensesMois = 0;

  // D. Parcourir chaque transaction
  for (let i = 0; i < transactions.length; i = i + 1) {
    const item = transactions[i];

    // 1. Calcul du solde global
    if (item.type === "revenu") {
      totalSolde = arrondirMontant(totalSolde + item.montant);
    } else {
      totalSolde = arrondirMontant(totalSolde - item.montant);
    }

    // 2. Calcul des totaux du mois en cours
    const partiesDate = item.date.split("-");
    const anneeTransaction = partiesDate[0];
    const moisTransaction = partiesDate[1];

    if (anneeTransaction === anneeActuelle && moisTransaction === moisActuel) {
      if (item.type === "revenu") {
        totalRevenusMois = arrondirMontant(totalRevenusMois + item.montant);
      } else {
        totalDepensesMois = arrondirMontant(totalDepensesMois + item.montant);
      }
    }

    // 3. Création de l'élément <li> de la liste
    const li = document.createElement("li");

    let classeCouleur = "montant-depense";
    let signe = "-";
    if (item.type === "revenu") {
      classeCouleur = "montant-revenu";
      signe = "+";
    }

    li.innerHTML = `
      <div>
        <strong>${nettoyerTexte(item.libelle)}</strong>
        <small class="details-transaction">
          ${nettoyerTexte(item.categorie)} • ${formaterDate(item.date)}
        </small>
      </div>
      <div class="actions-transaction">
        <span class="${classeCouleur}">${signe} ${formaterPrix(item.montant)}</span>
        <button class="bouton-supprimer" onclick="supprimerTransaction(${item.id})" title="Supprimer" aria-label="Supprimer la transaction">
          🗑
        </button>
      </div>
    `;

    listeTransactions.appendChild(li);
  }

  // E. Mettre à jour les cartes du haut
  soldeElement.textContent = formaterPrix(totalSolde);
  revenusMoisElement.textContent = "+ " + formaterPrix(totalRevenusMois);
  depensesMoisElement.textContent = "- " + formaterPrix(totalDepensesMois);
}

// AJOUT D'UNE TRANSACTION 

formulaire.addEventListener("submit", function (evenement) {
  evenement.preventDefault();

  // On enlève les espaces au début et à la fin du libellé
  const libelleNettoye = libelleInput.value.trim();

  // Un libellé fait uniquement d'espaces n'est pas accepté
  if (libelleNettoye === "") {
    alert("Merci d'écrire un libellé.");
    return;
  }

  // On récupère quel bouton radio est coché
  const typeCoche = document.querySelector('input[name="type"]:checked').value;

  // Création de la transaction
  const nouvelleTransaction = {
    id: Date.now(),
    montant: arrondirMontant(parseFloat(montantInput.value)),
    categorie: categorieInput.value,
    date: dateInput.value,
    libelle: libelleNettoye,
    type: typeCoche
  };

  // Ajout, tri par date, sauvegarde
  transactions.push(nouvelleTransaction);
  trierParDate();
  sauvegarder();

  // On remet le formulaire à zéro (dépense et date du jour par défaut)
  formulaire.reset();
  document.querySelector('input[name="type"][value="depense"]').checked = true;
  dateInput.value = obtenirDateDuJour();

  mettreAJourAffichage();
});

// SUPPRESSION D'UNE TRANSACTION

function supprimerTransaction(id) {
  const nouveauTableau = [];

  // On garde uniquement les transactions qui n'ont pas l'id supprimé
  for (let i = 0; i < transactions.length; i = i + 1) {
    if (transactions[i].id !== id) {
      nouveauTableau.push(transactions[i]);
    }
  }

  transactions = nouveauTableau;
  sauvegarder();
  mettreAJourAffichage();
}

// LANCEMENT AU CHARGEMENT DE LA PAGE
transactions = chargerTransactions();
trierParDate();
dateInput.value = obtenirDateDuJour();
mettreAJourAffichage();

// NAVIGATION PAR ONGLETS (tâche 3 : Matthieu)

// Affiche la vue demandée et masque les autres, sans recharger la page.
// nomVue vaut "vue-budget", "vue-plafonds" ou "vue-graphiques".
function changerOnglet(nomVue) {
  const nomsVues = ["vue-budget", "vue-plafonds", "vue-graphiques"];

  // 1. Afficher la vue demandée et masquer les deux autres
  for (let i = 0; i < nomsVues.length; i = i + 1) {
    const vue = document.getElementById(nomsVues[i]);
    if (nomsVues[i] === nomVue) {
      vue.classList.remove("masque");
    } else {
      vue.classList.add("masque");
    }
  }

  // 2. Mettre en évidence le bouton de l'onglet actif
  const onglets = document.querySelectorAll(".onglets .onglet");
  for (let i = 0; i < onglets.length; i = i + 1) {
    if (onglets[i].getAttribute("aria-controls") === nomVue) {
      onglets[i].classList.add("onglet-actif");
      onglets[i].setAttribute("aria-selected", "true");
    } else {
      onglets[i].classList.remove("onglet-actif");
      onglets[i].setAttribute("aria-selected", "false");
    }
  }
}

// Au chargement, on affiche l'onglet Budget
changerOnglet("vue-budget");

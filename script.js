// ============================================================
// CONNEXION À SUPABASE
// ============================================================

// Adresse de notre projet et clé publique ("publishable") : elle peut être visible
// dans le code, car les règles RLS de Supabase protègent les données de chacun.
const SUPABASE_URL = "https://ncxayktkblpsuvirnsnj.supabase.co/";
const SUPABASE_CLE = "sb_publishable__xm3IKCaSwoZ-EkPfVVr7Q_fqM1hpQB";

const clientSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_CLE);


// ============================================================
// ÉLÉMENTS HTML UTILISÉS PAR LE SCRIPT
// ============================================================

// Connexion
const formAuth = document.getElementById("form-auth");
const emailInput = document.getElementById("email");
const motDePasseInput = document.getElementById("mot-de-passe");
const boutonInscription = document.getElementById("btn-inscription");
const messageAuth = document.getElementById("message-auth");

// Budget
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

// Plafonds et score
const formPlafonds = document.getElementById("form-plafonds");
const plafondCategorieInput = document.getElementById("plafond-categorie");
const plafondSemaineInput = document.getElementById("plafond-semaine");
const plafondMoisInput = document.getElementById("plafond-mois");
const listePlafondsContenu = document.getElementById("liste-plafonds-contenu");
const scoreFinancierElement = document.getElementById("score-financier");
const texteScoreElement = document.getElementById("texte-score");

// Les trois vues de l'application (l'écran de connexion est à part)
const NOMS_VUES = ["vue-budget", "vue-plafonds", "vue-graphiques"];


// ============================================================
// DONNÉES DE L'UTILISATEUR CONNECTÉ (remplies depuis Supabase)
// ============================================================

let transactions = [];
let plafonds = [];
let graphiqueReel = null;
let graphiqueTheorique = null;


// ============================================================
// FONCTIONS UTILES
// ============================================================

// Arrondit à 2 décimales (évite les erreurs comme 0.1 + 0.2 = 0.30000000000000004)
function arrondirMontant(montant) {
  return Math.round(montant * 100) / 100;
}

// 12.5 -> "12,50 €"
function formaterPrix(montant) {
  return montant.toFixed(2).replace(".", ",") + " €";
}

// "2026-10-05" -> "05/10/2026"
function formaterDate(dateTexte) {
  const parties = dateTexte.split("-");
  const annee = parties[0];
  const mois = parties[1];
  const jour = parties[2];
  return jour + "/" + mois + "/" + annee;
}

// "loyer" -> "Loyer"
function formaterNomCategorie(categorie) {
  return categorie.charAt(0).toUpperCase() + categorie.slice(1);
}

// Date du jour au format "2026-10-05", celui qu'attend le champ date
function obtenirDateDuJour() {
  const aujourdhui = new Date();
  const annee = aujourdhui.getFullYear();
  const mois = (aujourdhui.getMonth() + 1).toString().padStart(2, "0");
  const jour = aujourdhui.getDate().toString().padStart(2, "0");
  return annee + "-" + mois + "-" + jour;
}

// Indique si une date ("2026-10-05") tombe dans le mois en cours.
// Les 7 premiers caractères d'une date contiennent l'année et le mois ("2026-10").
function estDuMoisActuel(dateTexte) {
  return dateTexte.slice(0, 7) === obtenirDateDuJour().slice(0, 7);
}

// Remplace les caractères spéciaux du HTML : un libellé tapé par l'utilisateur
// s'affiche tel quel au lieu d'être interprété comme du code (protection contre l'injection).
function nettoyerTexte(texte) {
  let resultat = String(texte);
  resultat = resultat.replaceAll("&", "&amp;");
  resultat = resultat.replaceAll("<", "&lt;");
  resultat = resultat.replaceAll(">", "&gt;");
  resultat = resultat.replaceAll('"', "&quot;");
  return resultat;
}

// Garde le détail technique dans la console et prévient l'utilisateur
function signalerErreur(erreur, message) {
  console.error(erreur);
  alert(message);
}

// Lit un champ de montant : null s'il est vide, sinon le nombre arrondi
function lireMontantSaisi(valeurChamp) {
  if (valeurChamp === "") {
    return null;
  }
  return arrondirMontant(Number(valeurChamp));
}


// ============================================================
// TRANSACTIONS (Léo)
// ============================================================

// Grâce aux règles RLS, Supabase ne renvoie que les transactions de l'utilisateur connecté.
async function chargerTransactionsDepuisSupabase() {
  const reponse = await clientSupabase
    .from("transactions")
    .select("*");

  if (reponse.error) {
    signalerErreur(reponse.error, "Impossible de charger vos transactions. Vérifiez votre connexion.");
    return;
  }

  transactions = reponse.data;
  trierParDate();
  mettreAJourAffichage();
  calculerEtAfficherScore();
  actualiserGraphiques();
}

// De la plus récente à la plus ancienne.
// À date égale, la dernière ajoutée (id le plus grand) passe en premier.
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

// Solde de toutes les transactions : revenus moins dépenses
function calculerSolde() {
  let solde = 0;
  for (let i = 0; i < transactions.length; i = i + 1) {
    const transaction = transactions[i];
    if (transaction.type === "revenu") {
      solde = arrondirMontant(solde + Number(transaction.montant));
    } else {
      solde = arrondirMontant(solde - Number(transaction.montant));
    }
  }
  return solde;
}

// Total du mois en cours pour un type de transaction ("revenu" ou "depense")
function calculerTotalDuMois(type) {
  let total = 0;
  for (let i = 0; i < transactions.length; i = i + 1) {
    const transaction = transactions[i];
    if (transaction.type === type && estDuMoisActuel(transaction.date)) {
      total = arrondirMontant(total + Number(transaction.montant));
    }
  }
  return total;
}

// Crée la ligne <li> d'une transaction : libellé, catégorie, date, montant et corbeille
function creerLigneTransaction(transaction) {
  let classeCouleur = "montant-depense";
  let signe = "-";
  if (transaction.type === "revenu") {
    classeCouleur = "montant-revenu";
    signe = "+";
  }

  const ligne = document.createElement("li");
  ligne.innerHTML = `
    <div>
      <strong>${nettoyerTexte(transaction.libelle)}</strong>
      <small class="details-transaction">
        ${nettoyerTexte(transaction.categorie)} • ${formaterDate(transaction.date)}
      </small>
    </div>
    <div class="actions-transaction">
      <span class="${classeCouleur}">${signe} ${formaterPrix(Number(transaction.montant))}</span>
      <button class="bouton-supprimer" onclick="supprimerTransaction(${transaction.id})" title="Supprimer" aria-label="Supprimer la transaction">
        🗑
      </button>
    </div>
  `;
  return ligne;
}

function afficherListeTransactions() {
  listeTransactions.innerHTML = "";

  if (transactions.length === 0) {
    messageVide.classList.remove("masque");
  } else {
    messageVide.classList.add("masque");
  }

  for (let i = 0; i < transactions.length; i = i + 1) {
    listeTransactions.appendChild(creerLigneTransaction(transactions[i]));
  }
}

// Met à jour la liste, le solde et la synthèse du mois
function mettreAJourAffichage() {
  afficherListeTransactions();
  soldeElement.textContent = formaterPrix(calculerSolde());
  revenusMoisElement.textContent = "+ " + formaterPrix(calculerTotalDuMois("revenu"));
  depensesMoisElement.textContent = "- " + formaterPrix(calculerTotalDuMois("depense"));
}

// Remet le formulaire à zéro, avec "Dépense" et la date du jour par défaut
function reinitialiserFormulaireTransaction() {
  formulaire.reset();
  document.querySelector('input[name="type"][value="depense"]').checked = true;
  dateInput.value = obtenirDateDuJour();
}

async function ajouterTransaction(evenement) {
  evenement.preventDefault();

  // Un libellé fait uniquement d'espaces n'est pas accepté
  const libelleNettoye = libelleInput.value.trim();
  if (libelleNettoye === "") {
    alert("Merci d'écrire un libellé.");
    return;
  }

  // Pas d'id ni de user_id : Supabase les remplit tout seul
  const nouvelleTransaction = {
    montant: arrondirMontant(parseFloat(montantInput.value)),
    categorie: categorieInput.value,
    date: dateInput.value,
    libelle: libelleNettoye,
    type: document.querySelector('input[name="type"]:checked').value
  };

  const reponse = await clientSupabase
    .from("transactions")
    .insert(nouvelleTransaction);

  if (reponse.error) {
    signalerErreur(reponse.error, "Impossible d'ajouter la transaction. Vérifiez votre connexion.");
    return;
  }

  reinitialiserFormulaireTransaction();
  await chargerTransactionsDepuisSupabase();
}

async function supprimerTransaction(id) {
  const reponse = await clientSupabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (reponse.error) {
    signalerErreur(reponse.error, "Impossible de supprimer la transaction. Vérifiez votre connexion.");
    return;
  }

  await chargerTransactionsDepuisSupabase();
}


// ============================================================
// PLAFONDS ET SCORE (Albin)
// ============================================================

// Règle du score :
// - on part de 100 points ;
// - pour chaque catégorie dont le plafond mensuel est dépassé, on retire 1 point
//   par pourcent de dépassement, avec au plus 60 points retirés par catégorie ;
// - le score ne descend jamais sous 0 ;
// - couleur : vert à partir de 75, orange à partir de 50, rouge en dessous.
// Seul le plafond mensuel compte : le plafond par semaine est seulement affiché.
const SCORE_DE_DEPART = 100;
const PENALITE_MAX_PAR_CATEGORIE = 60;
const SEUIL_VERT = 75;
const SEUIL_ORANGE = 50;

async function chargerPlafondsDepuisSupabase() {
  const reponse = await clientSupabase
    .from("plafonds")
    .select("*")
    .order("categorie", { ascending: true });

  if (reponse.error) {
    signalerErreur(reponse.error, "Impossible de charger vos plafonds.");
    return;
  }

  plafonds = reponse.data;
  afficherPlafonds();
  calculerEtAfficherScore();
  actualiserGraphiques();
}

// "50,00 € / semaine — 200,00 € / mois" (seulement les montants renseignés)
function formaterMontantsPlafond(plafond) {
  let texte = "";

  if (plafond.montant_max_semaine !== null) {
    texte = texte + formaterPrix(Number(plafond.montant_max_semaine)) + " / semaine";
  }
  if (plafond.montant_max_semaine !== null && plafond.montant_max_mois !== null) {
    texte = texte + " — ";
  }
  if (plafond.montant_max_mois !== null) {
    texte = texte + formaterPrix(Number(plafond.montant_max_mois)) + " / mois";
  }

  return texte;
}

function creerLignePlafond(plafond) {
  const ligne = document.createElement("div");
  ligne.className = "plafond-ligne";

  const categorie = document.createElement("span");
  categorie.className = "plafond-categorie";
  categorie.textContent = formaterNomCategorie(plafond.categorie);

  const montants = document.createElement("span");
  montants.className = "plafond-montants";
  montants.textContent = formaterMontantsPlafond(plafond);

  ligne.appendChild(categorie);
  ligne.appendChild(montants);
  return ligne;
}

function afficherPlafonds() {
  listePlafondsContenu.innerHTML = "";

  if (plafonds.length === 0) {
    listePlafondsContenu.textContent = "Aucun plafond enregistré pour le moment.";
    return;
  }

  for (let i = 0; i < plafonds.length; i = i + 1) {
    listePlafondsContenu.appendChild(creerLignePlafond(plafonds[i]));
  }
}

// Renvoie le message d'erreur à afficher, ou "" si la saisie est correcte
function verifierSaisiePlafond(categorie, montantSemaine, montantMois) {
  if (categorie === "") {
    return "Veuillez choisir une catégorie.";
  }
  if (montantSemaine === null && montantMois === null) {
    return "Veuillez renseigner au moins un plafond.";
  }
  if ((montantSemaine !== null && montantSemaine < 0) || (montantMois !== null && montantMois < 0)) {
    return "Les plafonds ne peuvent pas être négatifs.";
  }
  return "";
}

// Ajoute le plafond, ou le modifie s'il existe déjà pour cette catégorie
async function enregistrerPlafond(evenement) {
  evenement.preventDefault();

  const categorie = plafondCategorieInput.value;
  const montantSemaine = lireMontantSaisi(plafondSemaineInput.value);
  const montantMois = lireMontantSaisi(plafondMoisInput.value);

  const messageErreur = verifierSaisiePlafond(categorie, montantSemaine, montantMois);
  if (messageErreur !== "") {
    alert(messageErreur);
    return;
  }

  const reponseUtilisateur = await clientSupabase.auth.getUser();
  if (reponseUtilisateur.error || !reponseUtilisateur.data.user) {
    alert("Vous devez être connecté pour enregistrer un plafond.");
    return;
  }

  const nouveauPlafond = {
    user_id: reponseUtilisateur.data.user.id,
    categorie: categorie
  };

  // On n'envoie que les montants remplis : un champ laissé vide
  // ne remplace pas le plafond déjà enregistré pour cette catégorie.
  if (montantSemaine !== null) {
    nouveauPlafond.montant_max_semaine = montantSemaine;
  }
  if (montantMois !== null) {
    nouveauPlafond.montant_max_mois = montantMois;
  }

  // "upsert" : ajoute la ligne, ou la modifie si ce couple utilisateur + catégorie existe déjà
  const reponse = await clientSupabase
    .from("plafonds")
    .upsert(nouveauPlafond, { onConflict: "user_id,categorie" });

  if (reponse.error) {
    signalerErreur(reponse.error, "Impossible d'enregistrer ce plafond.");
    return;
  }

  formPlafonds.reset();
  await chargerPlafondsDepuisSupabase();
}

function aUnPlafondMensuel(plafond) {
  return plafond.montant_max_mois !== null && Number(plafond.montant_max_mois) > 0;
}

// Total des dépenses du mois en cours dans une catégorie
function calculerDepensesDuMoisPourCategorie(categorie) {
  let total = 0;
  for (let i = 0; i < transactions.length; i = i + 1) {
    const transaction = transactions[i];
    if (
      transaction.type === "depense" &&
      transaction.categorie === categorie &&
      estDuMoisActuel(transaction.date)
    ) {
      total = total + Number(transaction.montant);
    }
  }
  return total;
}

// Points retirés pour une catégorie (0 si le plafond mensuel n'est pas dépassé)
function calculerPenalite(plafond) {
  const plafondMois = Number(plafond.montant_max_mois);
  const depenses = calculerDepensesDuMoisPourCategorie(plafond.categorie);

  if (plafondMois <= 0 || depenses <= plafondMois) {
    return 0;
  }

  const pourcentageDepassement = ((depenses - plafondMois) / plafondMois) * 100;
  let penalite = Math.round(pourcentageDepassement);
  if (penalite > PENALITE_MAX_PAR_CATEGORIE) {
    penalite = PENALITE_MAX_PAR_CATEGORIE;
  }
  return penalite;
}

function calculerScore() {
  let score = SCORE_DE_DEPART;
  for (let i = 0; i < plafonds.length; i = i + 1) {
    score = score - calculerPenalite(plafonds[i]);
  }
  if (score < 0) {
    score = 0;
  }
  return score;
}

function retirerCouleurScore() {
  scoreFinancierElement.classList.remove("score-vert", "score-orange", "score-rouge");
}

// Sans plafond mensuel, il n'y a rien à comparer : pas de score
function afficherAbsenceDeScore() {
  retirerCouleurScore();
  scoreFinancierElement.textContent = "-- / 100";
  texteScoreElement.textContent = "Ajoutez au moins un plafond mensuel pour obtenir votre score.";
}

function afficherScore(score) {
  retirerCouleurScore();
  scoreFinancierElement.textContent = score + " / 100";

  if (score >= SEUIL_VERT) {
    scoreFinancierElement.classList.add("score-vert");
    texteScoreElement.textContent = "Budget bien maîtrisé.";
  } else if (score >= SEUIL_ORANGE) {
    scoreFinancierElement.classList.add("score-orange");
    texteScoreElement.textContent = "Votre budget est à surveiller.";
  } else {
    scoreFinancierElement.classList.add("score-rouge");
    texteScoreElement.textContent = "Attention : plusieurs plafonds sont dépassés.";
  }
}

function calculerEtAfficherScore() {
  let auMoinsUnPlafondMensuel = false;
  for (let i = 0; i < plafonds.length; i = i + 1) {
    if (aUnPlafondMensuel(plafonds[i])) {
      auMoinsUnPlafondMensuel = true;
    }
  }

  if (auMoinsUnPlafondMensuel) {
    afficherScore(calculerScore());
  } else {
    afficherAbsenceDeScore();
  }
}


// ============================================================
// GRAPHIQUES CHART.JS (Albin)
// ============================================================

// Active le module qui affiche les pourcentages sur les camemberts.
// La condition évite de bloquer tout le site si le module n'a pas pu se charger.
if (typeof ChartDataLabels !== "undefined") {
  Chart.register(ChartDataLabels);
}

// Une couleur fixe par catégorie : les deux graphiques restent faciles à comparer
const COULEURS_CATEGORIES = {
  loyer: "#1E3A8A",
  courses: "#34D399",
  transport: "#F59E0B",
  loisirs: "#8B5CF6",
  abonnements: "#EF4444",
  autres: "#6B7280"
};
const COULEUR_PAR_DEFAUT = "#6B7280";

function obtenirCouleurCategorie(categorie) {
  if (COULEURS_CATEGORIES[categorie] === undefined) {
    return COULEUR_PAR_DEFAUT;
  }
  return COULEURS_CATEGORIES[categorie];
}

// Dépenses du mois en cours, regroupées par catégorie.
// Exemple de résultat : { courses: 120, loisirs: 45.5 }
function obtenirDepensesReellesDuMois() {
  const totauxParCategorie = {};

  for (let i = 0; i < transactions.length; i = i + 1) {
    const transaction = transactions[i];
    if (transaction.type === "depense" && estDuMoisActuel(transaction.date)) {
      if (totauxParCategorie[transaction.categorie] === undefined) {
        totauxParCategorie[transaction.categorie] = 0;
      }
      totauxParCategorie[transaction.categorie] =
        totauxParCategorie[transaction.categorie] + Number(transaction.montant);
    }
  }

  return totauxParCategorie;
}

// Texte affiché sur une part du camembert (ex : "25,0 %").
// Chart.js appelle cette fonction pour chaque part, avec sa valeur et le graphique (contexte).
function formaterPourcentage(valeur, contexte) {
  const montants = contexte.dataset.data;
  let total = 0;
  for (let i = 0; i < montants.length; i = i + 1) {
    total = total + Number(montants[i]);
  }

  // Pas de pourcentage si le total ou le montant est nul (évite une division par zéro)
  if (total === 0 || Number(valeur) === 0) {
    return "";
  }

  const pourcentage = (Number(valeur) / total) * 100;
  return pourcentage.toFixed(1).replace(".", ",") + " %";
}

// categories et montants sont deux listes de même longueur
function dessinerCamembert(idCanvas, categories, montants) {
  const contexte = document.getElementById(idCanvas).getContext("2d");

  const noms = [];
  const couleurs = [];
  for (let i = 0; i < categories.length; i = i + 1) {
    noms.push(formaterNomCategorie(categories[i]));
    couleurs.push(obtenirCouleurCategorie(categories[i]));
  }

  return new Chart(contexte, {
    type: "pie",
    data: {
      labels: noms,
      datasets: [
        {
          data: montants,
          backgroundColor: couleurs,
          borderColor: "#FFFFFF",
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        },
        datalabels: {
          formatter: formaterPourcentage,
          color: "#FFFFFF",
          textStrokeColor: "#1F2937",
          textStrokeWidth: 2,
          font: {
            weight: "bold",
            size: 14
          }
        }
      }
    }
  });
}

function creerGraphiqueReel() {
  const depensesParCategorie = obtenirDepensesReellesDuMois();

  // Chart.js attend deux listes : les catégories et les montants
  const categories = [];
  const montants = [];
  for (const categorie in depensesParCategorie) {
    categories.push(categorie);
    montants.push(depensesParCategorie[categorie]);
  }

  // Chart.js refuse de dessiner sur un canvas déjà utilisé : on supprime l'ancien graphique
  if (graphiqueReel !== null) {
    graphiqueReel.destroy();
  }
  graphiqueReel = dessinerCamembert("graphique-reel", categories, montants);
}

function creerGraphiqueTheorique() {
  const categories = [];
  const montants = [];
  for (let i = 0; i < plafonds.length; i = i + 1) {
    if (aUnPlafondMensuel(plafonds[i])) {
      categories.push(plafonds[i].categorie);
      montants.push(Number(plafonds[i].montant_max_mois));
    }
  }

  if (graphiqueTheorique !== null) {
    graphiqueTheorique.destroy();
  }
  graphiqueTheorique = dessinerCamembert("graphique-theorique", categories, montants);
}

function actualiserGraphiques() {
  creerGraphiqueReel();
  creerGraphiqueTheorique();
}


// ============================================================
// NAVIGATION PAR ONGLETS (Matthieu)
// ============================================================

// Affiche la vue demandée et masque les autres, sans recharger la page.
// nomVue vaut "vue-budget", "vue-plafonds" ou "vue-graphiques".
function changerOnglet(nomVue) {
  for (let i = 0; i < NOMS_VUES.length; i = i + 1) {
    const vue = document.getElementById(NOMS_VUES[i]);
    if (NOMS_VUES[i] === nomVue) {
      vue.classList.remove("masque");
    } else {
      vue.classList.add("masque");
    }
  }

  // Met en évidence le bouton de l'onglet actif
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


// ============================================================
// CONNEXION, INSCRIPTION, DÉCONNEXION (Léo)
// ============================================================

// Supabase renvoie ses erreurs en anglais : on les traduit pour l'utilisateur
function traduireErreurAuth(erreur) {
  const code = erreur.code;
  const message = erreur.message;

  if (code === "invalid_credentials" || message === "Invalid login credentials") {
    return "Email ou mot de passe incorrect. Pas encore de compte ? Cliquez sur Créer mon compte.";
  }
  if (code === "user_already_exists" || message === "User already registered") {
    return "Un compte existe déjà avec cet email. Cliquez sur Se connecter.";
  }
  if (code === "weak_password") {
    return "Mot de passe trop faible : il faut au moins 6 caractères.";
  }
  if (code === "email_address_invalid") {
    return "Cette adresse email n'est pas valide.";
  }
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
    return "Trop de tentatives. Patientez quelques minutes puis réessayez.";
  }
  return "Une erreur est survenue. Vérifiez votre connexion et réessayez.";
}

// Affiche l'erreur éventuelle sous les boutons, ou efface l'ancien message
function afficherResultatAuth(reponse) {
  if (reponse.error) {
    messageAuth.textContent = traduireErreurAuth(reponse.error);
  } else {
    messageAuth.textContent = "";
  }
}

// "async" et "await" servent à attendre la réponse de Supabase avant de continuer
async function inscrire() {
  if (emailInput.value === "" || motDePasseInput.value === "") {
    messageAuth.textContent = "Merci de remplir l'email et le mot de passe.";
    return;
  }

  const reponse = await clientSupabase.auth.signUp({
    email: emailInput.value,
    password: motDePasseInput.value
  });
  afficherResultatAuth(reponse);
}

async function connecter(evenement) {
  evenement.preventDefault();

  const reponse = await clientSupabase.auth.signInWithPassword({
    email: emailInput.value,
    password: motDePasseInput.value
  });
  afficherResultatAuth(reponse);
}

async function deconnexion() {
  await clientSupabase.auth.signOut();
}


// ============================================================
// AFFICHAGE SELON LA CONNEXION
// ============================================================

function afficherEcranConnexion() {
  document.getElementById("barre-navigation").classList.add("masque");
  for (let i = 0; i < NOMS_VUES.length; i = i + 1) {
    document.getElementById(NOMS_VUES[i]).classList.add("masque");
  }
  document.getElementById("vue-auth").classList.remove("masque");

  // On vide les champs et les données en mémoire : la personne suivante ne doit rien voir
  emailInput.value = "";
  motDePasseInput.value = "";
  messageAuth.textContent = "";
  transactions = [];
  plafonds = [];
  listePlafondsContenu.textContent = "";
  mettreAJourAffichage();
  calculerEtAfficherScore();
  actualiserGraphiques();
}

function afficherApplication() {
  document.getElementById("vue-auth").classList.add("masque");
  document.getElementById("barre-navigation").classList.remove("masque");
  changerOnglet("vue-budget");

  // "setTimeout" retarde le chargement d'un instant :
  // Supabase déconseille de l'appeler directement dans onAuthStateChange.
  setTimeout(chargerTransactionsDepuisSupabase, 0);
  setTimeout(chargerPlafondsDepuisSupabase, 0);
}

// Supabase peut prévenir plusieurs fois pour la même connexion (par exemple quand
// on revient sur la fenêtre du navigateur). Sans cette variable, on serait renvoyé
// sur l'onglet Budget à chaque fois.
let applicationAffichee = false;


// ============================================================
// DÉMARRAGE
// ============================================================

dateInput.value = obtenirDateDuJour();
mettreAJourAffichage();

formAuth.addEventListener("submit", connecter);
boutonInscription.addEventListener("click", inscrire);
formulaire.addEventListener("submit", ajouterTransaction);
formPlafonds.addEventListener("submit", enregistrerPlafond);

// Supabase prévient le site à chaque changement : ouverture de la page, inscription,
// connexion ou déconnexion. "session" contient l'utilisateur connecté, ou rien.
clientSupabase.auth.onAuthStateChange(function (evenement, session) {
  if (session) {
    if (applicationAffichee === false) {
      applicationAffichee = true;
      afficherApplication();
    }
  } else {
    applicationAffichee = false;
    afficherEcranConnexion();
  }
});

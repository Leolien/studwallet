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

const formPlafonds = document.getElementById("form-plafonds");
const plafondCategorieInput = document.getElementById("plafond-categorie");
const plafondSemaineInput = document.getElementById("plafond-semaine");
const plafondMoisInput = document.getElementById("plafond-mois");
const listePlafondsContenu = document.getElementById("liste-plafonds-contenu");
const scoreFinancierElement = document.getElementById("score-financier");
const texteScoreElement = document.getElementById("texte-score");

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

// CHARGEMENT DES TRANSACTIONS (Supabase)

// Liste des transactions de l'utilisateur connecté (elle est remplie depuis Supabase)
let transactions = [];
let plafonds = [];

// Lit dans Supabase les transactions de l'utilisateur connecté.
// Grâce aux règles RLS, Supabase ne renvoie que SES transactions.
async function chargerTransactionsDepuisSupabase() {
  const reponse = await clientSupabase
    .from("transactions")
    .select("*");

  if (reponse.error) {
    console.error(reponse.error);
    alert("Impossible de charger vos transactions. Vérifiez votre connexion.");
    return;
  }

  transactions = reponse.data;
  trierParDate();
  mettreAJourAffichage();
  calculerEtAfficherScore();
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

formulaire.addEventListener("submit", async function (evenement) {
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

  // Création de la transaction.
  // Pas d'id ni de user_id : Supabase les remplit tout seul.
  const nouvelleTransaction = {
    montant: arrondirMontant(parseFloat(montantInput.value)),
    categorie: categorieInput.value,
    date: dateInput.value,
    libelle: libelleNettoye,
    type: typeCoche
  };

  // Envoi dans Supabase (on attend la réponse avant de continuer)
  const reponse = await clientSupabase
    .from("transactions")
    .insert(nouvelleTransaction);

  if (reponse.error) {
    console.error(reponse.error);
    alert("Impossible d'ajouter la transaction. Vérifiez votre connexion.");
    return;
  }

  // On remet le formulaire à zéro (dépense et date du jour par défaut)
  formulaire.reset();
  document.querySelector('input[name="type"][value="depense"]').checked = true;
  dateInput.value = obtenirDateDuJour();

  // On relit la liste dans Supabase pour afficher la nouvelle transaction
  await chargerTransactionsDepuisSupabase();
});

// SUPPRESSION D'UNE TRANSACTION

async function supprimerTransaction(id) {
  // On demande à Supabase de supprimer la ligne qui a cet id
  const reponse = await clientSupabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (reponse.error) {
    console.error(reponse.error);
    alert("Impossible de supprimer la transaction. Vérifiez votre connexion.");
    return;
  }

  // On relit la liste dans Supabase pour mettre l'affichage à jour
  await chargerTransactionsDepuisSupabase();
}

// PLAFONDS ET SCORE (tâche 6 : Albin)

// Règle du score (à valider par le groupe) :
// - on part de 100 points
// - pour chaque catégorie dont le plafond mensuel est dépassé, on retire
//   1 point par pourcent de dépassement, avec un maximum de 60 points par catégorie
// - le score ne descend jamais sous 0
// - couleur : vert à partir de 75, orange à partir de 50, rouge en dessous
// - seul le plafond mensuel compte dans le score (le plafond par semaine est seulement affiché)
const PENALITE_MAX_PAR_CATEGORIE = 60;
const SEUIL_VERT = 75;
const SEUIL_ORANGE = 50;

// Met la première lettre en majuscule (ex : "loyer" -> "Loyer")
function formaterNomCategorie(categorie) {
  return categorie.charAt(0).toUpperCase() + categorie.slice(1);
}

// Lit dans Supabase les plafonds de l'utilisateur connecté, puis met l'affichage à jour
async function chargerPlafondsDepuisSupabase() {
  const reponse = await clientSupabase
    .from("plafonds")
    .select("*")
    .order("categorie", { ascending: true });

  if (reponse.error) {
    console.error(reponse.error);
    alert("Impossible de charger vos plafonds.");
    return;
  }

  plafonds = reponse.data;
  afficherPlafonds();
  calculerEtAfficherScore();
}

// Affiche la liste des plafonds dans la carte "Plafonds actuels"
function afficherPlafonds() {
  listePlafondsContenu.innerHTML = "";

  if (plafonds.length === 0) {
    listePlafondsContenu.textContent =
      "Aucun plafond enregistré pour le moment.";
    return;
  }

  for (let i = 0; i < plafonds.length; i = i + 1) {
    const plafond = plafonds[i];

    const ligne = document.createElement("div");
    ligne.className = "plafond-ligne";

    const categorie = document.createElement("span");
    categorie.className = "plafond-categorie";
    categorie.textContent = formaterNomCategorie(plafond.categorie);

    const montants = document.createElement("span");
    montants.className = "plafond-montants";

    const montantSemaine = plafond.montant_max_semaine;
    const montantMois = plafond.montant_max_mois;

    let texteMontants = "";

    if (montantSemaine !== null) {
      texteMontants +=
        formaterPrix(Number(montantSemaine)) + " / semaine";
    }

    if (montantSemaine !== null && montantMois !== null) {
      texteMontants += " — ";
    }

    if (montantMois !== null) {
      texteMontants +=
        formaterPrix(Number(montantMois)) + " / mois";
    }

    montants.textContent = texteMontants;

    ligne.appendChild(categorie);
    ligne.appendChild(montants);
    listePlafondsContenu.appendChild(ligne);
  }
}

// Enregistre le plafond saisi dans le formulaire (ajout, ou modification s'il existe déjà)
async function enregistrerPlafond(evenement) {
  evenement.preventDefault();

  const categorie = plafondCategorieInput.value;
  const valeurSemaine = plafondSemaineInput.value;
  const valeurMois = plafondMoisInput.value;

  if (categorie === "") {
    alert("Veuillez choisir une catégorie.");
    return;
  }

  if (valeurSemaine === "" && valeurMois === "") {
    alert("Veuillez renseigner au moins un plafond.");
    return;
  }

  const montantSemaine =
    valeurSemaine === "" ? null : arrondirMontant(Number(valeurSemaine));

  const montantMois =
    valeurMois === "" ? null : arrondirMontant(Number(valeurMois));

  if (
    (montantSemaine !== null && montantSemaine < 0) ||
    (montantMois !== null && montantMois < 0)
  ) {
    alert("Les plafonds ne peuvent pas être négatifs.");
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

  // "upsert" = ajouter, ou modifier si la ligne (même utilisateur, même catégorie) existe déjà
  const reponse = await clientSupabase
    .from("plafonds")
    .upsert(nouveauPlafond, {
      onConflict: "user_id,categorie"
    });

  if (reponse.error) {
    console.error(reponse.error);
    alert("Impossible d'enregistrer ce plafond.");
    return;
  }

  formPlafonds.reset();

  await chargerPlafondsDepuisSupabase();
}

// Calcule le score de santé financière (voir la règle plus haut) puis l'affiche
function calculerEtAfficherScore() {
  // Le score ne se calcule que sur les plafonds mensuels : on les compte
  let nombrePlafondsMensuels = 0;
  for (let i = 0; i < plafonds.length; i = i + 1) {
    if (plafonds[i].montant_max_mois !== null && Number(plafonds[i].montant_max_mois) > 0) {
      nombrePlafondsMensuels = nombrePlafondsMensuels + 1;
    }
  }

  if (nombrePlafondsMensuels === 0) {
    scoreFinancierElement.textContent = "-- / 100";

    scoreFinancierElement.classList.remove(
      "score-vert",
      "score-orange",
      "score-rouge"
    );

    texteScoreElement.textContent =
      "Ajoutez au moins un plafond mensuel pour obtenir votre score.";

    return;
  }

  const dateAujourdhui = new Date();
  const moisActuel = (dateAujourdhui.getMonth() + 1)
    .toString()
    .padStart(2, "0");

  const anneeActuelle = dateAujourdhui.getFullYear().toString();

  let score = 100;

  // Pour chaque plafond, on additionne les dépenses du mois dans cette catégorie
  for (let i = 0; i < plafonds.length; i = i + 1) {
    const plafond = plafonds[i];
    let totalDepensesCategorie = 0;

    for (let j = 0; j < transactions.length; j = j + 1) {
      const transaction = transactions[j];
      const partiesDate = transaction.date.split("-");
      const anneeTransaction = partiesDate[0];
      const moisTransaction = partiesDate[1];

      if (
        transaction.type === "depense" &&
        transaction.categorie === plafond.categorie &&
        anneeTransaction === anneeActuelle &&
        moisTransaction === moisActuel
      ) {
        totalDepensesCategorie =
          totalDepensesCategorie + Number(transaction.montant);
      }
    }

    const plafondMois = Number(plafond.montant_max_mois);

    // Si le plafond mensuel est dépassé, on calcule la pénalité
    if (plafondMois > 0 && totalDepensesCategorie > plafondMois) {
      const pourcentageDepassement =
        ((totalDepensesCategorie - plafondMois) / plafondMois) * 100;

      let penalite = Math.round(pourcentageDepassement);

      if (penalite > PENALITE_MAX_PAR_CATEGORIE) {
        penalite = PENALITE_MAX_PAR_CATEGORIE;
      }

      score = score - penalite;
    }
  }

  if (score < 0) {
    score = 0;
  }

  afficherScore(score);
}

// Affiche le score avec sa couleur et une phrase d'explication
function afficherScore(score) {
  scoreFinancierElement.textContent = score + " / 100";

  scoreFinancierElement.classList.remove(
    "score-vert",
    "score-orange",
    "score-rouge"
  );

  if (score >= SEUIL_VERT) {
    scoreFinancierElement.classList.add("score-vert");
    texteScoreElement.textContent = "Budget bien maîtrisé.";
  } else if (score >= SEUIL_ORANGE) {
    scoreFinancierElement.classList.add("score-orange");
    texteScoreElement.textContent = "Votre budget est à surveiller.";
  } else {
    scoreFinancierElement.classList.add("score-rouge");
    texteScoreElement.textContent =
      "Attention : plusieurs plafonds sont dépassés.";
  }
}

// LANCEMENT AU CHARGEMENT DE LA PAGE
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

// AUTHENTIFICATION (tâche 4 : Léo)

const formAuth = document.getElementById("form-auth");
const emailInput = document.getElementById("email");
const motDePasseInput = document.getElementById("mot-de-passe");
const boutonInscription = document.getElementById("btn-inscription");
const messageAuth = document.getElementById("message-auth");

// Transforme une erreur de Supabase (en anglais) en message français pour l'utilisateur
function traduireErreurAuth(erreur) {
  const code = erreur.code;
  const message = erreur.message;

  if (code === "invalid_credentials" || message === "Invalid login credentials") {
    return "Email ou mot de passe incorrect.";
  }
  if (code === "user_already_exists" || message === "User already registered") {
    return "Un compte existe déjà avec cet email. Cliquez sur « Se connecter ».";
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

  // Tout autre cas
  return "Une erreur est survenue. Vérifiez votre connexion et réessayez.";
}

// Inscription : crée un nouveau compte avec l'email et le mot de passe saisis.
// "async" et "await" servent à attendre la réponse de Supabase avant de continuer.
async function inscrire() {
  if (emailInput.value === "" || motDePasseInput.value === "") {
    messageAuth.textContent = "Merci de remplir l'email et le mot de passe.";
    return;
  }

  const reponse = await clientSupabase.auth.signUp({
    email: emailInput.value,
    password: motDePasseInput.value
  });

  if (reponse.error) {
    messageAuth.textContent = traduireErreurAuth(reponse.error);
  } else {
    messageAuth.textContent = "";
  }
}

// Connexion : vérifie l'email et le mot de passe saisis.
async function connecter() {
  const reponse = await clientSupabase.auth.signInWithPassword({
    email: emailInput.value,
    password: motDePasseInput.value
  });

  if (reponse.error) {
    messageAuth.textContent = traduireErreurAuth(reponse.error);
  } else {
    messageAuth.textContent = "";
  }
}

// Déconnexion : appelée par le bouton "Déconnexion" de la barre de navigation.
async function deconnexion() {
  await clientSupabase.auth.signOut();
}

// Le formulaire (touche Entrée ou bouton "Se connecter") lance la connexion
formAuth.addEventListener("submit", function (evenement) {
  evenement.preventDefault();
  connecter();
});

formPlafonds.addEventListener("submit", enregistrerPlafond);

// Le bouton "S'inscrire" lance l'inscription
boutonInscription.addEventListener("click", function () {
  inscrire();
});

// AFFICHAGE SELON LA CONNEXION

// Personne n'est connecté : on montre seulement l'écran de connexion
function afficherEcranConnexion() {
  document.getElementById("barre-navigation").classList.add("masque");
  document.getElementById("vue-budget").classList.add("masque");
  document.getElementById("vue-plafonds").classList.add("masque");
  document.getElementById("vue-graphiques").classList.add("masque");
  document.getElementById("vue-auth").classList.remove("masque");

  // On vide les champs et le message pour la personne suivante
  emailInput.value = "";
  motDePasseInput.value = "";
  messageAuth.textContent = "";

  // On efface aussi les transactions en mémoire : la personne suivante ne doit pas les voir
  transactions = [];
  plafonds = [];
  listePlafondsContenu.textContent = "";
  mettreAJourAffichage();
  calculerEtAfficherScore();
}

// Quelqu'un est connecté : on cache la connexion et on montre l'application
function afficherApplication() {
  document.getElementById("vue-auth").classList.add("masque");
  document.getElementById("barre-navigation").classList.remove("masque");
  changerOnglet("vue-budget");

  // On charge les transactions de l'utilisateur. "setTimeout" retarde l'appel d'un instant :
  // Supabase déconseille de l'appeler directement dans onAuthStateChange.
  setTimeout(chargerTransactionsDepuisSupabase, 0);
  setTimeout(chargerPlafondsDepuisSupabase, 0);
}

// Supabase prévient le site à chaque changement : ouverture de la page,
// inscription, connexion ou déconnexion. "session" contient l'utilisateur
// connecté, ou rien s'il n'y a personne.
clientSupabase.auth.onAuthStateChange(function (evenement, session) {
  if (session) {
    afficherApplication();
  } else {
    afficherEcranConnexion();
  }
});

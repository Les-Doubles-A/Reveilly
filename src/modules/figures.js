/* Module « Figures de style ».
   Banque de figures, normalisation et correction reprises telles quelles
   de la page « Quiz des figures de style » (contenu inchangé). */
import { esc } from '../core/util.js';

let RNG = Math.random;
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(RNG() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rnd = a => a[Math.floor(RNG() * a.length)];
const lc = s => s.charAt(0).toLowerCase() + s.slice(1);

const CATS={A:"Figures d’analogie",S:"Figures de substitution",I:"Amplification et atténuation",O:"Figures d’opposition",C:"Construction et répétition",N:"Sonorités et jeux de mots",P:"Énonciation et pensée"};
/* f(nom, catégorie, définition, exemples, options)
   exemple : "phrase" ou ["phrase","remarque affichée après la réponse"]
   x  : figures trop proches pour servir de mauvaise réponse (relation symétrique)
   ok : autres noms acceptés en saisie libre (figure plus générale)
   a  : autres noms de la figure */
const D=[];
function f(n,c,d,e,o={}){D.push({n,c,d,e:e.map(x=>Array.isArray(x)?{t:x[0],note:x[1]}:{t:x}),x:o.x||[],ok:o.ok||[],a:o.a||[]})}

/* ---------- Analogie ---------- */
f("Comparaison","A","Rapprocher deux éléments à l’aide d’un outil de comparaison (comme, tel, pareil à, semblable à, ressembler…).",
 ["La Terre est bleue comme une orange. (Éluard)","Il est rusé comme un renard.","Le Poète est semblable au prince des nuées. (Baudelaire)","Ses yeux brillaient tels deux diamants."],{x:["Synesthésie"]});
f("Métaphore","A","Rapprocher deux éléments sans outil de comparaison : on identifie directement l’un à l’autre.",
 ["Cette femme est une perle.","Ce professeur est un puits de science.","La vie est un long fleuve tranquille.","Paris est une fourmilière."],{x:["Métaphore filée","Catachrèse","Personnification","Allégorie"]});
f("Métaphore filée","A","Prolonger une même métaphore sur plusieurs mots ou plusieurs phrases, en développant son champ lexical.",
 ["Ma jeunesse ne fut qu’un ténébreux orage, / Traversé çà et là par de brillants soleils ; / Le tonnerre et la pluie ont fait un tel ravage / Qu’il reste en mon jardin bien peu de fruits vermeils. (Baudelaire)",
  "Le temps est un fleuve : ses eaux emportent nos jours, et nul ne remonte son courant.",
  "La mer de blé ondulait sous le vent ; des vagues dorées venaient mourir au pied des collines."],{x:["Allégorie","Personnification","Catachrèse"],ok:["Métaphore"]});
f("Personnification","A","Attribuer des caractéristiques humaines (sentiments, actions, paroles) à un animal, un objet ou une idée.",
 ["Le vent hurlait dans la nuit.","La ville s’éveille doucement.","Les arbres pleuraient leurs feuilles mortes.","Le soleil nous souriait."],{x:["Allégorie","Prosopopée","Apostrophe"]});
f("Allégorie","A","Représenter une idée abstraite par un être ou un objet concret, souvent personnifié et doté d’attributs symboliques.",
 ["La Justice tient une balance et porte un bandeau sur les yeux.","La Mort, squelette armé d’une faux, fauche les vivants.","Le Temps, vieillard ailé, emporte tout dans sa course."],{x:["Prosopopée"]});
f("Catachrèse","A","Métaphore entrée dans l’usage courant au point qu’on ne la perçoit plus comme une image.",
 ["Les pieds de la table.","Une aile d’avion.","Les dents d’un peigne.","Le bras d’un fauteuil.","Une bouche de métro."],{ok:["Métaphore"]});
f("Synesthésie","A","Associer des sensations qui relèvent de sens différents (vue, ouïe, odorat, toucher, goût).",
 ["Il est des parfums frais comme des chairs d’enfants, / Doux comme les hautbois, verts comme les prairies. (Baudelaire)","Une voix chaude et veloutée.","Un rouge criard.","Une musique acidulée."],{x:["Métaphore"],a:["correspondance","correspondances"]});

/* ---------- Substitution ---------- */
f("Métonymie","S","Désigner une chose par une autre qui lui est logiquement liée (contenant pour contenu, auteur pour œuvre, lieu pour institution…).",
 [["Boire un verre.","le contenant (le verre) désigne le contenu"],["J’ai lu un Zola cet été.","l’auteur désigne son œuvre"],["L’Élysée a démenti l’information.","le lieu désigne la présidence"],["Toute la salle applaudit.","le lieu désigne les spectateurs"]],{x:["Synecdoque","Périphrase","Antonomase"]});
f("Synecdoque","S","Cas particulier de métonymie : désigner le tout par une partie (ou l’inverse), l’objet par sa matière, l’espèce par l’individu…",
 [["Une voile apparut à l’horizon.","la voile (partie) désigne le bateau (tout)"],["Il a trois bouches à nourrir.","les bouches désignent les personnes"],["Les mortels ne connaissent pas l’avenir.","« les mortels » : les êtres humains"],["Il périt par le fer.","la matière (le fer) désigne l’épée"]],{x:["Périphrase"],ok:["Métonymie"]});
f("Périphrase","S","Remplacer un mot par une expression de plusieurs mots qui le définit ou le caractérise.",
 ["L’astre du jour.","La Ville lumière.","Le roi des animaux.","Le septième art."],{x:["Antonomase","Euphémisme","Métalepse"]});
f("Antonomase","S","Employer un nom propre comme nom commun (ou l’inverse) pour désigner un type de personne.",
 ["C’est un véritable Harpagon.","Ce séducteur est un vrai Don Juan.","Mon voisin est un Apollon.","Quel Tartuffe, celui-là !"],{x:["Métaphore"]});
f("Hypallage","S","Attribuer à un mot une caractéristique qui se rapporte logiquement à un autre mot de la phrase.",
 [["Ce marchand accoudé sur son comptoir avide. (Hugo)","c’est le marchand qui est avide, pas le comptoir"],["Ils allaient obscurs sous la nuit solitaire. (Virgile)","c’est la nuit qui est obscure, et eux qui sont solitaires"],["Il fuma une pensive cigarette.","c’est le fumeur qui est pensif"]],{x:["Personnification","Oxymore"]});
f("Métalepse","S","Exprimer une chose par une autre qui la précède ou la suit (la cause pour l’effet, l’antécédent pour le conséquent).",
 ["Il a vécu. (pour dire qu’il est mort)","Nous avons été Troyens. (pour dire que Troie n’est plus)","Il a fermé les yeux pour toujours."],{x:["Euphémisme"]});

/* ---------- Amplification et atténuation ---------- */
f("Hyperbole","I","Exagérer l’expression d’une idée ou d’une réalité pour la mettre en relief.",
 ["Je meurs de faim.","Je te l’ai répété mille fois.","Un bruit à réveiller les morts.","Il y avait des milliards de moustiques."],{x:["Gradation","Épanorthose"]});
f("Adynaton","I","Hyperbole poussée jusqu’à l’impossible, souvent pour dire « jamais ».",
 ["Quand les poules auront des dents.","Je te rendrai ton argent quand les poissons voleront.","Ce sera prêt à la Saint-Glinglin."],{ok:["Hyperbole"]});
f("Litote","I","Dire moins pour suggérer davantage, souvent par une tournure négative.",
 [["Va, je ne te hais point. (Corneille)","Chimène veut dire : je t’aime"],"Ce n’est pas mauvais du tout !","Il n’est pas bête, ce garçon.","Je ne suis pas mécontent de mon travail."],{x:["Euphémisme","Tapinose","Antiphrase","Chleuasme"]});
f("Euphémisme","I","Atténuer l’expression d’une réalité brutale, choquante ou triste.",
 ["Il nous a quittés.","Il s’est éteint dans la nuit.","Les non-voyants.","L’entreprise annonce un « plan de sauvegarde de l’emploi »."],{x:["Tapinose"]});
f("Tapinose","I","Désigner une réalité importante par un terme trop faible ou dévalorisant, souvent par ironie.",
 ["« Un petit coup de vent ! » (devant un ouragan)","« Une égratignure. » (pour une jambe cassée)","Un léger désagrément. (pour une catastrophe)"],{x:["Antiphrase"]});
f("Paradiastole","I","Présenter un défaut sous un jour flatteur en le renommant par une qualité voisine.",
 ["Il n’est pas avare, il est économe.","Elle n’est pas têtue, elle est persévérante.","Je ne suis pas paresseux, j’économise mon énergie."],{x:["Euphémisme","Épanorthose","Litote"]});
f("Gradation","I","Énumérer des termes d’intensité croissante (ou décroissante).",
 ["Va, cours, vole, et nous venge. (Corneille)","Un murmure, un cri, un hurlement.","Je me meurs, je suis mort, je suis enterré. (Molière)","C’est un roc ! … c’est un pic ! … c’est un cap ! (Rostand)"],{x:["Accumulation (énumération)","Asyndète","Épanorthose","Anaphore"],a:["climax"]});
f("Accumulation (énumération)","I","Juxtaposer une série de termes de même nature pour donner une impression d’abondance.",
 ["Adieu veau, vache, cochon, couvée. (La Fontaine)","Dans son sac : des clés, un stylo, un vieux ticket, des miettes et un caillou.","Il y avait des tables, des chaises, des lampes, des tapis et des livres partout."],{x:["Asyndète","Polysyndète","Hypotypose","Homéotéleute"]});
f("Pléonasme","I","Répéter une idée déjà exprimée, par maladresse ou pour insister.",
 ["Je l’ai vu, dis-je, vu, de mes propres yeux vu. (Molière)","Monter en haut.","Ils se sont entraidés mutuellement.","Je l’ai entendu de mes propres oreilles."],{x:["Épanorthose","Dérivation"]});

/* ---------- Opposition ---------- */
f("Antithèse","O","Opposer fortement deux mots, deux idées ou deux réalités dans une même phrase.",
 ["Je vis, je meurs ; je me brûle et me noie. (Louise Labé)","Le jour, il rit ; la nuit, il pleure.","Ici la paix, là-bas la guerre.","Il est riche de mots, pauvre d’idées."],{x:["Oxymore","Paradoxe","Chiasme","Parallélisme","Asyndète"]});
f("Oxymore","O","Unir étroitement deux termes de sens contradictoires (souvent un nom et un adjectif).",
 ["Cette obscure clarté qui tombe des étoiles. (Corneille)","Un silence assourdissant.","Se hâter lentement.","Le soleil noir de la Mélancolie. (Nerval)"],{x:["Paradoxe"],a:["oxymoron"]});
f("Paradoxe","O","Formuler une idée qui va contre l’opinion commune ou semble illogique, mais qui contient une vérité.",
 ["Je meurs de soif auprès de la fontaine. (Villon)","Il faut que tout change pour que rien ne change. (Lampedusa)","Je sais que je ne sais rien. (attribué à Socrate)","Le mieux est l’ennemi du bien."],{x:["Épiphonème"]});
f("Antiphrase","O","Dire le contraire de ce qu’on pense, par ironie.",
 ["« Quel beau temps ! » (sous une pluie battante)","« Joli travail ! » (devant un mur effondré)","« Merci beaucoup ! » (après qu’on vous a marché sur le pied)"],{x:["Épitrope"],a:["ironie"]});

/* ---------- Construction et répétition ---------- */
f("Anaphore","C","Répéter un même mot ou groupe de mots en tête de vers, de phrases ou de propositions.",
 ["Rome, l’unique objet de mon ressentiment ! / Rome, à qui vient ton bras d’immoler mon amant ! (Corneille)","Mon bras qu’avec respect toute l’Espagne admire, / Mon bras qui tant de fois a sauvé cet empire… (Corneille)","Paris outragé ! Paris brisé ! Paris martyrisé ! mais Paris libéré ! (de Gaulle)"],{x:["Épiphore","Polysyndète","Parallélisme","Anadiplose","Apostrophe"]});
f("Épiphore","C","Répéter un même mot ou groupe de mots à la fin de plusieurs phrases, propositions ou vers.",
 ["Un paysan, c’est un homme ; un ouvrier, c’est un homme ; un roi, c’est un homme.","Elle était belle, il la trouvait belle, tout le monde la disait belle.","Dans la rue, le silence ; aux fenêtres, le silence ; jusque dans les cœurs, le silence."],{x:["Parallélisme","Épanadiplose","Polyptote"],a:["épistrophe"]});
f("Anadiplose","C","Reprendre le dernier mot d’une proposition au début de la suivante.",
 ["Je suis né pour être heureux, heureux comme un roi.","La crainte engendre la haine, la haine engendre la guerre.","Le silence est d’or, d’or massif."],{x:["Épanadiplose","Gradation","Épiphore"]});
f("Épanadiplose","C","Reprendre à la fin d’une phrase ou d’un vers le mot qui l’ouvre.",
 ["Le roi est mort, vive le roi !","Vivre, c’est apprendre à vivre.","Ami, tu restes mon seul ami."],{x:["Épiphore","Antanaclase","Chiasme"]});
f("Chiasme","C","Disposer des termes de façon croisée selon le schéma A-B / B-A.",
 ["Il faut manger pour vivre et non vivre pour manger. (Molière)","Un roi chantait en bas, en haut mourait un Dieu. (Hugo)","Blanc bonnet et bonnet blanc.","Les hommes font l’histoire et l’histoire fait les hommes."],{x:["Parallélisme","Isocolon","Antanaclase","Polyptote","Inversion (anastrophe)"]});
f("Parallélisme","C","Reprendre une même construction grammaticale dans deux segments successifs.",
 ["Le matin, il travaille ; le soir, il lit.","Ils se marièrent jeunes, ils vécurent heureux.","Vous parlez de paix, vous préparez la guerre."],{x:["Isocolon","Ellipse"]});
f("Isocolon","C","Succession de segments de même longueur et de même structure, créant un rythme régulier.",
 ["Œil pour œil, dent pour dent.","Plus on est de fous, plus on rit.","Tel père, tel fils."],{x:["Ellipse","Paronomase","Anaphore"]});
f("Ellipse","C","Supprimer des mots que le lecteur peut facilement rétablir.",
 [["Je t’aimais inconstant, qu’aurais-je fait fidèle ? (Racine)","sous-entendu : si tu avais été fidèle"],"Lui à Paris, elle à Lyon.","À chacun son métier.","Moi, partir ? Jamais !"],{x:["Zeugme","Asyndète"]});
f("Zeugme","C","Rattacher à un même mot deux compléments de nature différente (souvent l’un concret, l’autre abstrait).",
 ["Vêtu de probité candide et de lin blanc. (Hugo)","Il perdit son sac et ses illusions.","Elle ouvrit la porte et son cœur."],{x:["Syllepse de sens","Hyperbate"],a:["zeugma"]});
f("Asyndète","C","Supprimer les mots de liaison (conjonctions) entre des termes ou des propositions.",
 ["Je suis venu, j’ai vu, j’ai vaincu. (César)","Il entra, s’assit, mangea, repartit.","Il pleuvait, nous sommes rentrés."],{x:["Polysyndète"]});
f("Polysyndète","C","Répéter une conjonction de coordination (et, ni, ou…) plus que nécessaire.",
 ["Et le ciel et la mer et la terre se turent.","Il rit et pleure et chante et danse.","Ni l’or ni la grandeur ne nous rendent heureux. (La Fontaine)"],{});
f("Hyperbate","C","Ajouter un élément à une phrase qui semblait terminée.",
 ["Albe le veut, et Rome. (Corneille)","Il est parti, et pour toujours.","La nuit était belle, et douce."],{x:["Inversion (anastrophe)","Ellipse"]});
f("Inversion (anastrophe)","C","Modifier l’ordre habituel des mots dans la phrase (sujet après le verbe, complément en tête…).",
 ["Sous le pont Mirabeau coule la Seine. (Apollinaire)","Grande fut ma surprise.","Rares sont ceux qui l’ont vu sourire.","De ce malheur, nul ne parla jamais."],{x:["Hystéron protéron","Tmèse"]});
f("Anacoluthe","C","Rompre la construction grammaticale attendue en cours de phrase.",
 ["Le nez de Cléopâtre : s’il eût été plus court, toute la face de la terre aurait changé. (Pascal)","En sortant de chez moi, un pot de fleurs m’est tombé dessus.","Moi, ma mère, elle ne m’a jamais rien appris.","Ceux qui ne travaillent pas, il ne faut pas leur donner de prime."],{x:["Syllepse grammaticale","Ellipse"]});
f("Hystéron protéron","C","Inverser l’ordre logique ou chronologique de deux actions.",
 ["Mourons, et précipitons-nous au milieu des armes. (Virgile)","Mettons nos chaussures et lavons-nous les pieds.","Il sortit et ouvrit la porte."],{x:["Tmèse"]});
f("Tmèse","C","Séparer les éléments d’un mot composé ou d’une locution en y insérant d’autres mots.",
 [["Puis donc qu’on nous permet de prendre la parole…","« puis… que » : tmèse de « puisque »"],["Lors, dit-il, que nous serons partis…","tmèse de « lorsque »"],["Si bien, dis-je, que nous étions ruinés.","tmèse de la locution « si bien que »"]],{x:["Hyperbate","Anacoluthe"]});
f("Polyptote","C","Employer un même mot sous plusieurs formes grammaticales (conjugaison, nombre, genre…).",
 ["Je cherchais, je cherche, je chercherai toujours.","Rends-moi ce que je t’ai rendu.","Les rois que l’on craint craignent eux-mêmes."],{x:["Dérivation","Anaphore","Gradation"]});
f("Dérivation","C","Rapprocher des mots de la même famille (même radical).",
 ["Et le combat cessa faute de combattants. (Corneille)","Le vrai peut quelquefois n’être pas vraisemblable. (Boileau)","Un bon chanteur chante sa chanson avec cœur."],{x:["Paronomase"]});
f("Syllepse grammaticale","C","Accorder un mot selon le sens plutôt que selon les règles grammaticales.",
 ["Le personnel est en grève : ils réclament une prime.","La foule se pressait ; ils criaient tous.","La sentinelle veillait ; il n’avait pas dormi depuis deux jours."],{x:["Syllepse de sens"]});

/* ---------- Sonorités et jeux de mots ---------- */
f("Allitération","N","Répéter une même consonne (ou un même son consonantique) dans des mots proches.",
 [["Pour qui sont ces serpents qui sifflent sur vos têtes ? (Racine)","répétition du son [s], qui imite aussi le sifflement (harmonie imitative)"],"Un chasseur sachant chasser sans son chien.","Les cris des corbeaux crèvent le ciel creux."],{x:["Assonance","Paronomase"],ok:["Harmonie imitative"]});
f("Assonance","N","Répéter un même son voyelle dans des mots proches.",
 [["Tout m’afflige et me nuit et conspire à me nuire. (Racine)","répétition du son [i]"],["Je fais souvent ce rêve étrange et pénétrant. (Verlaine)","répétition du son [ɑ̃] (an/en)"],["Tout doux, tout fou, tout roux, le loup.","répétition du son [u]"]],{x:["Homéotéleute"],ok:["Harmonie imitative"]});
f("Harmonie imitative","N","Choisir des sonorités qui imitent le bruit ou le mouvement évoqué.",
 [["Les sanglots longs / Des violons / De l’automne / Blessent mon cœur / D’une langueur / Monotone. (Verlaine)","les sons nasals et lents imitent la plainte des violons"],"Le tonnerre roulait, grondait, rugissait sur les rocs.","Dans le silence, le ruisseau murmure, susurre et soupire."],{x:["Onomatopée"],ok:["Allitération","Assonance"]});
f("Onomatopée","N","Mot qui imite un bruit.",
 ["Le tic-tac de l’horloge résonnait dans la pièce.","Plouf ! Il tomba dans la mare.","Cocorico ! chante le coq.","Boum ! La porte claqua."],{x:["Allitération"]});
f("Paronomase","N","Rapprocher des mots aux sonorités très proches mais de sens différents.",
 ["Qui se ressemble s’assemble.","Qui s’excuse s’accuse.","Traduttore, traditore. (traducteur, traître)"],{x:["Calembour","Homéotéleute","Assonance"]});
f("Homéotéleute","N","Répéter une même sonorité à la fin de mots ou de groupes de mots proches.",
 ["Liberté, égalité, fraternité.","Il est charmant, élégant, séduisant.","Ni vu ni connu."],{x:["Asyndète","Gradation"]});
f("Calembour","N","Jeu de mots fondé sur des mots qui se prononcent de la même façon mais ont des sens différents.",
 [["Mon père est maire, mon frère est masseur.","maire / mère, masseur / ma sœur"],["Les poules du couvent couvent.","le couvent (nom) / elles couvent (verbe)"],["Pourquoi les canards sont-ils toujours à l’heure ? Parce qu’ils sont dans l’étang.","l’étang / le temps"]],{x:["Antanaclase","Syllepse de sens"]});
f("Antanaclase","N","Reprendre un même mot avec deux sens différents.",
 [["Le cœur a ses raisons que la raison ne connaît point. (Pascal)","« raisons » = motifs ; « raison » = faculté de raisonner"],"Il fait un temps de chien et nous perdons notre temps.","Quand un cordier cordant veut corder une corde…"],{x:["Syllepse de sens","Dérivation","Polyptote"]});
f("Syllepse de sens","N","Employer un même mot, une seule fois, à la fois au sens propre et au sens figuré.",
 [["Brûlé de plus de feux que je n’en allumai. (Racine)","« feux » : l’incendie de Troie (propre) et la passion amoureuse (figuré)"],["Rome n’est plus dans Rome. (Corneille)","la ville / la puissance romaine"],["Ce boulanger gagne bien son pain.","le pain qu’il fabrique / sa vie"]],{});
f("Apocope","N","Supprimer une ou plusieurs syllabes à la fin d’un mot.",
 ["Je vais au ciné avec mon prof.","On se fait une expo ce week-end ?","Le petit déj est servi."],{x:["Aphérèse","Syncope"]});
f("Aphérèse","N","Supprimer une ou plusieurs syllabes au début d’un mot.",
 [["Il prend le bus tous les matins.","« bus » vient d’« autobus » / « omnibus »"],["Pas de blème !","« blème » pour « problème »"],"Je l’ai trouvé sur le Net.","Un car nous attend devant l’école."],{x:["Syncope"]});
f("Syncope","N","Supprimer une lettre ou une syllabe à l’intérieur d’un mot.",
 ["Viens voir mon p’tit chat.","Bonjour, m’sieur !","Tu s’ras là demain ?"],{});

/* ---------- Énonciation et pensée ---------- */
f("Apostrophe","P","S’adresser directement à une personne (présente ou absente) ou à une chose.",
 ["Ô temps ! suspends ton vol. (Lamartine)","Mignonne, allons voir si la rose… (Ronsard)","Hypocrite lecteur, – mon semblable, – mon frère ! (Baudelaire)"],{x:["Prosopopée","Question rhétorique"]});
f("Question rhétorique","P","Poser une question qui n’attend pas de réponse, car celle-ci est évidente.",
 ["Qui ne rêve pas d’être heureux ?","Faut-il vraiment vous rappeler les règles ?","Ne sommes-nous pas tous égaux devant la loi ?","Est-ce ma faute à moi si vous ne m’écoutez jamais ?"],{x:["Dubitation","Épitrope"],a:["interrogation rhétorique","question oratoire","interrogation oratoire"]});
f("Prétérition","P","Annoncer qu’on ne va pas parler de quelque chose… tout en en parlant.",
 ["Je ne vous parlerai pas de sa malhonnêteté…","Inutile de rappeler qu’il a déjà menti trois fois.","Je ne dirai rien de son retard chronique."],{x:["Aposiopèse","Chleuasme"],a:["paralipse"]});
f("Prosopopée","P","Faire parler un absent, un mort, un animal ou une chose.",
 ["« Moi, la Mort, je viens frapper à ta porte ; tu ne m’échapperas pas. »","La Patrie vous dit : « Levez-vous, mes enfants ! »","Et la vieille maison murmura : « Je me souviens de vous tous. »"],{});
f("Aposiopèse","P","Interrompre brusquement sa phrase, sous l’effet d’une émotion.",
 ["Je vous jure que si jamais…","Si tu continues, je vais…","Sortez, ou je…"],{x:["Dubitation"],a:["réticence"]});
f("Hypotypose","P","Décrire une scène de façon si vive et si concrète qu’on croit la voir.",
 ["La mer rugissait, noire ; la barque se brisait, et les cris des marins se perdaient dans l’écume.","Je vois le soleil rouge sombrer, l’ombre grimper sur les toits, les fenêtres s’allumer une à une."],{x:["Asyndète","Personnification","Métaphore filée"]});
f("Épiphonème","P","Sentence brève, souvent exclamative, qui conclut un récit ou un développement.",
 ["… Et il perdit tout. Ainsi va le monde !","… Il avait trop tardé. Voilà ce que c’est que de trop attendre !","… Et la cruche se brisa. Tant va la cruche à l’eau qu’à la fin elle se casse !"],{});
f("Dubitation","P","Feindre l’hésitation, le doute, pour souligner ce qu’on dit.",
 ["Que dois-je dire ? Que faire ? Je ne sais comment vous annoncer cela…","Est-ce courage ou folie ? Je ne saurais le dire, mais il fonça.","Dois-je rire ou pleurer de ce que j’entends ?"],{x:["Épanorthose"]});
f("Épitrope","P","Concéder (souvent ironiquement) quelque chose à l’adversaire pour mieux retourner l’argument.",
 ["Soit, je suis coupable. Mais lequel d’entre vous ne l’est pas ?","Admettons que j’aie tort : cela excuse-t-il vos mensonges ?","Allez, riez de moi ; vous verrez qui rira le dernier."],{x:["Chleuasme"]});
f("Épanorthose","P","Revenir sur ce qu’on vient de dire pour le corriger, le nuancer ou le renforcer.",
 ["C’est un cap ? Que dis-je, c’est un cap ? C’est une péninsule ! (Rostand)","Il est intelligent… que dis-je ? brillant !","Je l’aime, non, je l’adore.","Ce n’est pas un ami, c’est un frère."],{a:["correction"]});
f("Chleuasme","P","Se déprécier soi-même, avec une fausse modestie, pour s’attirer des compliments ou mieux convaincre.",
 ["Je ne suis qu’un modeste amateur, mais ce tableau est peut-être le meilleur de l’exposition.","Oh, ce gâteau ? Je l’ai fait à la va-vite, il n’est sûrement pas très bon…","Pardonnez la maladresse d’un pauvre débutant comme moi."],{});

/* ---------- Préparation des données ---------- */
const fold=s=>String(s).toLowerCase().replace(/œ/g,"oe").replace(/æ/g,"ae").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/’/g,"'");
const STOP=new Set(["la","le","les","l","un","une","des","d","de","du","c","est","figure","style","c'est"]);
const words=s=>fold(s).replace(/[^a-z]+/g," ").split(" ").filter(w=>w&&!STOP.has(w));
const BY=new Map(D.map(d=>[d.n,d]));
D.forEach(d=>{d.X=new Set([d]);d.OK=[]});
D.forEach(d=>{
 const get=n=>{const o=BY.get(n);if(!o)console.warn("Figure inconnue :",n,"(dans",d.n+")");return o};
 d.x.forEach(n=>{const o=get(n);if(o){d.X.add(o);o.X.add(d)}});
 d.ok.forEach(n=>{const o=get(n);if(o){d.OK.push(o);d.X.add(o);o.X.add(d)}});
 const v=[d.n,d.n.replace(/\s*\(.*?\)/g,""),...(d.n.match(/\((.*?)\)/g)||[]).map(s=>s.slice(1,-1)),...d.a];
 d.W=[...new Set(v.map(s=>words(s).join(" ")).filter(Boolean))];
 d.K=[...new Set(d.W.map(s=>s.replace(/ /g,"")))];
 d.main=d.n.replace(/\s*\(.*?\)/g,"");
 d.search=fold([d.n,d.d,CATS[d.c],...d.a,...d.e.map(e=>e.t+" "+(e.note||""))].join(" "));
});

/* ---------- Correction (reprise de la page) ---------- */
function lev(a,b){
 if(a===b)return 0;if(!a.length)return b.length;if(!b.length)return a.length;
 let p=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){const c=[i];for(let j=1;j<=b.length;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}
 return p[b.length];
}
function judge(input,f){
 const w=words(input).join(" "),k=w.replace(/ /g,"");
 if(!k)return{r:"empty"};
 const exact=D.filter(d=>d.K.includes(k));
 if(exact.includes(f))return{r:"ok"};
 if(exact.length){const o=exact[0];return f.OK.includes(o)?{r:"near",o}:{r:"ko",o}}
 if(f.W.some(x=>x.startsWith(w+" ")))return{r:"precise"};
 let best=null,bd=Infinity,tie=false;
 for(const d of D)for(const x of d.K){const v=lev(k,x);if(v<bd){bd=v;best=d;tie=false}else if(v===bd&&d!==best)tie=true}
 const tol=k.length>=9?2:k.length>=5?1:0;
 if(best&&bd<=tol&&!tie){
  if(best===f)return{r:"typo"};
  return f.OK.includes(best)?{r:"near",o:best}:{r:"ko",o:best,approx:true};
 }
 return{r:"ko"};
}
function makeOpts(f){
 const free=D.filter(d=>!f.X.has(d));
 const same=shuf(free.filter(d=>d.c===f.c)),other=shuf(free.filter(d=>d.c!==f.c));
 const p=same.slice(0,2);
 for(const d of other.concat(same.slice(2))){if(p.length>=3)break;if(!p.includes(d))p.push(d)}
 return shuf([f,...p]);
}

/* Libellés courts de la maquette (« analogie », « substitution »…). */
const SHORT = { A: 'Analogie', S: 'Substitution', I: 'Atténuation', O: 'Opposition', C: 'Construction', N: 'Sonorités', P: 'Énonciation' };
const THEMES = Object.keys(CATS).map(k => ({ id: k, label: SHORT[k], hint: CATS[k] + ` (${D.filter(d => d.c === k).length})` }));

function feedbackHTML(f, ex) {
  return `<p><b>${esc(f.n)}</b> : ${esc(lc(f.d))}</p>${ex.note ? `<p class="note">💡 Ici : ${esc(ex.note)}.</p>` : ''}`;
}

export default {
  id: 'figures',
  name: 'Figures de style',
  short: 'Fig de S',
  themes: THEMES,
  modes: [{ id: 'qcm', label: 'Choix multiple' }, { id: 'saisie', label: 'Saisie libre' }],
  defaults: { themes: ['A', 'S'], count: 1, mode: 'qcm' },
  generate({ themes, mode = 'qcm' } = {}, rng = Math.random) {
    RNG = rng;
    try {
      const pool = D.filter(d => !themes || !themes.length || themes.includes(d.c));
      const f = rnd(pool), ex = rnd(f.e);
      const qcm = mode !== 'saisie';
      const opts = qcm ? makeOpts(f) : null;
      return {
        module: 'figures', theme: f.c, figure: f.n, key: 'fig:' + f.n,
        prompt: `<p class="q-lead">${qcm ? 'Quelle figure de style illustre cette phrase ?' : 'Quelle figure de style reconnais-tu ? Écris son nom.'}</p><blockquote class="q-ex">${esc(ex.t)}</blockquote>`,
        input: qcm ? 'choice' : 'text',
        choices: qcm ? opts.map(o => o.n) : null,
        reveal: () => ({ status: 'ko', title: `C’était : ${esc(f.n)}`, feedback: feedbackHTML(f, ex), answer: f.n }),
        check(answer) {
          let ok, note = '';
          if (qcm) {
            const o = opts.find(x => x.n === answer);
            ok = o === f;
            if (!ok && o) note = `<p class="mut">Tu as répondu <b>${esc(o.n)}</b> : ${esc(lc(o.d))}</p>`;
          } else {
            const j = judge(answer, f);
            if (j.r === 'empty') return { status: 'retry', message: 'Écris une réponse, ou touche « Je ne sais pas ».' };
            if (j.r === 'precise') return { status: 'retry', message: 'Presque ! Précise ta réponse (le nom complet est attendu).' };
            ok = j.r === 'ok' || j.r === 'typo' || j.r === 'near';
            if (j.r === 'typo') note = `<p>Attention à l’orthographe : on écrit <b>${esc(f.n)}</b>.</p>`;
            else if (j.r === 'near') note = `<p>C’est accepté, mais plus précisément, c’est ${/^[aeiouyhéèêâîôû]/i.test(f.n) ? 'l’' : 'la '}<b>${esc(f.n)}</b>.</p>`;
            else if (!ok && j.o) note = `<p class="mut">${j.approx ? `Ça ressemble à <b>${esc(j.o.n)}</b>` : `Tu as répondu <b>${esc(j.o.n)}</b>`} : ${esc(lc(j.o.d))}</p>`;
          }
          return { status: ok ? 'ok' : 'ko', title: ok ? 'Bonne réponse !' : `C’était : ${esc(f.n)}`, feedback: note + feedbackHTML(f, ex), answer: f.n };
        }
      };
    } finally { RNG = Math.random; }
  }
};

export { D as FIGURES, CATS, judge };

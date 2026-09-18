import LayoutLegal from "@/components/layout-legal";

export default function PageCGU() {
  return (
    <LayoutLegal titre="Conditions générales d'utilisation" majLe="10 septembre 2026">
      <section>
        <h2 className="mb-2 font-semibold text-encre">Objet</h2>
        <p>
          CheckIn Free est un outil gratuit de billetterie et de gestion
          d&apos;émargement, destiné aux associations pour organiser des
          événements : création de pages événement, inscription des
          participants, génération de billets avec QR code, contrôle
          d&apos;accès par scan, et communication (rappels, invitations).
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">Accès au service</h2>
        <p>
          L&apos;inscription à un événement ne nécessite pas de créer de
          compte : un prénom, un nom et une adresse email suffisent. La
          gestion des événements (création, modification, scan, envoi de
          communications) est réservée aux personnes disposant d&apos;un
          compte administrateur, créé par un membre existant de
          l&apos;équipe organisatrice.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">
          Engagements des participants
        </h2>
        <p>
          En t&apos;inscrivant à un événement, tu t&apos;engages à fournir des
          informations exactes (prénom, nom, email). Une seule inscription
          par personne et par événement est autorisée. Toute tentative de
          contournement de cette règle, ou d&apos;utilisation abusive du
          formulaire d&apos;inscription (inscriptions automatisées, fausses
          identités), pourra entraîner la suppression du billet concerné.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">
          Engagements des organisateurs
        </h2>
        <p>
          Les personnes disposant d&apos;un compte administrateur
          s&apos;engagent à n&apos;utiliser les données des participants que
          dans le cadre de la gestion des événements de leur association, et
          à respecter la politique de confidentialité du service, notamment
          concernant les demandes de désinscription et de suppression de
          données.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">Disponibilité du service</h2>
        <p>
          CheckIn Free est fourni « en l&apos;état », gratuitement, sans
          garantie de disponibilité continue. Des interruptions ponctuelles
          peuvent survenir (maintenance, panne d&apos;un prestataire
          technique). En cas d&apos;indisponibilité prolongée, les
          organisateurs sont invités à prévoir une solution de secours pour
          le contrôle d&apos;accès le jour d&apos;un événement.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">Modification des CGU</h2>
        <p>
          Ces conditions peuvent être modifiées à tout moment. La version en
          vigueur est celle publiée sur cette page, avec sa date de mise à
          jour.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">Droit applicable</h2>
        <p>
          Les présentes conditions sont soumises au droit français. En cas
          de litige, une solution amiable sera recherchée en priorité, en
          écrivant à{" "}
          <a href="mailto:contact@checkinfree.com" className="text-indigo underline">
            contact@checkinfree.com
          </a>
          .
        </p>
      </section>
    </LayoutLegal>
  );
}

import LayoutLegal from "@/components/layout-legal";

export default function PageConfidentialite() {
  return (
    <LayoutLegal titre="Politique de confidentialité" majLe="10 septembre 2026">
      <section>
        <h2 className="mb-2 font-semibold text-encre">Responsable de traitement</h2>
        <p>
          CheckIn Free, 4 rue de la Condamine, 38610 Gières — contact :{" "}
          <a href="mailto:contact@checkinfree.com" className="text-indigo underline">
            contact@checkinfree.com
          </a>{" "}
          — est responsable du traitement des données décrites ci-dessous.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">Données collectées</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Lorsque tu t&apos;inscris à un événement</strong> : prénom,
            nom, adresse email.
          </li>
          <li>
            <strong>Si tu es membre de l&apos;équipe organisatrice</strong> :
            email, mot de passe (jamais stocké en clair), prénom et nom si
            renseignés.
          </li>
          <li>
            <strong>Lors du contrôle d&apos;accès</strong> : l&apos;heure à
            laquelle ton billet a été scanné.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">Pourquoi ces données sont utilisées</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Créer et t&apos;envoyer ton billet (avec QR code) par email.</li>
          <li>Vérifier ton identité à l&apos;entrée de l&apos;événement.</li>
          <li>
            T&apos;envoyer des rappels concernant l&apos;événement auquel tu es
            inscrit.
          </li>
          <li>
            Le cas échéant, t&apos;inviter à un nouveau rendez-vous d&apos;une
            série d&apos;événements à laquelle tu as déjà participé — tu peux
            t&apos;y opposer à tout moment (voir plus bas).
          </li>
          <li>
            Établir des statistiques de fréquentation, uniquement à
            destination de l&apos;équipe organisatrice de l&apos;événement
            concerné.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">Base légale</h2>
        <p>
          Pour une inscription à un événement, le traitement repose sur
          l&apos;exécution du service que tu demandes (réserver ta place).
          Pour les invitations à d&apos;anciens participants d&apos;une série
          d&apos;événements, le traitement repose sur l&apos;intérêt légitime
          de l&apos;organisateur à te tenir informé de ses prochains
          rendez-vous — avec un droit d&apos;opposition immédiat et gratuit.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">Qui a accès à ces données</h2>
        <p>
          Seule l&apos;équipe organisatrice de l&apos;événement concerné (les
          personnes ayant un compte administrateur) peut consulter la liste
          des inscrits à cet événement précis. Aucune donnée n&apos;est
          vendue, louée ou partagée à des fins commerciales.
        </p>
        <p className="mt-2">
          Des prestataires techniques traitent tes données pour notre compte,
          dans le seul but de faire fonctionner le service :{" "}
          <strong>Supabase</strong> (hébergement de la base de données),{" "}
          <strong>Vercel</strong> (hébergement de l&apos;application) et{" "}
          <strong>Resend</strong> / <strong>Brevo</strong> (envoi des emails).
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">Durée de conservation</h2>
        <p>
          Les données d&apos;un billet sont conservées le temps de
          l&apos;événement, puis jusqu&apos;à 12 mois après celui-ci à des
          fins de statistiques et d&apos;éventuelles relances, sauf demande
          de suppression anticipée de ta part.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">
          Se désabonner des invitations
        </h2>
        <p>
          Si tu reçois une invitation à revenir à un événement d&apos;une
          série à laquelle tu as déjà participé, chaque email de ce type
          contient un lien <strong>« Ne plus recevoir ces invitations »</strong>.
          En cliquant dessus, tu es immédiatement retiré des invitations
          futures pour cette série précise d&apos;événements, sans avoir
          besoin de te connecter ni de justifier ta demande.
        </p>
        <p className="mt-2">
          Ce désabonnement est spécifique à la série d&apos;événements
          concernée : il ne t&apos;empêche pas de recevoir un email si tu
          t&apos;inscris toi-même à un autre événement, ni de recevoir le
          rappel d&apos;un billet que tu as réservé.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">Tes droits</h2>
        <p>
          Conformément au Règlement Général sur la Protection des Données, tu
          disposes d&apos;un droit d&apos;accès, de rectification,
          d&apos;effacement et d&apos;opposition sur tes données. Tu peux
          exercer ces droits à tout moment en écrivant à{" "}
          <a href="mailto:contact@checkinfree.com" className="text-indigo underline">
            contact@checkinfree.com
          </a>
          . Tu peux également introduire une réclamation auprès de la CNIL
          (cnil.fr) si tu estimes que tes droits ne sont pas respectés.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">Cookies</h2>
        <p>
          Le site utilise uniquement un cookie technique strictement
          nécessaire à la connexion des comptes administrateurs. Aucun
          cookie publicitaire ou de suivi n&apos;est utilisé.
        </p>
      </section>
    </LayoutLegal>
  );
}

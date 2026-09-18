import LayoutLegal from "@/components/layout-legal";

export default function PageMentionsLegales() {
  return (
    <LayoutLegal titre="Mentions légales" majLe="10 septembre 2026">
      <section>
        <h2 className="mb-2 font-semibold text-encre">Éditeur du site</h2>
        <p>
          Ce site est édité par <strong>CheckIn Free</strong>.
          <br />
          Adresse : 4 rue de la Condamine, 38610 Gières, France
          <br />
          Email de contact : contact@checkinfree.com
          <br />
          Responsable de la publication : Euphrem Balounga
        </p>
        <p className="mt-2 text-xs text-sourdine">
          CheckIn Free n&apos;est pas immatriculé (pas de SIRET) à la date de
          rédaction de ces mentions. Il s&apos;agit d&apos;un projet géré à
          titre personnel par son responsable de publication, mis à
          disposition d&apos;associations pour la gestion de leurs
          événements.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">Hébergement</h2>
        <p>
          Le site (application web) est hébergé par <strong>Vercel Inc.</strong>{" "}
          (vercel.com).
          <br />
          La base de données est hébergée par <strong>Supabase Inc.</strong>{" "}
          (supabase.com).
          <br />
          L&apos;envoi des emails transactionnels est assuré par{" "}
          <strong>Resend</strong> (resend.com) et, en secours, par{" "}
          <strong>Brevo</strong> (brevo.com).
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">Propriété intellectuelle</h2>
        <p>
          La structure générale du site, les textes, graphismes, logos et
          éléments visuels qui le composent sont, sauf mention contraire, la
          propriété de CheckIn Free ou de ses concepteurs. Toute
          reproduction, représentation, modification ou adaptation totale ou
          partielle de ces éléments, par quelque procédé que ce soit, est
          interdite sans autorisation préalable.
        </p>
        <p className="mt-2">
          Les contenus propres à chaque événement (bannières, logos,
          descriptions) restent la propriété des organisateurs qui les ont
          mis en ligne, sous leur seule responsabilité.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">Responsabilité</h2>
        <p>
          CheckIn Free met à disposition des associations un outil de
          billetterie et de gestion d&apos;émargement. Le contenu des
          événements publiés (descriptions, dates, lieux) relève de la
          responsabilité de l&apos;organisateur qui les crée. CheckIn Free ne
          saurait être tenu responsable d&apos;une information erronée
          publiée par un organisateur tiers.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-encre">Contact</h2>
        <p>
          Pour toute question relative à ces mentions légales :{" "}
          <a href="mailto:contact@checkinfree.com" className="text-indigo underline">
            contact@checkinfree.com
          </a>
        </p>
      </section>
    </LayoutLegal>
  );
}

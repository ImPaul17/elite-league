import { EmptyState, PageHero } from "../components/ui";

export function SponsorsPage() {
  return <>
    <PageHero className="sponsors-hero" title="Patrocinadores" description="Las marcas que acompañan a Elite League." />
    <section className="panel reveal-item"><EmptyState title="Próximamente" description="Aquí anunciaremos los patrocinadores y colaboradores de la competición." /></section>
  </>;
}

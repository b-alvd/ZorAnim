import Hero from "@/components/Hero/Hero";
import Row from "@/components/Row/Row";
import { getFilms } from "@/db/queries";

export default async function Home() {
  const films = await getFilms();

  return (
    <main>
      <Hero films={films} />
      <Row title="Nouveautés" films={films} />
    </main>
  );
}

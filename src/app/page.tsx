import Hero from "@/components/Hero/Hero";
import Row from "@/components/Row/Row";
import { films } from "@/data/mock";

export default function Home() {
  return (
    <main>
      <Hero films={films} />
      <Row title="Nouveautés" films={films} />
    </main>
  );
}

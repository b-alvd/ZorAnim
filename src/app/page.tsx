import Hero from "@/components/Hero/Hero";
import Row from "@/components/Row/Row";
import { films } from "@/data/mock";

export default function Home() {
  return (
    <main>
      <Hero />
      <Row title="Populaires en ce moment" films={films} />
    </main>
  );
}

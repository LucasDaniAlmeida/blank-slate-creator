import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Página em Branco" },
      { name: "description", content: "Uma página em branco simples." },
      { property: "og:title", content: "Página em Branco" },
      { property: "og:description", content: "Uma página em branco simples." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return <div className="min-h-screen bg-background" />;
}

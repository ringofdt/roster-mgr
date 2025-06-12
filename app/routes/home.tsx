import type { Route } from "./+types/home";
// import { Welcome } from "../welcome/welcome";
import RoasterApp from "../roaster-app/roaster-app";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "PI Roster App" },
    { name: "description", content: "Rosters made simple" },
  ];
}

export default function Home() {
  return <RoasterApp />;
}

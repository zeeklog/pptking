export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { Home } from "./components/home";

export default async function ChatApp() {
  return (
    <>
      <Home />
    </>
  );
}

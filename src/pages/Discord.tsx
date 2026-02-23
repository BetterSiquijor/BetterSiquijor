import { useEffect } from 'react';

export default function Discord() {
  useEffect(function () {
    window.location.assign('https://discord.gg/bettergovph');
  }, []);
  return <h1>Redirecting to BetterSiquijor Discord Invite Link...</h1>;
}

// DJ Live Serato Bridge foundation / simulator
// This DOES NOT read Serato yet. It proves the local bridge -> DJ Live auto-match path.
// Final detector will call reportLoadedTrack() whenever Serato Deck 1/2 changes.

const DJ_LIVE_SERVER = process.env.DJ_LIVE_SERVER || "http://127.0.0.1:3001";

export async function reportLoadedTrack(deck, title, artist = "") {
  const response = await fetch(`${DJ_LIVE_SERVER}/api/serato/loaded`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deck, title, artist }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || "DJ Live rejected the Serato event.");
  }

  return payload;
}

async function runFromCommandLine() {
  const [, , deckArg, titleArg, artistArg = ""] = process.argv;

  if (!deckArg || !titleArg) {
    console.log('Usage: node serato-bridge.js <deck> "<title>" "<artist>"');
    console.log('Example: node serato-bridge.js 1 "Yeah!" "Usher"');
    process.exit(1);
  }

  try {
    const result = await reportLoadedTrack(
      Number(deckArg),
      titleArg,
      artistArg
    );
    console.log("DJ Live bridge result:", result);
  } catch (error) {
    console.error("Serato bridge error:", error.message);
    process.exit(1);
  }
}

const launchedDirectly =
  process.argv[1] &&
  new URL(import.meta.url).pathname
    .replace(/^\/([A-Za-z]:)/, "$1")
    .replaceAll("/", "\\")
    .toLowerCase() === process.argv[1].toLowerCase();

if (launchedDirectly) {
  runFromCommandLine();
}

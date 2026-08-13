/** Construye la URL de embed para las plataformas reproducibles en la rotación. */

export function getEmbedUrl(
  platform: string,
  kind: string,
  externalId: string,
  autoplay: boolean
): string | null {
  switch (platform) {
    case "spotify":
      return `https://open.spotify.com/embed/${kind}/${externalId}?utm_source=generator&theme=0${
        autoplay ? "&autoplay=1" : ""
      }`;
    case "soundcloud":
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(
        externalId
      )}&color=%23ff4d00&auto_play=${autoplay}&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false`;
    case "deezer":
      return `https://widget.deezer.com/widget/dark/${kind}/${externalId}${autoplay ? "?autoplay=true" : ""}`;
    default:
      return null;
  }
}

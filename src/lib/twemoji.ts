const EMOJI_RE = /(\p{Extended_Pictographic}(?:\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F)?)*)/gu;

function toCodePoint(unicodeSurrogates: string): string {
  const points: string[] = [];
  let i = 0;
  while (i < unicodeSurrogates.length) {
    const cp = unicodeSurrogates.codePointAt(i)!;
    if (cp !== 0xfe0f) points.push(cp.toString(16));
    i += cp > 0xffff ? 2 : 1;
  }
  return points.join("-");
}

/**
 * Replaces emoji characters in an HTML/text string with Twemoji <img> tags
 * so they render as colorful drawings consistently across devices.
 */
export function twemojify(html: string): string {
  return html.replace(EMOJI_RE, (match) => {
    const code = toCodePoint(match);
    if (!code) return match;
    return `<img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${code}.svg" alt="${match}" class="twemoji" draggable="false" loading="lazy" style="height:1.1em;width:1.1em;display:inline-block;vertical-align:-0.15em;margin:0 0.05em;" />`;
  });
}
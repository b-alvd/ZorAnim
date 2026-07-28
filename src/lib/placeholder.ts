const posterColors = [
  ["#3a0ca3", "#7209b7"],
  ["#0a4d68", "#088395"],
  ["#6a040f", "#e85d04"],
  ["#1b4332", "#40916c"],
  ["#3d0000", "#b0060c"],
  ["#22223b", "#4a4e69"],
];

export function placeholderPoster(seed: number, title: string) {
  const [c1, c2] = posterColors[seed % posterColors.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${c1}'/>
        <stop offset='1' stop-color='${c2}'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='50%' fill='rgba(255,255,255,0.8)' font-family='Helvetica, Arial, sans-serif'
      font-size='36' font-weight='700' text-anchor='middle' dominant-baseline='middle'>${title}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function placeholderAvatar(seed: number, name: string) {
  const [c1, c2] = posterColors[seed % posterColors.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${c1}'/>
        <stop offset='1' stop-color='${c2}'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='50%' fill='rgba(255,255,255,0.9)' font-family='Helvetica, Arial, sans-serif'
      font-size='72' font-weight='700' text-anchor='middle' dominant-baseline='middle'>${initials(name)}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

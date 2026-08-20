export function minutes(t){const [h,m]=t.split(':').map(Number);return h*60+m}
export function hhmm(n){return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
export function overlaps(aStart,aEnd,bStart,bEnd){return aStart < bEnd && bStart < aEnd}
export function getAvailableSlots({open='08:00',close='19:00',duration=60,step=30,appointments=[],breaks=[]}){
  const out=[]; const o=minutes(open), c=minutes(close);
  for(let s=o;s+duration<=c;s+=step){const e=s+duration; const busy=[...appointments,...breaks].some(x=>overlaps(s,e,minutes(x.start),minutes(x.end))); if(!busy) out.push(hhmm(s));}
  return out;
}

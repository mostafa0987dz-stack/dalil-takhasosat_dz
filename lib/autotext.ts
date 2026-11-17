type Min = { year: number; score: number; branch?: string } | null;

/** وصف مولَّد من البيانات لتخصص بلا وصف (للعرض فقط، لا يُحفظ في قاعدة البيانات). */
export function autoSpecialtyDescription(s: { nom_ar: string; domaine: string; duree: string; filiere: string[] }, universitiesCount: number, min: Min): string {
  let text = `${s.nom_ar} تخصص في مجال ${s.domaine}`;
  if (universitiesCount > 0) text += `، يُدرّس في ${universitiesCount} جامعة`;
  if (min) text += `، وأدنى معدل قبول مسجّل فيه هو ${min.score.toFixed(2)} في ${min.year}${min.branch ? ` (${min.branch})` : ""}`;
  text += ".";
  if (s.duree.trim()) text += ` مدته ${s.duree.trim()}.`;
  if (s.filiere.length) text += ` الشعب المؤهلة: ${s.filiere.join("، ")}.`;
  return text;
}

/** وصف مولَّد لجامعة بلا وصف (للعرض فقط). */
export function autoUniversityDescription(u: { name_ar: string; type: string | null; wilaya: string | null }, specialtiesCount: number, domainsCount: number, min: Min): string {
  let text = `${u.name_ar} ${u.type ? `(${u.type}) ` : ""}مؤسسة جامعية${u.wilaya ? ` في ولاية ${u.wilaya}` : ""}`;
  if (specialtiesCount > 0) text += `، تضم ${specialtiesCount} تخصصاً في ${domainsCount} ${domainsCount === 1 ? "مجال" : "مجالات"}`;
  if (min) text += `، وأدنى معدل قبول مسجّل فيها هو ${min.score.toFixed(2)} في ${min.year}`;
  return `${text}.`;
}

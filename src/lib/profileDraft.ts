import { Medicamento, Profile } from './trainingTypes';

type CamposDeTexto = 'idade' | 'alturaCm' | 'pesoKg' | 'pesoMetaKg' | 'prazoSemanas' | 'sonoHoras' | 'condicoes';

export type ProfileDraft = Omit<Profile, CamposDeTexto | 'medicamentos' | 'lesoes'> &
  Record<CamposDeTexto, string> &
  Required<Pick<Profile, 'medicamentos' | 'lesoes'>>;

const optionalText = (n?: number) => (n == null ? '' : String(n).replace('.', ','));

export function toDraft(p?: Profile): ProfileDraft {
  return {
    nome: p?.nome ?? '',
    sexo: p?.sexo ?? 'M',
    idade: p ? String(p.idade) : '',
    alturaCm: p ? String(p.alturaCm) : '',
    pesoKg: p ? String(p.pesoKg).replace('.', ',') : '',
    nivel: p?.nivel ?? 'iniciante',
    objetivo: p?.objetivo ?? 'hipertrofia',
    diasSemana: p?.diasSemana ?? 4,
    duracaoMin: p?.duracaoMin ?? 60,
    atividade: p?.atividade ?? 'leve',
    prioridades: p?.prioridades ?? [],
    pesoMetaKg: optionalText(p?.pesoMetaKg),
    prazoSemanas: optionalText(p?.prazoSemanas),
    ritmo: p?.ritmo,
    medicamentos: p?.medicamentos ?? [],
    condicoes: p?.condicoes ?? '',
    lesoes: p?.lesoes ?? [],
    sonoHoras: optionalText(p?.sonoHoras),
    apetite: p?.apetite,
  };
}

const parse = (s: string) => Number(s.replace(',', '.'));
const filled = (s: string) => s.trim() !== '';

export function draftErrors(d: ProfileDraft): string | undefined {
  const idade = parse(d.idade);
  const altura = parse(d.alturaCm);
  const peso = parse(d.pesoKg);
  if (!(idade >= 14 && idade <= 90)) return 'Informe uma idade entre 14 e 90 anos.';
  if (!(altura >= 120 && altura <= 230)) return 'Informe a altura em centímetros (ex.: 175).';
  if (!(peso >= 35 && peso <= 250)) return 'Informe o peso em kg (ex.: 78,5).';
  if (filled(d.pesoMetaKg) && !(parse(d.pesoMetaKg) >= 35 && parse(d.pesoMetaKg) <= 250)) return 'A meta de peso deve ficar entre 35 e 250 kg, ou fique em branco.';
  if (filled(d.prazoSemanas) && !(parse(d.prazoSemanas) >= 1 && parse(d.prazoSemanas) <= 260)) return 'O prazo deve ficar entre 1 e 260 semanas, ou fique em branco.';
  if (filled(d.sonoHoras) && !(parse(d.sonoHoras) >= 1 && parse(d.sonoHoras) <= 16)) return 'As horas de sono devem ficar entre 1 e 16, ou fique em branco.';
  return undefined;
}

function cleanMedicamento(m: Medicamento): Medicamento | undefined {
  const nome = m.nome.trim();
  if (!nome) return undefined;
  return { ...m, nome, dose: m.dose?.trim() || undefined, frequencia: m.frequencia?.trim() || undefined };
}

export function fromDraft(d: ProfileDraft): Profile {
  const medicamentos = d.medicamentos.map(cleanMedicamento).filter((m): m is Medicamento => !!m);
  return {
    ...d,
    nome: d.nome.trim(),
    idade: Math.round(parse(d.idade)),
    alturaCm: Math.round(parse(d.alturaCm)),
    pesoKg: Math.round(parse(d.pesoKg) * 10) / 10,
    pesoMetaKg: filled(d.pesoMetaKg) ? Math.round(parse(d.pesoMetaKg) * 10) / 10 : undefined,
    prazoSemanas: filled(d.prazoSemanas) ? Math.round(parse(d.prazoSemanas)) : undefined,
    sonoHoras: filled(d.sonoHoras) ? Math.round(parse(d.sonoHoras) * 10) / 10 : undefined,
    condicoes: d.condicoes.trim() || undefined,
    medicamentos: medicamentos.length ? medicamentos : undefined,
    lesoes: d.lesoes.length ? d.lesoes : undefined,
  };
}

import { draftErrors, fromDraft, ProfileDraft, toDraft } from '../profileDraft';
import { Profile } from '../trainingTypes';

const ANTIGO: Profile = {
  nome: 'Teste',
  sexo: 'M',
  idade: 30,
  alturaCm: 180,
  pesoKg: 80.5,
  nivel: 'intermediario',
  objetivo: 'emagrecimento',
  diasSemana: 4,
  duracaoMin: 60,
  atividade: 'moderado',
  prioridades: ['peito'],
};

const COMPLETO: Profile = {
  ...ANTIGO,
  pesoMetaKg: 72.5,
  prazoSemanas: 20,
  ritmo: 'moderado',
  medicamentos: [{ nome: 'Tirzepatida (Mounjaro)', dose: '5 mg', frequencia: 'Semanal', atalho: 'tirzepatida' }],
  condicoes: 'Hipertensão',
  lesoes: ['joelho'],
  sonoHoras: 7.5,
  apetite: 'baixo',
};

const draft = (patch: Partial<ProfileDraft> = {}): ProfileDraft => ({ ...toDraft(ANTIGO), ...patch });

describe('perfil antigo, sem os campos novos', () => {
  test('abre com os campos novos vazios', () => {
    expect(toDraft(ANTIGO)).toMatchObject({ pesoMetaKg: '', prazoSemanas: '', sonoHoras: '', condicoes: '', medicamentos: [], lesoes: [] });
    expect(toDraft(ANTIGO).ritmo).toBeUndefined();
    expect(toDraft(ANTIGO).apetite).toBeUndefined();
  });

  test('não tem erros e continua igual ao salvar sem preencher nada', () => {
    expect(draftErrors(toDraft(ANTIGO))).toBeUndefined();
    expect(JSON.parse(JSON.stringify(fromDraft(toDraft(ANTIGO))))).toEqual(ANTIGO);
  });
});

describe('campos novos', () => {
  test('ida e volta mantém tudo, inclusive decimais', () => {
    expect(toDraft(COMPLETO).pesoMetaKg).toBe('72,5');
    expect(toDraft(COMPLETO).sonoHoras).toBe('7,5');
    expect(fromDraft(toDraft(COMPLETO))).toEqual(COMPLETO);
  });

  test('sem perfil, começa com padrões válidos para os opcionais', () => {
    expect(toDraft()).toMatchObject({ idade: '', medicamentos: [], lesoes: [], condicoes: '' });
  });

  test('aceita vírgula e arredonda', () => {
    const p = fromDraft(draft({ pesoMetaKg: '70,26', prazoSemanas: '12,4', sonoHoras: '6,55' }));
    expect(p.pesoMetaKg).toBe(70.3);
    expect(p.prazoSemanas).toBe(12);
    expect(p.sonoHoras).toBe(6.6);
  });

  test('espaços contam como vazio', () => {
    const p = fromDraft(draft({ pesoMetaKg: '  ', condicoes: '   ' }));
    expect(p.pesoMetaKg).toBeUndefined();
    expect(p.condicoes).toBeUndefined();
  });

  test('medicamento sem nome é descartado, e os outros têm os textos limpos', () => {
    const p = fromDraft(
      draft({
        medicamentos: [
          { nome: '   ', dose: '5 mg' },
          { nome: ' Metformina ', dose: ' 500 mg ', frequencia: '  ' },
        ],
      }),
    );
    expect(p.medicamentos).toEqual([{ nome: 'Metformina', dose: '500 mg', frequencia: undefined }]);
  });

  test('sem nenhum medicamento ou lesão, os campos ficam de fora', () => {
    const p = fromDraft(draft({ medicamentos: [{ nome: ' ' }], lesoes: [] }));
    expect(p.medicamentos).toBeUndefined();
    expect(p.lesoes).toBeUndefined();
  });
});

describe('draftErrors', () => {
  test.each([
    ['idade', { idade: '10' }, 'idade'],
    ['altura', { alturaCm: '50' }, 'altura'],
    ['peso', { pesoKg: '10' }, 'peso'],
    ['meta de peso baixa', { pesoMetaKg: '20' }, 'meta de peso'],
    ['meta de peso alta', { pesoMetaKg: '300' }, 'meta de peso'],
    ['meta de peso não numérica', { pesoMetaKg: 'abc' }, 'meta de peso'],
    ['prazo zerado', { prazoSemanas: '0' }, 'prazo'],
    ['prazo longo', { prazoSemanas: '500' }, 'prazo'],
    ['sono zerado', { sonoHoras: '0' }, 'sono'],
    ['sono longo', { sonoHoras: '20' }, 'sono'],
  ] as [string, Partial<ProfileDraft>, string][])('recusa %s', (_nome, patch, trecho) => {
    expect(draftErrors(draft(patch))).toContain(trecho);
  });

  test.each([
    [{ pesoMetaKg: '35', prazoSemanas: '1', sonoHoras: '1' }],
    [{ pesoMetaKg: '250', prazoSemanas: '260', sonoHoras: '16' }],
    [{ pesoMetaKg: '72,5', sonoHoras: '7,5' }],
  ] as [Partial<ProfileDraft>][])('aceita %j', (patch) => {
    expect(draftErrors(draft(patch))).toBeUndefined();
  });
});

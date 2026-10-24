"""
Gera src/data/foods.ts a partir da Tabela Brasileira de Composição de Alimentos (TACO, NEPA/UNICAMP),
usando os CSVs organizados em https://github.com/raulfdm/taco-api (pasta references/csv).

Uso:
  git clone --depth 1 https://github.com/raulfdm/taco-api.git /tmp/taco-api
  python3 scripts/build_foods.py /tmp/taco-api/references/csv
"""
import csv
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "foods.ts"

# Porções caseiras (gramas) para alimentos comuns, casadas pelo nome exato da TACO.
PORTIONS = {
    "Ovo, de galinha, inteiro, cozido/10minutos": [("1 unidade", 50)],
    "Ovo, de galinha, inteiro, frito": [("1 unidade", 50)],
    "Ovo, de galinha, clara, cozida/10minutos": [("1 clara", 30)],
    "Banana, prata, crua": [("1 unidade média", 55)],
    "Banana, nanica, crua": [("1 unidade média", 90)],
    "Maçã, Fuji, com casca, crua": [("1 unidade média", 130)],
    "Pão, trigo, francês": [("1 pão", 50)],
    "Pão, trigo, forma, integral": [("1 fatia", 25)],
    "Arroz, tipo 1, cozido": [("1 colher de servir", 45), ("1 escumadeira", 90)],
    "Arroz, integral, cozido": [("1 colher de servir", 45), ("1 escumadeira", 90)],
    "Feijão, carioca, cozido": [("1 concha", 86)],
    "Feijão, preto, cozido": [("1 concha", 86)],
    "Frango, peito, sem pele, grelhado": [("1 filé médio", 100)],
    "Aveia, flocos, crua": [("1 colher de sopa", 15)],
    "Leite, de vaca, integral": [("1 copo (200 ml)", 206)],
    "Leite, de vaca, desnatado, UHT": [("1 copo (200 ml)", 206)],
    "Batata, doce, cozida": [("1 unidade média", 150)],
    "Azeite, de oliva, extra virgem": [("1 colher de sopa", 13)],
    "Queijo, minas, frescal": [("1 fatia", 30)],
    "Mamão, Papaia, cru": [("1/2 unidade", 140)],
    "Iogurte, natural": [("1 pote", 170)],
    "Cuscuz, de milho, cozido com sal": [("1 pedaço médio", 135)],
    "Tapioca, com manteiga": [("1 unidade", 70)],
}

# Itens que não existem na TACO mas são comuns em dieta de academia (valores médios de rótulos).
EXTRAS = [
    ("Whey protein concentrado (média de rótulos)", "Suplementos", 400, 78, 8, 6, 0, [("1 scoop (30 g)", 30)]),
    ("Whey protein isolado (média de rótulos)", "Suplementos", 370, 88, 3, 1, 0, [("1 scoop (30 g)", 30)]),
    ("Pasta de amendoim integral (média de rótulos)", "Suplementos", 600, 27, 18, 48, 7, [("1 colher de sopa", 15)]),
    ("Goma de tapioca hidratada (média de rótulos)", "Suplementos", 240, 0, 60, 0, 0, [("1 tapioca", 70)]),
    ("Creatina monohidratada", "Suplementos", 0, 0, 0, 0, 0, [("1 dose", 3)]),
    ("Barra de proteína (média de rótulos)", "Suplementos", 370, 30, 38, 12, 6, [("1 barra", 45)]),
    ("Albumina em pó (média de rótulos)", "Suplementos", 380, 80, 8, 0, 0, [("1 colher de sopa", 15)]),
]


# A TACO não traz dados para alguns itens importantes; usamos valores de referência (rótulos de mercado).
OVERRIDES = {
    "Leite, de vaca, integral": (61, 3.2, 4.7, 3.3, 0),
    "Leite, de vaca, desnatado, UHT": (35, 3.4, 4.9, 0.2, 0),
}
DROP_IF_EMPTY_EXCEPT = ("Sal",)


def num(v: str) -> float:
    v = str(v if v is not None else "").strip()
    try:
        return round(float(v), 1)
    except ValueError:
        return 0.0  # NA, Tr, vazio


def main(csv_dir: str) -> None:
    d = pathlib.Path(csv_dir)
    cats = {r["id"]: r["name"] for r in csv.DictReader(open(d / "categories.csv", encoding="utf-8"))}
    nutr = {r["foodId"]: r for r in csv.DictReader(open(d / "nutrients.csv", encoding="utf-8"))}
    rows = []
    for r in csv.DictReader(open(d / "food.csv", encoding="utf-8")):
        n = nutr.get(r["id"])
        if not n:
            continue
        name = r["name"].strip()
        if name in OVERRIDES:
            k, p_, c_, g_, f_ = OVERRIDES[name]
            n = {**n, "kcal": k, "protein": p_, "carbohydrates": c_, "lipids": g_, "dietaryFiber": f_}
        if num(str(n["kcal"])) == 0 and not name.startswith(DROP_IF_EMPTY_EXCEPT):
            continue  # sem dados na TACO
        rows.append({
            "id": f"t{r['id']}",
            "nome": r["name"].strip(),
            "cat": cats[r["categoryId"]],
            "kcal": num(n["kcal"]),
            "p": num(n["protein"]),
            "c": num(n["carbohydrates"]),
            "g": num(n["lipids"]),
            "f": num(n["dietaryFiber"]),
            **({"porcoes": [{"nome": a, "g": b} for a, b in PORTIONS[r["name"].strip()]]} if r["name"].strip() in PORTIONS else {}),
        })
    for i, (nome, cat, kcal, p, c, g, f, por) in enumerate(EXTRAS, 1):
        rows.append({"id": f"x{i}", "nome": nome, "cat": cat, "kcal": kcal, "p": p, "c": c, "g": g, "f": f,
                     "porcoes": [{"nome": a, "g": b} for a, b in por]})
    missing = set(PORTIONS) - {r["nome"] for r in rows}
    if missing:
        print("Porções sem alimento correspondente:", missing, file=sys.stderr)
    body = ",\n".join("  " + json.dumps(r, ensure_ascii=False) for r in rows)
    OUT.write_text(
        "// Gerado por scripts/build_foods.py — não edite à mão.\n"
        "// Fonte: TACO – Tabela Brasileira de Composição de Alimentos (NEPA/UNICAMP), valores por 100 g.\n"
        "import { Food } from '../lib/nutritionTypes';\n\n"
        f"export const FOODS: Food[] = [\n{body},\n];\n",
        encoding="utf-8",
    )
    print(f"{len(rows)} alimentos")


if __name__ == "__main__":
    main(sys.argv[1])

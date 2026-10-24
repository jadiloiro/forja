"""
Baixa as imagens de execução (2 quadros por exercício) do free-exercise-db
(https://github.com/yuhonas/free-exercise-db — domínio público / Unlicense),
reduz o tamanho e gera src/data/exerciseImages.ts com os require() estáticos.

Uso:  python3 scripts/fetch_exercise_images.py
Requer: pip install pillow
"""
import io
import pathlib
import re
import sys
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "data" / "exercises.ts"
OUT_DIR = ROOT / "assets" / "exercises"
OUT_TS = ROOT / "src" / "data" / "exerciseImages.ts"
BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"
WIDTH = 480


def main() -> None:
    names = sorted(set(re.findall(r"img: '([^']+)'", SRC.read_text(encoding="utf-8"))))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    lines = [
        "// Gerado por scripts/fetch_exercise_images.py — não edite à mão.",
        "// Imagens: free-exercise-db (domínio público).",
        "export const EXERCISE_IMAGES: Record<string, [number, number]> = {",
    ]
    for name in names:
        safe = re.sub(r"[^A-Za-z0-9_-]", "_", name)
        for frame in (0, 1):
            dest = OUT_DIR / f"{safe}_{frame}.jpg"
            if not dest.exists():
                url = f"{BASE}/{name}/{frame}.jpg"
                try:
                    data = urllib.request.urlopen(url, timeout=30).read()
                except Exception as exc:  # noqa: BLE001
                    print(f"falhou {url}: {exc}", file=sys.stderr)
                    sys.exit(1)
                im = Image.open(io.BytesIO(data)).convert("RGB")
                h = round(im.height * WIDTH / im.width)
                im.resize((WIDTH, h), Image.LANCZOS).save(dest, "JPEG", quality=72, optimize=True)
        lines.append(
            f"  '{name}': [require('../../assets/exercises/{safe}_0.jpg'), require('../../assets/exercises/{safe}_1.jpg')],"
        )
    lines.append("};")
    OUT_TS.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(names)} exercícios, imagens em {OUT_DIR}")


if __name__ == "__main__":
    main()

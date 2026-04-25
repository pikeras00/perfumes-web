#!/usr/bin/env python3
"""
build_photos.py  — reset completo
Copia TODOS los archivos de v2 a "Carpetas famosos" con nombres en minúsculas,
luego genera photo_map.js mapeando celebrities a esos filenames reales.
"""

import re, unicodedata, json, shutil
from pathlib import Path
from PIL import Image

BASE = Path("C:/Escritorio/Entradas/Perfumesweb")
SRC_FOLDERS = [
    BASE / "Carpeta Fotos Famosos v2" / "CARPETA FAMOSOS (A-I)",
    BASE / "Carpeta Fotos Famosos v2" / "CARPETA FAMOSOS (J-Q)",
    BASE / "Carpeta Fotos Famosos v2" / "CARPETA FAMOSOS (R-Z)v2",
]
DST = BASE / "Carpetas famosos"

MAX_KB = 250
MAX_W  = 600

def normalize(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.lower()
    s = re.sub(r"[^a-z0-9]", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s

def compress(src: Path, dst: Path):
    try:
        img = Image.open(src).convert("RGB")
        w, h = img.size
        if w > MAX_W:
            img = img.resize((MAX_W, int(h * MAX_W / w)), Image.LANCZOS)
        q = 88
        while q >= 40:
            img.save(dst, "JPEG", quality=q, optimize=True)
            if dst.stat().st_size <= MAX_KB * 1024:
                break
            q -= 8
    except Exception as e:
        print(f"  ERROR {src.name}: {e}")
        shutil.copy2(src, dst)

# ── 1. Vaciar destino completamente ──────────────────────────────────────────
print("[1] Vaciando Carpetas famosos...")
if DST.exists():
    for f in DST.iterdir():
        f.unlink()
else:
    DST.mkdir()

# ── 2. Copiar TODOS los archivos de v2 con nombre en minúsculas ──────────────
print("[2] Copiando y comprimiendo desde v2...")
v2_files: dict[str, Path] = {}   # lower_stem → src path

for folder in SRC_FOLDERS:
    for f in sorted(folder.iterdir()):
        if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
            lower_stem = normalize(f.stem)
            dst_name   = lower_stem + ".jpg"
            dst_path   = DST / dst_name
            if lower_stem not in v2_files:          # sin duplicados
                v2_files[lower_stem] = f
                compress(f, dst_path)

print(f"    Copiados: {len(v2_files)} archivos")

# ── 3. Leer celebrities ───────────────────────────────────────────────────────
data_js = (BASE / "data.js").read_text(encoding="utf-8")
celebs  = list(dict.fromkeys(re.findall(r'"nombre"\s*:\s*"([^"]+)"', data_js)))
print(f"[3] Celebrities en data.js: {len(celebs)}")

# ── 4. Matching celebrity → v2 filename ──────────────────────────────────────
# Aliases para celebrities cuyos nombres en data.js difieren del filename de v2
ALIASES: dict[str, str] = {
    # norm(celeb_name) : lower_stem_del_archivo_en_v2
    "d_o":                    "do_kyung_soo",
    "anne_hathaway":          "anne_hathawaye",
    "chanel_terrero":         "chanel",
    "dina_asher_smith":       "dina_asher",
    "iker_casillas":          "casillas",
    "neymar":                 "neymar_jr",
    "vivien_leigh":           "vivien_leigh_scarlet",
    "winston_churchill":      "churchill",
    "sylvester_stallone":     "sylvester_stallone_cannes",
    "adam_driver":            "adamdriver",
    "alycia_debnam_carey":    "alyciadebnamcarey",
    "ben_affleck":            "benaffleck",
    "billie_elish":           "billie_eilish",
    "carla_gugino":           "carla_guino",
    "cha_eunwoo":             "cha_eun_woo",
    "chappel_roan":           "chappell_roan",
    "jake_gyllenhal":         "jake_gyllenhaal",
    "karl_max":               "karl_marx",
    "marily_manson":          "marilyn_manson",
    "matthew_mcconughey":     "matthew_mcconaughey",
    "mila_jovovich":          "milla_jovovich",
    "paula_echeverria":       "paula_echevarria",
    "quim_guitierrez":        "quim_gutierrez",
    "raw_alejandro":          "rauw_alejandro",
    "reese_witherspoon":      "reese_whiterspoon",
    "samantha_boardman":      "samantha_broadman",
    "sarah_mclaughlin":       "sarah_mclachlan",
    "sean_penn":              "seann_penn",
    "shaquille_o_neal":       "shaquille_oneal",
    "sophie_duez":            "sophieduez",
    "steve_harvey":           "steveharvey",
    "tiffani_amber_thiessen": "tiffani_thiessen",
    "trisha_yearwood":        "trishayearwood",
    "vanessa_minnillo":       "vanessa_minillojpg",
    "victoria_beckham":       "victoriabeckham",
    "vinicius_jr":            "vinicius_junior",
    "yoo_ahin":               "yoo_ah_in",
}

WIKI: dict[str, str] = {
    "Eddie Murphy":          "Eddie_Murphy",
    "Emily Osment":          "Emily_Osment",
    "Floyd Mayweather Jr.":  "Floyd_Mayweather_Jr.",
    "Gabriel Guevara":       "Gabriel_Guevara_(actor)",
    "Gemma Arterton":        "Gemma_Arterton",
    "Georgina Rodriguez":    "Georgina_Rodríguez",
    "Gwyneth Paltrow":       "Gwyneth_Paltrow",
    "Halle Berry":           "Halle_Berry",
    "Hiba Abouk":            "Hiba_Abouk",
    "Hongseok":              "Pentagon_(South_Korean_band)",
    "Hugh Jackman":          "Hugh_Jackman",
    "Hwang Minhyun":         "Hwang_Min-hyun",
    "Ilia Topuria":          "Ilia_Topuria",
}

photo_map: dict[str, str] = {}
missing: list[str] = []

for celeb in celebs:
    key = normalize(celeb)
    stem = ALIASES.get(key) or (key if key in v2_files else None)
    if stem and stem in v2_files:
        photo_map[celeb] = stem + ".jpg"
    else:
        missing.append(celeb)

print(f"[4] Mapeados local: {sum(1 for v in photo_map.values() if not v.startswith('http'))}")
print(f"    Wikipedia: {sum(1 for v in photo_map.values() if v.startswith('http'))}")
print(f"    Sin foto:  {len(missing)}")

# Sin foto local → simplemente no se incluyen en el mapa
for celeb in missing:
    print(f"    Sin foto local: {celeb}")

# ── 5. Escribir photo_map.js ─────────────────────────────────────────────────
out = "const PHOTO_MAP = " + json.dumps(photo_map, ensure_ascii=False) + ";"
(BASE / "photo_map.js").write_text(out, encoding="utf-8")
print(f"[5] photo_map.js escrito ({len(photo_map)} entradas)")

total_mb = sum(f.stat().st_size for f in DST.glob("*.jpg")) / 1024 / 1024
print(f"[6] Total en Carpetas famosos: {len(list(DST.glob('*.jpg')))} archivos, {total_mb:.1f} MB")

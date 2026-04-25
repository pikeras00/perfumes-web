#!/usr/bin/env python3
"""
build_photos.py
Copia y comprime imágenes de "Carpeta Fotos Famosos v2" a "Carpetas famosos",
luego genera un nuevo photo_map.js con rutas locales (o Wikipedia como fallback).
"""

import os, re, json, shutil, unicodedata
from pathlib import Path
from PIL import Image

BASE = Path("C:/Escritorio/Entradas/Perfumesweb")
SRC_FOLDERS = [
    BASE / "Carpeta Fotos Famosos v2" / "CARPETA FAMOSOS (A-I)",
    BASE / "Carpeta Fotos Famosos v2" / "CARPETA FAMOSOS (J-Q)",
    BASE / "Carpeta Fotos Famosos v2" / "CARPETA FAMOSOS (R-Z)v2",
]
DST = BASE / "Carpetas famosos"
DST.mkdir(exist_ok=True)

MAX_SIZE_KB = 250
TARGET_W    = 600

# ── helpers ──────────────────────────────────────────────────────────────────
def normalize(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.lower()
    s = re.sub(r"[^a-z0-9]", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s

def compress_image(src: Path, dst: Path, max_kb=MAX_SIZE_KB, max_w=TARGET_W):
    try:
        img = Image.open(src).convert("RGB")
        w, h = img.size
        if w > max_w:
            ratio = max_w / w
            img = img.resize((max_w, int(h * ratio)), Image.LANCZOS)
        quality = 88
        while quality >= 40:
            img.save(dst, "JPEG", quality=quality, optimize=True)
            if dst.stat().st_size <= max_kb * 1024:
                break
            quality -= 8
    except Exception as e:
        print(f"  ⚠  Error comprimiendo {src.name}: {e}")
        shutil.copy2(src, dst)

# ── aliases ───────────────────────────────────────────────────────────────────
# Celebrities con foto local pero nombre distinto → normalized_celeb_name: stem_del_archivo
# Las claves son nombres YA normalizados (normalize(celeb_name)) para evitar problemas de encoding
LOCAL_ALIASES: dict[str, str] = {
    "adam_driver":             "adamdriver",
    "alycia_debnam_carey":     "alyciadebnamcarey",
    "ben_affleck":             "benaffleck",
    "billie_elish":            "billie_eilish",
    "carla_gugino":            "carla_guino",
    "cha_eunwoo":              "cha_eun_woo",
    "chappel_roan":            "chappell_roan",
    "jake_gyllenhal":          "jake_gyllenhaal",
    "karl_max":                "karl_marx",
    "marily_manson":           "marilyn_manson",
    "matthew_mcconughey":      "matthew_mcconaughey",
    "mila_jovovich":           "milla_jovovich",
    "paula_echeverria":        "paula_echevarria",
    "quim_guitierrez":         "quim_gutierrez",
    "raw_alejandro":           "rauw_alejandro",
    "reese_witherspoon":       "reese_whiterspoon",
    "samantha_boardman":       "samantha_broadman",
    "sarah_mclaughlin":        "sarah_mclachlan",
    "sean_penn":               "seann_penn",
    "shaquille_o_neal":        "shaquille_oneal",
    "sophie_duez":             "sophieduez",
    "steve_harvey":            "steveharvey",
    "tiffani_amber_thiessen":  "tiffani_thiessen",
    "trisha_yearwood":         "trishayearwood",
    "vanessa_minnillo":        "vanessa_minillojpg",
    "victoria_beckham":        "victoriabeckham",
    "vinicius_jr":             "vinicius_junior",
    "yoo_ahin":                "yoo_ah_in",
}

# Celebrities sin foto local → slug de Wikipedia
WIKI_ALIASES: dict[str, str] = {
    "Eddie Murphy":           "Eddie_Murphy",
    "Floyd Mayweather Jr.":   "Floyd_Mayweather_Jr.",
    "Gabriel Guevara":        "Gabriel_Guevara_(actor)",
    "Gemma Arterton":         "Gemma_Arterton",
    "Georgina Rodriguez":     "Georgina_Rodríguez",
    "Gwyneth Paltrow":        "Gwyneth_Paltrow",
    "Halle Berry":            "Halle_Berry",
    "Hiba Abouk":             "Hiba_Abouk",
    "Hongseok":               "Pentagon_(South_Korean_band)",
    "Hugh Jackman":           "Hugh_Jackman",
    "Hwang Minhyun":          "Hwang_Min-hyun",
    "Ilia Topuria":           "Ilia_Topuria",
}

def wiki_url(name: str) -> str:
    slug = WIKI_ALIASES.get(name, name.replace(" ", "_"))
    return f"https://en.wikipedia.org/wiki/Special:FilePath/{slug}.jpg?width=400"

# ── 1. Construir índice de imágenes disponibles ───────────────────────────────
available: dict[str, Path] = {}
for folder in SRC_FOLDERS:
    for f in sorted(folder.iterdir()):
        if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
            key = normalize(f.stem)
            if key not in available:
                available[key] = f

print(f"[1] Imágenes disponibles en v2: {len(available)}")

# ── 2. Leer celebrities de data.js ────────────────────────────────────────────
data_js = (BASE / "data.js").read_text(encoding="utf-8")
celebs = re.findall(r'"nombre"\s*:\s*"([^"]+)"', data_js)
celebs = list(dict.fromkeys(celebs))
print(f"[2] Celebrities en data.js: {len(celebs)}")

# ── 3. Matching celebrity → imagen ───────────────────────────────────────────
def match(celeb_name: str):
    key = normalize(celeb_name)
    if key in LOCAL_ALIASES:
        alias_key = normalize(LOCAL_ALIASES[key])
        if alias_key in available:
            return available[alias_key]
    if key in available:
        return available[key]
    parts = key.split("_")
    if len(parts) >= 2:
        rev = "_".join(reversed(parts))
        if rev in available:
            return available[rev]
    for k in available:
        if key in k or k in key:
            return available[k]
    return None

photo_map: dict[str, str] = {}
missing:   list[str] = []
copied = 0

for celeb in celebs:
    src_path = match(celeb)
    if src_path:
        dst_name = normalize(celeb) + ".jpg"
        dst_path = DST / dst_name
        if not dst_path.exists() or dst_path.stat().st_mtime < src_path.stat().st_mtime:
            compress_image(src_path, dst_path)
            copied += 1
        photo_map[celeb] = dst_name
    else:
        missing.append(celeb)

print(f"[3] Copiadas/comprimidas: {copied}  |  Sin foto local: {len(missing)}")

# ── 4. Fallback Wikipedia ─────────────────────────────────────────────────────
for celeb in missing:
    photo_map[celeb] = wiki_url(celeb)

# ── 5. Generar photo_map.js ──────────────────────────────────────────────────
out_js = "const PHOTO_MAP = " + json.dumps(photo_map, ensure_ascii=False, indent=None) + ";"
(BASE / "photo_map.js").write_text(out_js, encoding="utf-8")
print(f"[5] photo_map.js escrito con {len(photo_map)} entradas")

# ── 6. Resumen final ──────────────────────────────────────────────────────────
total_kb = sum(f.stat().st_size for f in DST.glob("*.jpg")) / 1024
print(f"[6] Carpeta destino: {DST}")
print(f"    Total imágenes: {len(list(DST.glob('*.jpg')))}")
print(f"    Tamaño total: {total_kb/1024:.1f} MB")

if missing:
    print(f"\n[!] {len(missing)} celebrities con fallback Wikipedia:")
    for m in missing:
        print(f"    - {m}")

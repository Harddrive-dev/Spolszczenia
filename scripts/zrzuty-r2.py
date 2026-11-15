# Zrzuty ekranu z gier (galeria „Jak to wygląda po polsku” na stronach gier). Wszystko w jednym folderze gry:
#   zrzuty/<klucz-gry>/1.webp            – zrzut (pokazywany po kliknięciu)
#   zrzuty/<klucz-gry>/1-miniatura.webp  – miniaturka robiona przez automat (nie ruszać ręcznie)
#   zrzuty/<klucz-gry>/podpis.txt        – opcjonalnie tekst pod galerią (np. „Zrzuty: Ryszard Chojnowski”)
# Klucz = końcówka adresu strony gry. Kolejność w galerii = numery w nazwach (1, 2, 3, ...).
# Właściciel wgrywa obrazki (PNG/JPG/WebP, dowolny rozmiar). Automat (krok w sync.yml) co 30 min:
#  - każdy nowy zrzut (bez znaku wodnego) zamienia na lekki WebP (maks. 1920 px, jakość 90) ze znakiem wodnym
#    „grypopolsku.pl” pod tą samą nazwą (.webp), stary plik usuwa; oryginałów NIE zachowuje (właściciel ma je u siebie),
#    plik ze znakiem dostaje w R2 metadane znak=1, więc znak nie jest dodawany drugi raz,
#  - przy tym robi z czystego obrazka miniaturkę <nazwa>-miniatura.webp (maks. 640 px, bez znaku),
#  - usuwa miniaturki bez zrzutu,
#  - wpisuje listę do spolszczenia.json (pole „zrzuty”: [{"d": zrzut, "m": miniaturka}], „zrzutyPodpis”);
#    adresy mają na końcu ?v=<skrót pliku>, więc po podmianie zrzutu przeglądarki od razu biorą nowy.
# Klucze R2 tylko w sekretach GitHuba: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID.
import os, io, json, re, hashlib
from PIL import Image, ImageDraw, ImageFont
import boto3
from botocore.config import Config

CDN = "https://cdn.grypopolsku.pl/"
BUCKET = "grypopolsku"
SRC = "zrzuty/"
STARY_WEB = "zrzuty-web/"            # dawny osobny folder (do 15.11) – automat go sprząta
MAX_D, MAX_M, MAX_ORYG = 1920, 640, 1024 * 1024
OBRAZ = re.compile(r"\.(png|jpe?g|webp|gif|bmp)$", re.I)
MINI = "-miniatura.webp"

s3 = boto3.client(
    "s3",
    endpoint_url="https://%s.r2.cloudflarestorage.com" % os.environ["R2_ACCOUNT_ID"],
    aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
    region_name="auto",
    config=Config(request_checksum_calculation="when_required", response_checksum_validation="when_required"),
)

def lista(prefix):
    out = {}
    for strona in s3.get_paginator("list_objects_v2").paginate(Bucket=BUCKET, Prefix=prefix):
        for o in strona.get("Contents", []):
            out[o["Key"]] = o
    return out

def slug(t):
    import unicodedata
    t = str(t).lower().replace("ł", "l")
    t = "".join(c for c in unicodedata.normalize("NFD", t) if not unicodedata.combining(c))
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", t))

def nat(s):  # 2.webp przed 10.webp
    return [int(x) if x.isdigit() else x.lower() for x in re.split(r"(\d+)", s)]

def zmniejsz(im, szer):
    return im.resize((szer, round(im.height * szer / im.width)), Image.LANCZOS) if im.width > szer else im

def webp(im, jakosc):
    b = io.BytesIO()
    im.save(b, "WEBP", quality=jakosc, method=6)
    return b.getvalue()

def czcionka(rozmiar):
    for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(f, rozmiar)
        except OSError:
            pass
    return ImageFont.load_default(size=rozmiar)

def znak_wodny(im, tekst="grypopolsku.pl", krycie=0.09, kat=25, kolumny=4):
    # ukośny, powtarzany napis: biały z cienkim ciemnym obrysem (widać go na jasnych i ciemnych zrzutach)
    im = im.convert("RGBA"); W, H = im.size
    fs = max(14, round(W * 0.024)); f = czcionka(fs)
    D = int((W ** 2 + H ** 2) ** 0.5) + fs * 4
    warstwa = Image.new("RGBA", (D, D), (0, 0, 0, 0)); d = ImageDraw.Draw(warstwa)
    tw = d.textlength(tekst, font=f)
    krok_x = W / kolumny; krok_y = krok_x * 0.7
    a = round(255 * krycie); obrys = max(1, fs // 14)
    y, r = 0, 0
    while y < D:
        x = -tw + ((krok_x / 2) if r % 2 else 0)
        while x < D:
            d.text((x, y), tekst, font=f, fill=(255, 255, 255, a), stroke_width=obrys, stroke_fill=(0, 0, 0, round(a * 0.7)))
            x += krok_x
        y += krok_y; r += 1
    warstwa = warstwa.rotate(kat, resample=Image.BICUBIC)
    l, t = (D - W) // 2, (D - H) // 2
    im.alpha_composite(warstwa.crop((l, t, l + W, t + H)))
    return im.convert("RGB")

def ma_znak(k):
    try:
        return s3.head_object(Bucket=BUCKET, Key=k).get("Metadata", {}).get("znak") == "1"
    except Exception:
        return False

def skrot(o):
    return hashlib.sha1(str(o.get("ETag", "")).strip('"').encode()).hexdigest()[:8]

zrodla = lista(SRC)
gry = json.load(open("spolszczenia.json", encoding="utf-8"))
klucze = {}
for g in gry:
    k = g.get("id") or slug(g.get("game") or "")
    if k:
        klucze.setdefault(k, []).append(g)

foldery, miniatury, podpisy = {}, {}, {}
for k in zrodla:
    czesci = k[len(SRC):].split("/")
    if len(czesci) != 2 or not czesci[1]:
        continue
    gra, plik = czesci
    if plik.lower() == "podpis.txt":
        podpisy[gra] = k
    elif plik.lower().endswith(MINI):
        miniatury[k] = gra
    elif OBRAZ.search(plik):
        foldery.setdefault(gra, []).append(k)

bledy, galerie, nowe = [], {}, 0
# 1) nowe zrzuty (bez znaku wodnego, duże albo nie-WebP) -> WebP ze znakiem wodnym + miniaturka z czystego obrazka
for gra, pliki in foldery.items():
    for i, k in enumerate(list(pliki)):
        o = zrodla[k]
        if o.get("Size", 0) <= MAX_ORYG and k.lower().endswith(".webp") and ma_znak(k):
            continue
        nowy = os.path.splitext(k)[0] + ".webp"
        if nowy != k and nowy in zrodla:
            continue  # jest już plik o tej nazwie – nic nie ruszamy
        km = os.path.splitext(k)[0] + MINI
        try:
            im = Image.open(io.BytesIO(s3.get_object(Bucket=BUCKET, Key=k)["Body"].read())).convert("RGB")
            b = webp(znak_wodny(zmniejsz(im, MAX_D)), 90)
            bm = webp(zmniejsz(im, MAX_M), 78)
            r = s3.put_object(Bucket=BUCKET, Key=nowy, Body=b, ContentType="image/webp", CacheControl="public, max-age=31536000", Metadata={"znak": "1"})
            rm = s3.put_object(Bucket=BUCKET, Key=km, Body=bm, ContentType="image/webp", CacheControl="public, max-age=31536000")
            if nowy != k:
                s3.delete_object(Bucket=BUCKET, Key=k)
                zrodla.pop(k, None)
            zrodla[nowy] = {"Key": nowy, "ETag": r["ETag"], "Size": len(b)}
            zrodla[km] = {"Key": km, "ETag": rm["ETag"], "Size": len(bm)}
            miniatury[km] = gra
            pliki[i] = nowy
            nowe += 1
            print("Znak wodny + miniaturka: %s (%d KB) -> %s (%d KB)" % (k, o.get("Size", 0) // 1024, nowy, len(b) // 1024))
        except Exception as e:
            bledy.append("nie udało się przerobić %s: %s" % (k, str(e)[:150]))

# 2) miniaturki + lista do galerii
potrzebne = set()
for gra, pliki in sorted(foldery.items()):
    if gra not in klucze:
        bledy.append("folder zrzuty/%s/ – nie ma gry o takim adresie (sprawdź końcówkę adresu strony gry)" % gra)
        continue
    lst = []
    for k in sorted(pliki, key=nat)[:12]:
        o = zrodla[k]
        km = os.path.splitext(k)[0] + MINI
        potrzebne.add(km)
        m = zrodla.get(km)
        # miniaturki nie ma (np. ktoś ją usunął) – robimy z zrzutu, który już ma znak wodny
        if not m:
            try:
                b = webp(zmniejsz(Image.open(io.BytesIO(s3.get_object(Bucket=BUCKET, Key=k)["Body"].read())).convert("RGB"), MAX_M), 78)
                r = s3.put_object(Bucket=BUCKET, Key=km, Body=b, ContentType="image/webp", CacheControl="public, max-age=31536000")
                zrodla[km] = m = {"Key": km, "ETag": r["ETag"], "Size": len(b)}
                nowe += 1
                print("Miniaturka: %s" % km)
            except Exception as e:
                bledy.append("%s: %s" % (k, str(e)[:150]))
                continue
        lst.append({"d": CDN + k + "?v=" + skrot(o), "m": CDN + km + "?v=" + skrot(m)})
    if lst:
        galerie[gra] = lst

for gra, k in podpisy.items():
    if gra in galerie:
        try:
            t = s3.get_object(Bucket=BUCKET, Key=k)["Body"].read().decode("utf-8", "replace").strip()
            galerie[gra + "\0podpis"] = re.sub(r"\s+", " ", t)[:200]
        except Exception as e:
            bledy.append("%s: %s" % (k, str(e)[:150]))

# 3) katalog
zmiany = 0
for k, gs in klucze.items():
    for g in gs:
        nz, np_ = galerie.get(k), galerie.get(k + "\0podpis")
        if nz != g.get("zrzuty") or (np_ or None) != g.get("zrzutyPodpis"):
            zmiany += 1
            if nz: g["zrzuty"] = nz
            else: g.pop("zrzuty", None)
            if nz and np_: g["zrzutyPodpis"] = np_
            else: g.pop("zrzutyPodpis", None)
if zmiany:
    with open("spolszczenia.json", "w", encoding="utf-8") as f:
        f.write(json.dumps(gry, ensure_ascii=False, indent=2) + "\n")

# 4) sprzątanie: miniaturki bez zrzutu (tylko w folderach gier z katalogu) i dawny folder zrzuty-web/
stare = [k for k, gra in miniatury.items() if k not in potrzebne and (gra in klucze or gra not in foldery)]
stare += list(lista(STARY_WEB))
for i in range(0, len(stare), 1000):
    s3.delete_objects(Bucket=BUCKET, Delete={"Objects": [{"Key": k} for k in stare[i:i + 1000]], "Quiet": True})
for k in stare:
    print("Usunięto:", k)
print("Zrzuty: gier z galerią %d, nowych miniaturek %d, zmienionych wpisów %d." % (len([k for k in galerie if "\0" not in k]), nowe, zmiany))
for b in bledy:
    print("UWAGA:", b)

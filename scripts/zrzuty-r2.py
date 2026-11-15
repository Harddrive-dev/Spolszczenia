# Zrzuty ekranu z gier (galeria „Jak to wygląda po polsku” na stronach gier). Wszystko w jednym folderze gry:
#   zrzuty/<klucz-gry>/1.webp            – zrzut (pokazywany po kliknięciu)
#   zrzuty/<klucz-gry>/1-miniatura.webp  – miniaturka robiona przez automat (nie ruszać ręcznie)
#   zrzuty/<klucz-gry>/podpis.txt        – opcjonalnie tekst pod galerią (np. „Zrzuty: Ryszard Chojnowski”)
# Klucz = końcówka adresu strony gry. Kolejność w galerii = numery w nazwach (1, 2, 3, ...).
# Właściciel wgrywa obrazki (PNG/JPG/WebP, dowolny rozmiar). Automat (krok w sync.yml) co 30 min:
#  - duże albo nie-WebP pliki zamienia na lekki WebP (maks. 1920 px, jakość 90) pod tą samą nazwą (.webp), stary plik usuwa,
#  - robi miniaturkę <nazwa>-miniatura.webp (maks. 640 px) – na nowo, gdy zrzut się zmieni,
#  - usuwa miniaturki bez zrzutu,
#  - wpisuje listę do spolszczenia.json (pole „zrzuty”: [{"d": zrzut, "m": miniaturka}], „zrzutyPodpis”);
#    adresy mają na końcu ?v=<skrót pliku>, więc po podmianie zrzutu przeglądarki od razu biorą nowy.
# Klucze R2 tylko w sekretach GitHuba: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID.
import os, io, json, re, hashlib
from PIL import Image
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

def webp(dane, szer, jakosc):
    im = Image.open(io.BytesIO(dane)).convert("RGB")
    if im.width > szer:
        im = im.resize((szer, round(im.height * szer / im.width)), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, "WEBP", quality=jakosc, method=6)
    return b.getvalue()

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
# 1) duże albo nie-WebP pliki -> lekki WebP pod tą samą nazwą
for gra, pliki in foldery.items():
    for i, k in enumerate(list(pliki)):
        o = zrodla[k]
        if o.get("Size", 0) <= MAX_ORYG and k.lower().endswith(".webp"):
            continue
        nowy = os.path.splitext(k)[0] + ".webp"
        if nowy != k and nowy in zrodla:
            continue  # jest już plik o tej nazwie – nic nie ruszamy
        try:
            b = webp(s3.get_object(Bucket=BUCKET, Key=k)["Body"].read(), MAX_D, 90)
            r = s3.put_object(Bucket=BUCKET, Key=nowy, Body=b, ContentType="image/webp", CacheControl="public, max-age=31536000")
            if nowy != k:
                s3.delete_object(Bucket=BUCKET, Key=k)
                zrodla.pop(k, None)
            zrodla[nowy] = {"Key": nowy, "ETag": r["ETag"], "Size": len(b), "LastModified": None}
            pliki[i] = nowy
            print("Zmniejszono: %s (%d KB) -> %s (%d KB)" % (k, o.get("Size", 0) // 1024, nowy, len(b) // 1024))
        except Exception as e:
            bledy.append("nie udało się zmniejszyć %s: %s" % (k, str(e)[:150]))

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
        # miniaturka do zrobienia: brak albo starsza niż zrzut (zrzut świeżo zmniejszony = LastModified None)
        if not m or o.get("LastModified") is None or (m.get("LastModified") and o["LastModified"] > m["LastModified"]):
            try:
                b = webp(s3.get_object(Bucket=BUCKET, Key=k)["Body"].read(), MAX_M, 78)
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

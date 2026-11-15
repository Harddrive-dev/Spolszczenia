# Zrzuty ekranu z gier (galeria „Jak to wygląda po polsku” na stronach gier).
# Właściciel wgrywa obrazki w panelu Cloudflare do folderu  zrzuty/<klucz-gry>/  (klucz = końcówka adresu strony gry,
# np. zrzuty/life-is-strange-remastered/1.png). Kolejność w galerii = kolejność nazw plików (1.png, 2.png, ...).
# Opcjonalnie plik  zrzuty/<klucz-gry>/podpis.txt  z tekstem pod galerią (np. „Zrzuty: Ryszard Chojnowski”).
# Automat (krok w sync.yml) co 30 min:
#  - robi z każdego obrazka WebP (maks. 1600 px szerokości) i miniaturkę (maks. 480 px) w  zrzuty-web/<klucz-gry>/,
#    nazwa zawiera skrót pliku, więc podmieniony obrazek dostaje nowy adres,
#  - wpisuje listę do spolszczenia.json (pole „zrzuty”: [{"d": duży, "m": miniaturka}], „zrzutyPodpis”),
#  - usuwa z zrzuty-web/ pliki, których już nic nie używa (oryginały w zrzuty/ zostają nietknięte).
# Klucze R2 tylko w sekretach GitHuba: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID.
import os, io, json, re, sys, hashlib
from PIL import Image
import boto3
from botocore.config import Config

CDN = "https://cdn.grypopolsku.pl/"
BUCKET = "grypopolsku"
SRC, WEB = "zrzuty/", "zrzuty-web/"
MAX_D, MAX_M = 1600, 480
OBRAZ = re.compile(r"\.(png|jpe?g|webp|gif|bmp)$", re.I)

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

def nat(s):  # 2.png przed 10.png
    return [int(x) if x.isdigit() else x.lower() for x in re.split(r"(\d+)", s)]

def webp(dane, szer, jakosc):
    im = Image.open(io.BytesIO(dane))
    im = im.convert("RGB")
    if im.width > szer:
        im = im.resize((szer, round(im.height * szer / im.width)), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, "WEBP", quality=jakosc, method=6)
    return b.getvalue()

zrodla, gotowe = lista(SRC), lista(WEB)
gry = json.load(open("spolszczenia.json", encoding="utf-8"))
klucze = {}
for g in gry:
    k = g.get("id") or slug(g.get("game") or "")
    if k:
        klucze.setdefault(k, []).append(g)

foldery = {}
podpisy = {}
for k in zrodla:
    czesci = k[len(SRC):].split("/")
    if len(czesci) != 2 or not czesci[1]:
        continue
    gra, plik = czesci
    if plik.lower() == "podpis.txt":
        podpisy[gra] = k
    elif OBRAZ.search(plik):
        foldery.setdefault(gra, []).append(k)

uzywane, nowe, bledy, galerie = set(), 0, [], {}
for gra, pliki in sorted(foldery.items()):
    if gra not in klucze:
        bledy.append("folder zrzuty/%s/ – nie ma gry o takim adresie (sprawdź końcówkę adresu strony gry)" % gra)
        continue
    lst = []
    for k in sorted(pliki, key=nat)[:12]:
        etag = zrodla[k]["ETag"].strip('"')
        nazwa = re.sub(r"[^a-z0-9]+", "-", os.path.splitext(k.rsplit("/", 1)[1])[0].lower()).strip("-") or "zrzut"
        skrot = hashlib.sha1(etag.encode()).hexdigest()[:8]
        kd, km = "%s%s/%s-%s.webp" % (WEB, gra, nazwa, skrot), "%s%s/%s-%s-m.webp" % (WEB, gra, nazwa, skrot)
        if kd not in gotowe or km not in gotowe:
            try:
                dane = s3.get_object(Bucket=BUCKET, Key=k)["Body"].read()
                for klucz, szer, jak in ((kd, MAX_D, 82), (km, MAX_M, 78)):
                    s3.put_object(Bucket=BUCKET, Key=klucz, Body=webp(dane, szer, jak), ContentType="image/webp",
                                  CacheControl="public, max-age=31536000, immutable")
                nowe += 1
                print("Nowy zrzut: %s -> %s" % (k, kd))
            except Exception as e:
                bledy.append("%s: %s" % (k, str(e)[:150]))
                continue
        uzywane.update((kd, km))
        lst.append({"d": CDN + kd, "m": CDN + km})
    if lst:
        galerie[gra] = lst

for gra, k in podpisy.items():
    if gra in galerie:
        try:
            t = s3.get_object(Bucket=BUCKET, Key=k)["Body"].read().decode("utf-8", "replace").strip()
            galerie[gra + "\0podpis"] = re.sub(r"\s+", " ", t)[:200]
        except Exception as e:
            bledy.append("%s: %s" % (k, str(e)[:150]))

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

# zrzuty-web/: usuwamy tylko pliki zrobione przez automat, których nic już nie używa (np. po podmianie obrazka)
if not bledy or galerie:
    stare = [k for k in gotowe if k not in uzywane]
    for i in range(0, len(stare), 1000):
        s3.delete_objects(Bucket=BUCKET, Delete={"Objects": [{"Key": k} for k in stare[i:i + 1000]], "Quiet": True})
    for k in stare:
        print("Usunięto nieużywany:", k)
print("Zrzuty: gier z galerią %d, nowych obrazków %d, zmienionych wpisów %d." % (len([k for k in galerie if "\0" not in k]), nowe, zmiany))
for b in bledy:
    print("UWAGA:", b)

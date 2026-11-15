# Przenosi okładki gier na Cloudflare R2 (adres https://cdn.grypopolsku.pl/okladki/...).
# - bierze gry z spolszczenia.json, których okładka (pole img) nie jest jeszcze na cdn.grypopolsku.pl,
# - pobiera obrazek, zmniejsza do szerokości maks. 400 px i zapisuje jako WebP (jakość 80),
# - wgrywa na R2 jako okladki/<klucz-gry>-<8 znaków skrótu>.webp (nazwa zmienia się razem z obrazkiem,
#   więc przeglądarki mogą trzymać plik w pamięci na zawsze),
# - zapisuje mapę stary adres -> nowy adres (scripts/okladki-r2-mapa.json), żeby dało się cofnąć.
# Tryby (zmienna TRYB): "proba" – tylko wgrywa i zapisuje raport na R2 (okladki/_raport.json), katalogu nie zmienia;
#                       "wgraj" – wgrywa i podmienia adresy w spolszczenia.json (krok zapisu robi workflow).
# LIMIT – ile gier (0 = wszystkie). GRY – opcjonalnie nazwy gier rozdzielone „;” (wtedy tylko te).
# Klucze R2 tylko w sekretach GitHuba: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID.
import os, io, json, re, sys, time, hashlib, unicodedata, urllib.request
from PIL import Image
import boto3
from botocore.config import Config

CDN = "https://cdn.grypopolsku.pl/"
BUCKET = "grypopolsku"
TRYB = os.environ.get("TRYB", "proba")
LIMIT = int(os.environ.get("LIMIT", "10") or 0)
GRY = [x.strip().lower() for x in os.environ.get("GRY", "").split(";") if x.strip()]
MAX_W, JAKOSC = 400, 80
MAPA_F = "scripts/okladki-r2-mapa.json"

def slug(t):
    t = str(t).lower().replace("ł", "l")
    t = "".join(c for c in unicodedata.normalize("NFD", t) if not unicodedata.combining(c))
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", t))

def key_of(g):
    return g.get("id") or slug(g.get("game") or "")

s3 = boto3.client(
    "s3",
    endpoint_url="https://%s.r2.cloudflarestorage.com" % os.environ["R2_ACCOUNT_ID"],
    aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
    region_name="auto",
    config=Config(request_checksum_calculation="when_required", response_checksum_validation="when_required"),
)

gry = json.load(open("spolszczenia.json", encoding="utf-8"))
kand, widziane = [], set()
for g in gry:
    img = g.get("img") or ""
    if not re.match(r"^https?://", img) or img.startswith(CDN):
        continue
    if GRY and (g.get("game") or "").lower() not in GRY:
        continue
    k = key_of(g)
    if (k, img) in widziane:
        continue
    widziane.add((k, img))
    kand.append((k, g.get("game"), img))
if LIMIT:
    kand = kand[:LIMIT]
print("Tryb: %s, do przeniesienia: %d" % (TRYB, len(kand)))

mapa = {}
if os.path.exists(MAPA_F):
    mapa = json.load(open(MAPA_F, encoding="utf-8"))
raport, bledy, przed, po = [], [], 0, 0
for i, (k, nazwa, url) in enumerate(kand, 1):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (GryPoPolsku.pl okladki)"})
        dane = urllib.request.urlopen(req, timeout=30).read()
        im = Image.open(io.BytesIO(dane))
        im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
        w0, h0 = im.size
        if w0 > MAX_W:
            im = im.resize((MAX_W, round(h0 * MAX_W / w0)), Image.LANCZOS)
        out = io.BytesIO()
        im.save(out, "WEBP", quality=JAKOSC, method=6)
        b = out.getvalue()
        nazwa_pliku = "okladki/%s-%s.webp" % (k, hashlib.sha1(b).hexdigest()[:8])
        s3.put_object(Bucket=BUCKET, Key=nazwa_pliku, Body=b, ContentType="image/webp",
                      CacheControl="public, max-age=31536000, immutable")
        nowy = CDN + nazwa_pliku
        mapa[url] = nowy
        przed += len(dane); po += len(b)
        raport.append({"game": nazwa, "stary": url, "nowy": nowy, "kb_przed": round(len(dane) / 1024, 1),
                       "kb_po": round(len(b) / 1024, 1), "wymiary_przed": [w0, h0], "wymiary_po": list(im.size)})
        print("%4d/%d OK  %-40s %6.1f KB -> %5.1f KB  %s" % (i, len(kand), (nazwa or "")[:40], len(dane) / 1024, len(b) / 1024, nazwa_pliku))
    except Exception as e:
        bledy.append({"game": nazwa, "stary": url, "blad": str(e)[:200]})
        print("%4d/%d BŁĄD %s: %s" % (i, len(kand), nazwa, e))
    time.sleep(0.2)

podsum = {"tryb": TRYB, "czas": time.strftime("%Y-%m-%d %H:%M:%S"), "ok": len(raport), "bledy": len(bledy),
          "kb_przed": round(przed / 1024), "kb_po": round(po / 1024), "gry": raport, "lista_bledow": bledy}
s3.put_object(Bucket=BUCKET, Key="okladki/_raport.json", Body=json.dumps(podsum, ensure_ascii=False, indent=1).encode(),
              ContentType="application/json; charset=utf-8", CacheControl="no-store")
print("Podsumowanie: OK %d, błędy %d, razem %d KB -> %d KB" % (len(raport), len(bledy), przed // 1024, po // 1024))
print("Raport: %sokladki/_raport.json" % CDN)

if TRYB == "wgraj":
    json.dump(mapa, open(MAPA_F, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(MAPA_F, "a").write("\n")
    print("Zapisano mapę (%d adresów) w %s" % (len(mapa), MAPA_F))

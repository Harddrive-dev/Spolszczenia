# Obrazki do Aktualności na R2 (folder aktualnosci/) – zamiana PNG/JPG na lekki WebP.
# Automat (krok w sync.yml, co 30 min):
#  1) dla każdego aktualnosci/<nazwa>.png|.jpg robi aktualnosci/<nazwa>.webp (maks. 1920 px, jakość 88),
#  2) robi kopię aktualnosci/<nazwa>.og.jpg (maks. 1200 px) – tylko do podglądu linku na Facebooku/Messengerze
#     (nie wszystkie serwisy pokazują WebP); news.mjs wpisuje ją w og:image. Kopia powstaje tylko dla obrazka,
#     który strony wpisów faktycznie podają do udostępniania (albo dla nowego obrazka, jeszcze nieużywanego na stronach);
#     kopie, których żadna strona nie używa (np. miniaturek), automat usuwa,
#  3) stary PNG/JPG usuwa dopiero wtedy, gdy jest już WebP i żadna strona w repozytorium (aktualnosci/, index.html)
#     nie odwołuje się do starego adresu – czyli po zmianie adresów we wpisach na .webp.
# Klucze R2 tylko w sekretach GitHuba: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID.
import os, io, re
from PIL import Image
import boto3
from botocore.config import Config

BUCKET, PREFIX = "grypopolsku", "aktualnosci/"
STARE = re.compile(r"\.(png|jpe?g)$", re.I)
OG = ".og.jpg"
s3 = boto3.client(
    "s3",
    endpoint_url="https://%s.r2.cloudflarestorage.com" % os.environ["R2_ACCOUNT_ID"],
    aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
    region_name="auto",
    config=Config(request_checksum_calculation="when_required", response_checksum_validation="when_required"),
)

def lista():
    out = set()
    for strona in s3.get_paginator("list_objects_v2").paginate(Bucket=BUCKET, Prefix=PREFIX):
        for o in strona.get("Contents", []):
            out.add(o["Key"])
    return out

def zapisz(im, szer, fmt, jakosc):
    if im.width > szer:
        im = im.resize((szer, round(im.height * szer / im.width)), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, fmt, quality=jakosc, **({"method": 6} if fmt == "WEBP" else {"optimize": True, "progressive": True}))
    return b.getvalue()

def odczyt(k):
    im = Image.open(io.BytesIO(s3.get_object(Bucket=BUCKET, Key=k)["Body"].read()))
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        tlo = Image.new("RGB", im.size, (17, 17, 17))
        tlo.paste(im, mask=im.split()[-1])
        return tlo
    return im.convert("RGB")

def uzywane():
    # adresy obrazków, do których odwołują się strony w repozytorium
    tekst = []
    for kat, _, pliki in os.walk("aktualnosci"):
        for p in pliki:
            if p.endswith((".html", ".json", ".js")):
                tekst.append(open(os.path.join(kat, p), encoding="utf-8", errors="replace").read())
    for p in ("index.html",):
        if os.path.exists(p):
            tekst.append(open(p, encoding="utf-8", errors="replace").read())
    return "\n".join(tekst)

klucze = lista()
bledy, zrobione = [], 0
for k in sorted(klucze):
    if k.lower().endswith(OG) or not STARE.search(k) or k.count("/") != 1:
        continue
    w = STARE.sub(".webp", k)
    if w in klucze:
        continue
    try:
        b = zapisz(odczyt(k), 1920, "WEBP", 88)
        s3.put_object(Bucket=BUCKET, Key=w, Body=b, ContentType="image/webp", CacheControl="public, max-age=86400")
        klucze.add(w); zrobione += 1
        print("WebP: %s -> %s (%d KB)" % (k, w, len(b) // 1024))
    except Exception as e:
        bledy.append("%s: %s" % (k, str(e)[:150]))

tekst = uzywane()
for w in sorted(x for x in klucze if x.endswith(".webp") and x.count("/") == 1):
    og = w[:-5] + OG
    if og in klucze:
        if og not in tekst and w in tekst:   # obrazek jest na stronach, ale nie do udostępniania (np. miniaturka)
            s3.delete_object(Bucket=BUCKET, Key=og); klucze.discard(og)
            print("Usunięto niepotrzebną kopię:", og)
        continue
    if w in tekst and og not in tekst:
        continue   # np. miniaturka – do udostępniania używany jest duży obraz
    try:
        b = zapisz(odczyt(w), 1200, "JPEG", 85)
        s3.put_object(Bucket=BUCKET, Key=og, Body=b, ContentType="image/jpeg", CacheControl="public, max-age=86400")
        klucze.add(og); zrobione += 1
        print("Do udostępniania: %s (%d KB)" % (og, len(b) // 1024))
    except Exception as e:
        bledy.append("%s: %s" % (w, str(e)[:150]))

for k in sorted(klucze):
    if k.lower().endswith(OG) or not STARE.search(k) or k.count("/") != 1:
        continue
    if STARE.sub(".webp", k) in klucze and k not in tekst:
        s3.delete_object(Bucket=BUCKET, Key=k)
        print("Usunięto stary plik (nieużywany, jest WebP):", k)
    elif STARE.sub(".webp", k) in klucze:
        print("Zostaje (strona jeszcze go używa):", k)

print("Aktualności na R2: przerobionych plików %d." % zrobione)
for b in bledy:
    print("UWAGA:", b)

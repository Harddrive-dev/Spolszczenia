# Wgrywa na Cloudflare R2 pliki z folderu do-r2/ w repozytorium (ta sama ścieżka: do-r2/aktualnosci/x.png -> aktualnosci/x.png,
# adres https://cdn.grypopolsku.pl/aktualnosci/x.png), a potem usuwa folder do-r2/ (workflow zapisuje usunięcie w repozytorium).
# Dozwolone foldery na R2: aktualnosci/ (obrazki do wpisów w Aktualnościach). Uruchamia go krok w sync.yml, gdy do-r2/ istnieje.
import os, sys, shutil, mimetypes
import boto3
from botocore.config import Config

DOZWOLONE = ("aktualnosci/",)
ZRODLO = "do-r2"
if not os.path.isdir(ZRODLO):
    print("Brak folderu do-r2/ – nic do wgrania."); sys.exit(0)
s3 = boto3.client(
    "s3",
    endpoint_url="https://%s.r2.cloudflarestorage.com" % os.environ["R2_ACCOUNT_ID"],
    aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
    region_name="auto",
    config=Config(request_checksum_calculation="when_required", response_checksum_validation="when_required"),
)
bledy = 0
for kat, _, pliki in os.walk(ZRODLO):
    for p in pliki:
        sciezka = os.path.join(kat, p)
        klucz = os.path.relpath(sciezka, ZRODLO).replace(os.sep, "/")
        if not klucz.startswith(DOZWOLONE) or ".." in klucz:
            print("POMIJAM (folder niedozwolony):", klucz); bledy += 1; continue
        typ = mimetypes.guess_type(p)[0] or "application/octet-stream"
        with open(sciezka, "rb") as f:
            s3.put_object(Bucket="grypopolsku", Key=klucz, Body=f.read(), ContentType=typ, CacheControl="public, max-age=86400")
        print("Wgrano: https://cdn.grypopolsku.pl/" + klucz)
if bledy:
    sys.exit("Część plików pominięto – folder do-r2/ zostaje.")
shutil.rmtree(ZRODLO)
print("Folder do-r2/ usunięty (pliki są na R2).")

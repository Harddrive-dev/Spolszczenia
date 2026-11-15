# Sprzątanie okładek na R2: usuwa pliki z folderu okladki/, których nie używa żadna gra w spolszczenia.json
# od co najmniej 30 dni (np. stara okładka po podmianie). Do tego czasu można jeszcze wrócić do starej okładki.
# Stan („od kiedy nieużywana”) jest w scripts/okladki-r2-nieuzywane.json. Uruchamia go raz dziennie (ok. 4:00) krok w sync.yml; ręcznie: Actions → „Aktualizuj spolszczenia.json” → Run workflow → „sprzątanie okładek”.
# Plików spoza okladki/ (np. test.webp) i raportu okladki/_raport.json nie rusza. Klucze tylko w sekretach GitHuba.
import os, json, datetime
import boto3
from botocore.config import Config

CDN = "https://cdn.grypopolsku.pl/"
BUCKET = "grypopolsku"
DNI = int(os.environ.get("DNI") or 30)
STAN_F = "scripts/okladki-r2-nieuzywane.json"
dzis = datetime.date.today()

s3 = boto3.client(
    "s3",
    endpoint_url="https://%s.r2.cloudflarestorage.com" % os.environ["R2_ACCOUNT_ID"],
    aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
    region_name="auto",
    config=Config(request_checksum_calculation="when_required", response_checksum_validation="when_required"),
)

gry = json.load(open("spolszczenia.json", encoding="utf-8"))
uzywane = set()
for g in gry:
    for v in [g.get("img")] + [s.get("img") for s in (g.get("spolszczenia") or []) if isinstance(s, dict)]:
        if isinstance(v, str) and v.startswith(CDN):
            uzywane.add(v[len(CDN):])
if len(uzywane) < 100:  # bezpiecznik: gdyby katalog wczytał się źle, nic nie usuwamy
    raise SystemExit("Za mało używanych okładek (%d) – przerywam, nic nie usuwam." % len(uzywane))

pliki = {}
for strona in s3.get_paginator("list_objects_v2").paginate(Bucket=BUCKET, Prefix="okladki/"):
    for o in strona.get("Contents", []):
        if o["Key"] != "okladki/_raport.json":
            pliki[o["Key"]] = o["LastModified"].date()

stan = json.load(open(STAN_F, encoding="utf-8")) if os.path.exists(STAN_F) else {}
nowy_stan, do_usuniecia = {}, []
for k, zmod in pliki.items():
    if k in uzywane:
        continue
    od = stan.get(k) or dzis.isoformat()
    nowy_stan[k] = od
    if (dzis - datetime.date.fromisoformat(od)).days >= DNI and (dzis - zmod).days >= DNI:
        do_usuniecia.append(k)

for i in range(0, len(do_usuniecia), 1000):
    s3.delete_objects(Bucket=BUCKET, Delete={"Objects": [{"Key": k} for k in do_usuniecia[i:i + 1000]], "Quiet": True})
for k in do_usuniecia:
    nowy_stan.pop(k, None)
    print("Usunięto:", k)

with open(STAN_F, "w", encoding="utf-8") as f:
    f.write(json.dumps(dict(sorted(nowy_stan.items())), ensure_ascii=False, indent=1) + "\n")
print("Plików w okladki/: %d, używanych: %d, nieużywanych (czeka %d dni): %d, usunięto: %d"
      % (len(pliki), len(uzywane & set(pliki)), DNI, len(nowy_stan), len(do_usuniecia)))

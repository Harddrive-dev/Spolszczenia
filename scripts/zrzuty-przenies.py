# Przenosi zrzuty ekranu jednej gry do innej karty na R2 (np. po podziale gry na osobne karty platform):
#   zrzuty/<z>/*  ->  zrzuty/<do>/*   (zrzuty + miniaturki, z metadanymi: znak wodny, „autor” do podpisu „Zrzuty od”)
# Uruchamiane ręcznie: Actions → „Przenieś zrzuty do innej karty” → Run workflow (pola: z, do).
# Bezpiecznik: jeśli w folderze docelowym są już jakieś pliki, nic nie robi.
import os, re, sys
import boto3
from botocore.config import Config

BUCKET = "grypopolsku"
OK = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
z, do = os.environ.get("Z", "").strip(), os.environ.get("DO", "").strip()
if not OK.match(z) or not OK.match(do) or z == do:
    sys.exit("Złe adresy gier: z=%r do=%r (tylko końcówki adresów, np. manhunt-2 i manhunt-2-psp)" % (z, do))

s3 = boto3.client(
    "s3",
    endpoint_url="https://%s.r2.cloudflarestorage.com" % os.environ["R2_ACCOUNT_ID"],
    aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
    region_name="auto",
    config=Config(request_checksum_calculation="when_required", response_checksum_validation="when_required"),
)

def klucze(prefix):
    out, tok = [], None
    while True:
        kw = {"Bucket": BUCKET, "Prefix": prefix}
        if tok: kw["ContinuationToken"] = tok
        r = s3.list_objects_v2(**kw)
        out += [o["Key"] for o in r.get("Contents", [])]
        if not r.get("IsTruncated"): return out
        tok = r["NextContinuationToken"]

zrodlo, cel = "zrzuty/%s/" % z, "zrzuty/%s/" % do
pliki = klucze(zrodlo)
if not pliki: sys.exit("Brak zrzutów w %s" % zrodlo)
if klucze(cel): sys.exit("W %s już są pliki – przerywam, żeby niczego nie nadpisać." % cel)
for k in pliki:
    nowy = cel + k[len(zrodlo):]
    s3.copy_object(Bucket=BUCKET, Key=nowy, CopySource={"Bucket": BUCKET, "Key": k}, MetadataDirective="COPY")
    print("skopiowano", k, "->", nowy)
for k in pliki:
    s3.delete_object(Bucket=BUCKET, Key=k)
print("Przeniesiono %d plików z %s do %s" % (len(pliki), zrodlo, cel))

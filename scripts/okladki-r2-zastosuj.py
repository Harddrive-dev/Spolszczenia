# Podmienia adresy okładek w spolszczenia.json według scripts/okladki-r2-mapa.json (stary adres -> adres na cdn.grypopolsku.pl).
# Zmienia tylko te gry, które nadal mają dokładnie stary adres (jeśli ktoś w międzyczasie ustawił inną okładkę – zostaje).
# Cofnięcie: uruchomić z ODWROC=1 (nowy adres -> stary).
import json, os
MAPA_F = "scripts/okladki-r2-mapa.json"
mapa = json.load(open(MAPA_F, encoding="utf-8"))
if os.environ.get("ODWROC") == "1":
    mapa = {v: k for k, v in mapa.items()}
gry = json.load(open("spolszczenia.json", encoding="utf-8"))
n = 0
for g in gry:
    if g.get("img") in mapa:
        g["img"] = mapa[g["img"]]
        n += 1
with open("spolszczenia.json", "w", encoding="utf-8") as f:
    f.write(json.dumps(gry, ensure_ascii=False, indent=2) + "\n")
print("Podmieniono okładki w %d grach." % n)

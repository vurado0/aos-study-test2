# Baut src/dict.js aus den Übersetzungstabellen (Spalten: DE \t EN \t PL, Zahlen = §)
import json, os, glob
here = os.path.dirname(os.path.abspath(__file__))
D, bad = {}, []
for f in sorted(glob.glob(os.path.join(here, 'tr*.tsv'))):
    for i, l in enumerate(open(f, encoding='utf-8').read().split('\n')):
        if not l.strip():
            continue
        p = l.split('\t')
        if len(p) != 3:
            bad.append((f, i + 1, 'Spalten')); continue
        k, en, pl = p
        if en.count('§') != k.count('§') or pl.count('§') != k.count('§'):
            bad.append((f, i + 1, 'Platzhalter §'))
        D[k] = [en, pl]
open(os.path.join(here, '..', 'dict.js'), 'w', encoding='utf-8').write('const I18N_DICT=' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';')
print(len(D), 'Einträge'); [print('FEHLER', *b) for b in bad]

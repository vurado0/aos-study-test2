# AOS · Speicher-Trainer (Lab 2 + Theorie UD1/UD2)

Interaktive Lernseite für *Sistemas Operativos Avanzados* (UAH): Memory Management, Virtual Memory und Lab 2 (`sim_paging`).

**Öffnen:** `index.html` im Browser – keine Installation, kein Server nötig.

## Inhalt
- **Theorie UD1** – Gap-Allocation, Segmentation, Paging, Multilevel-Adressformat, TLB/EAT, Pentium, x86-64 canonical, Buffer Overflow & ASLR (jeweils mit Rechner/Simulator)
- **Theorie UD2** – Page-Fault-Animation, EAT mit PFs, Thrashing, Working Set, PFF, Buddy System, Replacement-Simulator (FIFO/LRU/OPT/2nd chance, Belady), NFU/Aging, Linux kswapd, W2K-Zustände, Mach
- **Lab 2** – HW vs. OS, zirkuläre Listen, `gen_trace`-Nachbau, kompletter `sim_paging`-Simulator (random, lru, fifo, fifo2ch, optimal), Code-Lückentexte, `calculate_ws`, Table 1
- **Prüfungstrainer** – zufällige Rechenaufgaben mit Lösung, Konzept-Quiz, Top-Fallen

## Bedienung
- Sprache: **DE / EN / PL** oben rechts (wird gemerkt)
- **☰ Inhalt ausblenden** klappt die linke Leiste ein → volle Breite
- Hell/Dunkel: ◐

## Entwicklung
Quellen liegen in `src/`, Übersetzungen in `src/i18n/tr*.tsv` (Spalten `DE ⇥ EN ⇥ PL`, Zahlen als `§`).
Nach Änderungen: `./build.sh` → erzeugt `index.html` neu.

Hinweis: `gen_trace` und `calculate_ws` sind im Browser nachgebaut; Zählwerte können vom Original abweichen. Table 1 zeigt die Originalwerte aus dem Lab.

"""Gera os sons do descanso em assets/sounds, sintetizados aqui mesmo (sem licença de terceiros)."""

import math
import struct
import wave
from pathlib import Path

RATE = 44100
OUT = Path(__file__).resolve().parent.parent / "assets" / "sounds"


def tone(freqs, dur, decay, volume=1.0):
    """Soma de senos (frequência, intensidade) com decaimento exponencial e ataque curto sem estalo."""
    total = sum(a for _, a in freqs)
    out = []
    for i in range(int(RATE * dur)):
        t = i / RATE
        env = math.exp(-t * decay) * min(1.0, t / 0.004) * min(1.0, (dur - t) / 0.01)
        s = sum(a * math.sin(2 * math.pi * f * t) for f, a in freqs) / total
        out.append(s * env * volume)
    return out


def silence(dur):
    return [0.0] * int(RATE * dur)


def mix(*parts):
    return [s for part in parts for s in part]


SOUNDS = {
    # Sino: duas batidas com harmônicos, soa e morre devagar.
    "sino": lambda: mix(
        tone([(880, 1), (1760, 0.5), (2640, 0.25), (3960, 0.1)], 0.45, 7),
        tone([(880, 1), (1760, 0.5), (2640, 0.25), (3960, 0.1)], 0.9, 5),
    ),
    # Bipes: três toques agudos, o mais fácil de ouvir na academia.
    "bipes": lambda: mix(
        tone([(1568, 1), (3136, 0.3)], 0.14, 4),
        silence(0.07),
        tone([(1568, 1), (3136, 0.3)], 0.14, 4),
        silence(0.07),
        tone([(2093, 1), (4186, 0.3)], 0.3, 6),
    ),
    # Gongo: grave e encorpado.
    "gongo": lambda: tone([(196, 1), (392, 0.7), (588, 0.5), (1046, 0.25)], 1.5, 3),
    # Aviso de 10 s: um toque curto e discreto.
    "aviso": lambda: tone([(1175, 1), (2350, 0.2)], 0.16, 14, volume=0.7),
}


def save(name, samples):
    peak = max(abs(s) for s in samples)
    gain = 0.89 / peak
    with wave.open(str(OUT / f"{name}.wav"), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(b"".join(struct.pack("<h", int(s * gain * 32767)) for s in samples))
    print(f"{name}.wav: {len(samples) / RATE:.2f} s")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, build in SOUNDS.items():
        save(name, build())

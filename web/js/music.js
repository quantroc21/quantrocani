/* =====================================================================
   SOUNDTRACK — Nhạc nền tự động:
   1) Nếu có file SHOW.music (vd: assets/music.mp3) và load được -> phát file đó.
   2) Nếu chưa có file -> tổng hợp nhạc Piano + Pad + Hộp nhạc bằng Web Audio.
   ===================================================================== */
(function () {
  const CHORDS = {
    prelude: [
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [164.81, 196.00, 246.94, 293.66], // Em7
      [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
      [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
    ],
    warm: [
      [174.61, 261.63, 329.63, 440.00], // Fmaj7
      [196.00, 246.94, 293.66, 392.00], // G6
      [220.00, 261.63, 329.63, 392.00], // Am7
      [130.81, 196.00, 246.94, 329.63], // Cmaj7
    ],
    tender: [
      [146.83, 220.00, 261.63, 349.23], // Dm7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [164.81, 196.00, 246.94, 329.63], // Em7
    ],
    hopeful: [
      [174.61, 220.00, 261.63, 349.23], // F
      [196.00, 246.94, 293.66, 392.00], // G
      [164.81, 196.00, 246.94, 329.63], // Em7
      [220.00, 261.63, 329.63, 440.00], // Am
    ],
    finale: [
      [174.61, 220.00, 261.63, 329.63, 523.25],
      [196.00, 246.94, 293.66, 392.00, 587.33],
      [220.00, 261.63, 329.63, 440.00, 659.25],
      [130.81, 196.00, 246.94, 329.63, 523.25],
    ],
  };

  const MELODY_POOL = [523.25, 587.33, 659.25, 783.99, 880.0, 987.77, 1046.5];

  class SoundtrackEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.delayL = null;
      this.delayR = null;
      this.audioEl = null;
      this.usingFile = false;
      this.playing = false;
      this.muted = false;
      this.mood = 'prelude';
      this.step = 0;
      this.timer = null;
      this.bellTimer = null;
    }

    _ensureCtx() {
      if (this.ctx) return this.ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      const ctx = (this.ctx = new AC());
      const master = (this.master = ctx.createGain());
      master.gain.value = 0.0001;

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      master.connect(comp).connect(ctx.destination);

      // Stereo ping-pong ambient delay tail
      this.delayL = ctx.createDelay(1.0);
      this.delayR = ctx.createDelay(1.0);
      this.delayL.delayTime.value = 0.34;
      this.delayR.delayTime.value = 0.48;
      const fbL = ctx.createGain();
      const fbR = ctx.createGain();
      fbL.gain.value = 0.32;
      fbR.gain.value = 0.28;
      const wet = ctx.createGain();
      wet.gain.value = 0.26;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1800;

      this.delayL.connect(fbL).connect(this.delayR);
      this.delayR.connect(fbR).connect(this.delayL);
      this.delayL.connect(lp);
      this.delayR.connect(lp);
      lp.connect(wet).connect(master);

      this.dryBus = master;
      this.wetBus = this.delayL;
      return ctx;
    }

    _playPadChord(freqs, durSec = 4.2) {
      const ctx = this.ctx;
      if (!ctx || !this.playing) return;
      const now = ctx.currentTime;

      // Sub-bass root
      const sub = ctx.createOscillator();
      const subG = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(freqs[0] * 0.5, now);
      subG.gain.setValueAtTime(0.0001, now);
      subG.gain.linearRampToValueAtTime(0.11, now + 0.8);
      subG.gain.exponentialRampToValueAtTime(0.0005, now + durSec);
      sub.connect(subG).connect(this.dryBus);
      sub.start(now);
      sub.stop(now + durSec + 0.1);

      // Warm pad voices
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const filt = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f, now);
        osc.detune.setValueAtTime((idx - 1.5) * 4.5, now);

        filt.type = 'lowpass';
        filt.frequency.setValueAtTime(950, now);
        filt.frequency.linearRampToValueAtTime(620, now + durSec);

        const amp = 0.042 / Math.sqrt(freqs.length);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(amp, now + 0.75);
        g.gain.exponentialRampToValueAtTime(0.0004, now + durSec);

        osc.connect(filt).connect(g);
        g.connect(this.dryBus);
        g.connect(this.wetBus);
        osc.start(now + idx * 0.04);
        osc.stop(now + durSec + 0.15);
      });
    }

    _playBellNote(freq, vol = 0.055, dur = 1.8) {
      const ctx = this.ctx;
      if (!ctx || !this.playing) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const over = ctx.createOscillator();
      const g = ctx.createGain();
      const og = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      over.type = 'triangle';
      over.frequency.setValueAtTime(freq * 2, now);

      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(vol, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0003, now + dur);

      og.gain.setValueAtTime(0.0001, now);
      og.gain.linearRampToValueAtTime(vol * 0.18, now + 0.01);
      og.gain.exponentialRampToValueAtTime(0.0002, now + dur * 0.55);

      osc.connect(g);
      over.connect(og);
      g.connect(this.dryBus);
      g.connect(this.wetBus);
      og.connect(this.wetBus);

      osc.start(now);
      over.start(now);
      osc.stop(now + dur + 0.05);
      over.stop(now + dur * 0.6 + 0.05);
    }

    _startGenerative() {
      const ctx = this._ensureCtx();
      if (!ctx) return;
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.setTargetAtTime(this.muted ? 0.0001 : 0.72, ctx.currentTime, 0.5);

      if (this.timer) clearInterval(this.timer);
      if (this.bellTimer) clearInterval(this.bellTimer);

      const tickChord = () => {
        if (!this.playing) return;
        const set = CHORDS[this.mood] || CHORDS.warm;
        const chord = set[this.step % set.length];
        this._playPadChord(chord, 4.3);
        // Arpeggiated piano shimmer
        chord.slice(1).forEach((f, i) => {
          setTimeout(() => {
            if (this.playing) this._playBellNote(f * 2, 0.036, 1.6);
          }, 260 + i * 320);
        });
        this.step++;
      };

      tickChord();
      this.timer = setInterval(tickChord, 4000);

      let bellStep = 0;
      this.bellTimer = setInterval(() => {
        if (!this.playing) return;
        if (Math.random() < 0.72) {
          const note = MELODY_POOL[(bellStep * 3 + Math.floor(Math.random() * 2)) % MELODY_POOL.length];
          this._playBellNote(note, this.mood === 'finale' ? 0.065 : 0.045, 2.0);
        }
        bellStep++;
      }, 1150);
    }

    start() {
      if (this.playing) return;
      this.playing = true;

      const src = window.SHOW && window.SHOW.music;
      if (src && !this.audioEl) {
        const audio = new Audio(src);
        audio.loop = true;
        audio.volume = this.muted ? 0 : 0.65;
        audio.addEventListener('canplaythrough', () => {
          if (!this.playing || this.usingFile) return;
          this.usingFile = true;
          audio.play().then(() => {
            // Fade out generative synth once real mp3 plays
            if (this.timer) clearInterval(this.timer);
            if (this.bellTimer) clearInterval(this.bellTimer);
            if (this.master && this.ctx) {
              this.master.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
            }
          }).catch(() => {
            this.usingFile = false;
          });
        }, { once: true });
        audio.addEventListener('error', () => {
          this.usingFile = false;
        }, { once: true });
        this.audioEl = audio;
      }

      if (this.usingFile && this.audioEl) {
        this.audioEl.volume = this.muted ? 0 : 0.65;
        this.audioEl.play().catch(() => this._startGenerative());
      } else {
        this._startGenerative();
      }
    }

    setMood(mood) {
      if (CHORDS[mood]) this.mood = mood;
    }

    toggle() {
      if (!this.playing) {
        this.muted = false;
        this.start();
        return true;
      }
      this.muted = !this.muted;
      if (this.audioEl && this.usingFile) {
        this.audioEl.volume = this.muted ? 0 : 0.65;
      }
      if (this.master && this.ctx) {
        this.master.gain.setTargetAtTime(this.muted ? 0.0001 : 0.72, this.ctx.currentTime, 0.25);
      }
      return !this.muted;
    }

    stop() {
      this.playing = false;
      if (this.timer) clearInterval(this.timer);
      if (this.bellTimer) clearInterval(this.bellTimer);
      if (this.audioEl) {
        this.audioEl.pause();
      }
      if (this.master && this.ctx) {
        this.master.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
      }
    }
  }

  window.Soundtrack = new SoundtrackEngine();
})();

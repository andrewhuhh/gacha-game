import { Howl } from 'howler'

// Create sound instances
const sounds = {
  pull: new Howl({
    src: ['/sounds/pull.mp3'],
    volume: 0.5
  }),
  reveal: new Howl({
    src: ['/sounds/reveal.mp3'],
    volume: 0.5
  }),
  rare: new Howl({
    src: ['/sounds/rare.mp3'],
    volume: 0.7
  }),
  superRare: new Howl({
    src: ['/sounds/super-rare.mp3'],
    volume: 0.7
  }),
  ultraRare: new Howl({
    src: ['/sounds/ultra-rare.mp3'],
    volume: 0.8
  }),
  legendary: new Howl({
    src: ['/sounds/legendary.mp3'],
    volume: 0.8
  }),
  mythic: new Howl({
    src: ['/sounds/mythic.mp3'],
    volume: 1
  }),
  save: new Howl({
    src: ['/sounds/save.mp3'],
    volume: 0.5
  }),
  sell: new Howl({
    src: ['/sounds/sell.mp3'],
    volume: 0.5
  })
}

export const playSound = (soundName: keyof typeof sounds) => {
  sounds[soundName].play()
}

// Global mute/unmute
export const setMuted = (muted: boolean) => {
  Howler.mute(muted)
}

// Global volume control (0-1)
export const setVolume = (volume: number) => {
  Howler.volume(volume)
} 
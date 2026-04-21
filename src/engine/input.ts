export interface InputState {
  forward: boolean
  backward: boolean
  strafeLeft: boolean
  strafeRight: boolean
  rotateLeft: boolean
  rotateRight: boolean
  primaryFire: boolean
  secondaryFire: boolean
  pause: boolean
  shop: boolean
}

export function createInput() {
  const pressed = new Set<string>()

  const onKeyDown = (event: KeyboardEvent) => {
    pressed.add(event.code)

    if (
      event.code === 'Space' ||
      event.code === 'ArrowUp' ||
      event.code === 'ArrowDown' ||
      event.code === 'ArrowLeft' ||
      event.code === 'ArrowRight'
    ) {
      event.preventDefault()
    }
  }

  const onKeyUp = (event: KeyboardEvent) => {
    pressed.delete(event.code)
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  return {
    getState(): InputState {
      return {
        forward: pressed.has('KeyW'),
        backward: pressed.has('KeyS'),
        strafeLeft: pressed.has('KeyD'),
        strafeRight: pressed.has('KeyA'),
        rotateLeft: pressed.has('KeyE'),
        rotateRight: pressed.has('KeyQ'),
        primaryFire: pressed.has('Space'),
        secondaryFire: pressed.has('KeyF'),
        pause: pressed.has('Escape'),
        shop: pressed.has('Tab'),
      }
    },
    dispose() {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    },
  }
}

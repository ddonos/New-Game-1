export interface LoopControls {
  stop: () => void
}

export function createFixedStepLoop(
  update: (fixedDeltaSeconds: number) => void,
  render: (alpha: number, elapsedSeconds: number) => void,
  fixedDeltaSeconds = 1 / 60,
): LoopControls {
  let accumulator = 0
  let lastTime = performance.now()
  let running = true

  const frame = (now: number) => {
    if (!running) {
      return
    }

    const deltaSeconds = Math.min((now - lastTime) / 1000, 0.1)
    lastTime = now
    accumulator += deltaSeconds

    while (accumulator >= fixedDeltaSeconds) {
      update(fixedDeltaSeconds)
      accumulator -= fixedDeltaSeconds
    }

    render(accumulator / fixedDeltaSeconds, now / 1000)
    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)

  return {
    stop() {
      running = false
    },
  }
}

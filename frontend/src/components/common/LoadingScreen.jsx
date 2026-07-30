import { Brand } from './Brand'

export function LoadingScreen() {
  return (
    <main className="loading-screen" aria-live="polite">
      <Brand />
      <span className="loading-screen__bar" aria-hidden="true" />
      <p>Đang tải hồ sơ làm việc...</p>
    </main>
  )
}

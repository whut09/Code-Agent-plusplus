import { LoginStatus } from './components/LoginStatus';

export function App() {
  return <LoginStatus lastSeenAt={Date.now()} />;
}

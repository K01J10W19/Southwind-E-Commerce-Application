import { Show, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/react'
import PageLoader from './components/PageLoader';
import Layout from './components/Layout';

function App() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <PageLoader />;

  return (
    <Layout>
        <header>
          <Show when="signed-out">
            <SignInButton mode='modal'/>
            <SignUpButton mode='modal'/>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </header>
        <h1 class="text-3xl font-bold underline">
          Hello world!
        </h1>
        <button className='btn btn-neutral'>Click Me!</button>
        <button className='btn btn-primary'>Click Me!</button>
        <button className='btn btn-secondary'>Click Me!</button>
    </Layout>
  );
}

export default App

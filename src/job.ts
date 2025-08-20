import { Container, disposeContainer, getContainer } from './core/index.js';

export async function job() {
  const container: Container = await getContainer();

  // TODO: write your code here

  await disposeContainer();
}

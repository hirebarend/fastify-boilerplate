import { Container, disposeContainer, getContainer } from './core';

export async function job() {
  const container: Container = await getContainer();

  // TODO

  await disposeContainer();
}

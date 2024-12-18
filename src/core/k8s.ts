import { KUBERNETES_CLIENT_CORE_V1_API } from './constants';

export async function persistCertificateAndKey(
  fqdn: string,
  certificate: string,
  key: Buffer,
): Promise<void> {
  const certificateBase64: string = Buffer.from(certificate).toString('base64');

  const keyBase64: string = key.toString('base64');

  const secrets = (
    await KUBERNETES_CLIENT_CORE_V1_API.listNamespacedSecret('default')
  ).body.items;

  const secretName: string = `${fqdn.replace(/\./g, '-')}-secret`;

  const secret = secrets.find((x) => x.metadata?.name === secretName);

  if (secret) {
    await KUBERNETES_CLIENT_CORE_V1_API.deleteNamespacedSecret(
      secretName,
      'default',
    );
  }

  await KUBERNETES_CLIENT_CORE_V1_API.createNamespacedSecret('default', {
    apiVersion: 'v1',
    data: {
      'tls.crt': certificateBase64,
      'tls.key': keyBase64,
    },
    kind: 'Secret',
    metadata: {
      name: secretName,
      namespace: 'default',
    },
    type: 'kubernetes.io/tls',
  });
}

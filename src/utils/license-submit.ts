export async function createLicenseRequestWithOptionalCertificate<T>(
  create: () => Promise<T>,
  upload: (created: T) => Promise<void>,
  hasCertificate: boolean,
) {
  const created = await create();
  if (hasCertificate) await upload(created);
  return created;
}

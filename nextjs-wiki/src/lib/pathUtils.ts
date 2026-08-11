/**
 * Normalize one user-entered Windows source-drive letter to uppercase.
 * A colon or path is invalid because the UI asks for exactly one character.
 */
export function normalizeWindowsDriveLetter(value: string): string {
  const match = value.trim().match(/^([A-Za-z])$/);
  return match ? match[1].toUpperCase() : '';
}

/**
 * Replace only the drive letter of an absolute Windows drive path.
 * Unix, relative, tilde, and UNC paths are returned unchanged.
 */
export function replaceWindowsDriveLetter(inputPath: string, sourceDrive: string): string {
  const normalizedDrive = normalizeWindowsDriveLetter(sourceDrive);

  if (!normalizedDrive || !/^[A-Za-z]:[\\/]/.test(inputPath)) {
    return inputPath;
  }

  return normalizedDrive + inputPath.slice(1);
}
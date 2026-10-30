const DELAY_MS = 800;

// Stands in for a backend: 123456 passes, anything else fails.
export function verifyCode(code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (code === '123456') resolve();
      else reject(new Error('Incorrect code'));
    }, DELAY_MS);
  });
}

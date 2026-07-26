// mirrors passwordProblem in server/services/authService.ts — the server still decides,
// this just saves a round trip to tell someone their password is too short
export function passwordProblem(password: string): string | undefined {
  if (password.length < 8) return "password must be at least 8 characters";
  if (!/\d/.test(password)) return "password must include at least one number";
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`';]/.test(password)) {
    return "password must include at least one special character";
  }
  return undefined;
}

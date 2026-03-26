export default function Register() {
  return (
    <div>
      <h1>Create Account</h1>

      <form method="POST" action="/api/register">
        <div>
          <label>Email</label>
          <input name="email" type="email" required />
        </div>

        <div>
          <label>Password</label>
          <input name="password" type="password" required />
        </div>

        <button type="submit">Register</button>
      </form>

      <p>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
}

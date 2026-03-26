export default function Login() {
  return (
    <div>
      <h1>Login</h1>

      <form method="POST" action="/api/login">
        <div>
          <label>Email</label>
          <input name="email" type="email" required />
        </div>

        <div>
          <label>Password</label>
          <input name="password" type="password" required />
        </div>

        <button type="submit">Login</button>
      </form>

      <p>
        No account? <a href="/register">Register</a>
      </p>
    </div>
  );
}

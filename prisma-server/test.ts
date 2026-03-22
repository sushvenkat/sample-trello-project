const baseURL = "http://localhost:3000/auth";

async function test() {
  try {
    // // Signup
    const signupRes = await fetch(`${baseURL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test12345@example.com",
        password: "12345678",
      }),
    });

    const signupData = await signupRes.json();
    console.log("Signup response:", signupData);

    // Login

    const loginRes = await fetch(`${baseURL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test12345@example.com",
        password: "12345678",
      }),
    });

    const loginData = await loginRes.json();
    console.log("Login response:", loginData);

  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
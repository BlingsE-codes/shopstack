import { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-container">
      {isLogin ? <Login /> : <Signup />}
      <p>
        {isLogin ? "Don't have an account?" : "Already have one?"}{" "}
        <span onClick={() => setIsLogin(!isLogin)} style={{ color: "blue", cursor: "pointer" }}>
          {isLogin ? "Sign Up" : "Login"}
        </span>
      </p>
    </div>
  );
}

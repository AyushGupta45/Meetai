"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function Home() {
  const { data: session } = authClient.useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = () => {
    authClient.signUp.email(
      {
        name,
        email,
        password,
      },
      {
        onSuccess: (ctx) => {
          window.alert("Success");
        },
        onError: () => {
          window.alert("Something went wrong");
        },
      }
    );
  };
  const onLogin = () => {
    authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onSuccess: (ctx) => {
          window.alert("Success");
        },
        onError: () => {
          window.alert("Something went wrong");
        },
      }
    );
  };

  if (session) {
    return (
      <>
        <p>Welcome {session.user.name}</p>
        <Button
          onClick={() => {
            authClient.signOut();
          }}
        >
          SignOut
        </Button>
      </>
    );
  }

  return (
    <div className="p-4">
      <Input
        placeholder="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button onClick={onSubmit}>Create User</Button>
      <hr />
      <Input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button onClick={onLogin}>Login</Button>
    </div>
  );
}

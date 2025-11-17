"use client";

export default function ReconnectGoogleButton() {
  const onClick = () => {
    window.location.href = "/api/auth/reconnect-google";
  };
  return (
    <button onClick={onClick} className="border px-3 py-2 rounded-lg">
      Reconnect Google
    </button>
  );
}


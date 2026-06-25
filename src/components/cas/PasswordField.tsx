import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { fieldCls } from "./CasShell";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export default function PasswordField(props: Props) {
  const [show, setShow] = useState(false);
  const { className, ...rest } = props;
  return (
    <div className="relative">
      <input
        {...rest}
        type={show ? "text" : "password"}
        className={`${className ?? fieldCls} pr-11`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-[#86868b] hover:text-[#1d1d1f] transition"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
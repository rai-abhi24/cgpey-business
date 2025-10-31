import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface InputFieldProps {
  id?: string;
  name: string;
  htmlFor: string;
  value: string;
  label: string;
  type?: string;
  maxLength?: number;
  pattern?: string;
  handleChange: any;
  placeholder?: string;
  required?: boolean;
  inputClassName?: string;
  labelClassName?: string;
  containerClassName?: string;
}

export default function InputField({
  id = "",
  name,
  value,
  htmlFor,
  label,
  type,
  pattern,
  maxLength,
  placeholder,
  handleChange,
  required = false,
  inputClassName = "",
  labelClassName = "",
  containerClassName = ""
}: InputFieldProps) {
  return (
    <div className={containerClassName}>
      <Label htmlFor={htmlFor} className={cn(labelClassName)}>
        {label}
        {required && <span className="text-red-500">&nbsp;*</span>}
      </Label>

      <Input
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        type={type}
        pattern={pattern}
        onChange={handleChange}
        maxLength={maxLength}
        required={required}
        className={cn('mt-1 h-12', inputClassName)}
      />
    </div>
  )
}
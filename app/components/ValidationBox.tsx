import { ValidationData } from "../types";

interface ValidationBoxProps {
  data: ValidationData;
}

export default function ValidationBox({ data }: ValidationBoxProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm text-slate-700">Details:</h3>
        <ul className="mt-2 space-y-1">
          <li className="text-sm text-slate-600">
            Valid: {data.isValid ? "Yes" : "No"}
          </li>
          <li className="text-sm text-slate-600">Message: {data.message}</li>
        </ul>
      </div>
    </div>
  );
}

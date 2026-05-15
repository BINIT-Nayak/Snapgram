import { Button } from "@/components/ui";

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

const ErrorState = ({
  message = "Something went wrong.",
  onRetry,
}: ErrorStateProps) => {
  return (
    <div className="flex-center flex-col gap-4 rounded-[24px] border border-dark-4 bg-dark-2 p-8 py-10 text-center shadow-xl shadow-black">
      <p className="body-medium text-light-1">{message}</p>
      {onRetry && (
        <Button type="button" className="shad-button_dark_4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;

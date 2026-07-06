type StatusMessageProps = {
  message?: string;
};

export function StatusMessage({ message }: StatusMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p className="status-message" role="status">
      {message}
    </p>
  );
}

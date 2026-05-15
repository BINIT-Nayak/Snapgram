type InlineSpinnerProps = {
  size?: number;
};

const InlineSpinner = ({ size = 18 }: InlineSpinnerProps) => (
  <img
    src="/assets/icons/loader.svg"
    alt=""
    width={size}
    height={size}
    className="animate-spin"
  />
);

export default InlineSpinner;
